import { adaptKakaoMealPlace, type KakaoMealPlaceRaw } from './plannerMealModel'
import type { SelectedMealPlace } from '../../shared/types/app'

type KakaoPlacesSearchStatus = 'OK' | 'ZERO_RESULT' | 'ERROR'

type KakaoPlacesInstance = {
  keywordSearch: (
    query: string,
    callback: (results: KakaoMealPlaceRaw[], status: KakaoPlacesSearchStatus) => void,
  ) => void
}

type KakaoMapsNamespace = {
  load: (callback: () => void) => void
  services?: {
    Places: new () => KakaoPlacesInstance
    Status?: {
      OK?: KakaoPlacesSearchStatus
      ZERO_RESULT?: KakaoPlacesSearchStatus
      ERROR?: KakaoPlacesSearchStatus
    }
  }
}

declare global {
  interface Window {
    kakao?: {
      maps?: KakaoMapsNamespace
    }
  }
}

export type KakaoMealSearchResult =
  | {
      status: 'ready'
      places: SelectedMealPlace[]
    }
  | {
      status: 'missing-key' | 'unavailable' | 'zero-result'
      places: []
    }

const kakaoSdkScriptId = 'lovv-kakao-maps-sdk'
const defaultKakaoMapsJavascriptKey =
  (import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY as string | undefined)?.trim() ||
  ''
let kakaoSdkPromise: Promise<KakaoMapsNamespace> | null = null

const getLoadedKakaoMaps = () =>
  window.kakao?.maps?.services?.Places ? window.kakao.maps : null

const loadKakaoMapsSdk = (javascriptKey: string) => {
  const loadedKakaoMaps = getLoadedKakaoMaps()

  if (loadedKakaoMaps) {
    return Promise.resolve(loadedKakaoMaps)
  }

  if (kakaoSdkPromise) {
    return kakaoSdkPromise
  }

  kakaoSdkPromise = new Promise<KakaoMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(kakaoSdkScriptId)

    if (existingScript) {
      existingScript.remove()
    }

    const timeoutId = window.setTimeout(() => {
      kakaoSdkPromise = null
      reject(new Error('Kakao Maps SDK timed out.'))
    }, 12000)

    const script = document.createElement('script')
    script.id = kakaoSdkScriptId
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(javascriptKey)}&libraries=services&autoload=false`
    script.addEventListener('load', () => {
      const kakaoMaps = window.kakao?.maps

      if (!kakaoMaps?.load) {
        window.clearTimeout(timeoutId)
        kakaoSdkPromise = null
        reject(new Error('Kakao Maps SDK unavailable.'))
        return
      }

      kakaoMaps.load(() => {
        window.clearTimeout(timeoutId)
        const loadedMaps = getLoadedKakaoMaps()

        if (loadedMaps) {
          resolve(loadedMaps)
        } else {
          kakaoSdkPromise = null
          reject(new Error('Kakao Places service unavailable.'))
        }
      })
    })
    script.addEventListener('error', () => {
      window.clearTimeout(timeoutId)
      kakaoSdkPromise = null
      reject(new Error('Kakao Maps SDK failed to load.'))
    })
    document.head.appendChild(script)
  }).catch((error) => {
    kakaoSdkPromise = null
    throw error
  })

  return kakaoSdkPromise
}

export const searchKakaoMealPlaces = async (
  query: string,
  javascriptKey = defaultKakaoMapsJavascriptKey,
): Promise<KakaoMealSearchResult> => {
  const trimmedQuery = query.trim()

  if (!trimmedQuery || !javascriptKey || typeof window === 'undefined') {
    return { status: 'missing-key', places: [] }
  }

  try {
    const kakaoMaps = await loadKakaoMapsSdk(javascriptKey)
    const Places = kakaoMaps.services?.Places

    if (!Places) {
      return { status: 'unavailable', places: [] }
    }

    const places = new Places()

    return await new Promise<KakaoMealSearchResult>((resolve) => {
      places.keywordSearch(trimmedQuery, (results, status) => {
        if (status === 'OK') {
          resolve({
            status: 'ready',
            places: results
              .map(adaptKakaoMealPlace)
              .filter((place): place is SelectedMealPlace => Boolean(place))
              .slice(0, 5),
          })
          return
        }

        resolve({
          status: status === 'ZERO_RESULT' ? 'zero-result' : 'unavailable',
          places: [],
        })
      })
    })
  } catch {
    return { status: 'unavailable', places: [] }
  }
}

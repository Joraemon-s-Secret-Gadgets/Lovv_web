import { describe, expect, it } from 'vitest'
import {
  DEFAULT_IMAGE_CDN_BASE_URL,
  buildAttractionImageKey,
  buildAttractionImageUrl,
  romanizeAttractionTitle,
  romanizeKorean,
} from './plannerImageModel'

describe('plannerImageModel', () => {
  it('romanizes Korean coda slots without undefined fragments', () => {
    expect(romanizeKorean('강릉')).toBe('gangneung')
    expect(romanizeKorean('전망대')).toBe('jeonmangdae')
    expect(romanizeKorean('정동진')).toBe('jeongdongjin')
  })

  it('builds PascalCase attraction titles for S3 image keys', () => {
    expect(romanizeAttractionTitle('범바위 전망대')).toBe('BeombawiJeonmangdae')
    expect(romanizeAttractionTitle('백천계곡')).toBe('Baekcheongyegok')
  })

  it('builds attraction image keys with the current country directory', () => {
    expect(buildAttractionImageKey('Gangneung', '정동진')).toBe('images/KR/GANGNEUNG/Jeongdongjin_1.jpg')
    expect(buildAttractionImageKey('Onomichi', '전망대', 'JP')).toBe('images/JP/ONOMICHI/Jeonmangdae_1.jpg')
  })

  it('builds CDN URLs without duplicate slashes', () => {
    expect(buildAttractionImageUrl('https://cdn.example.com/', 'Gangneung', '범바위 전망대')).toBe(
      'https://cdn.example.com/images/KR/GANGNEUNG/BeombawiJeonmangdae_1.jpg',
    )
  })

  it('keeps the public dev S3 image bucket as a non-secret fallback base', () => {
    expect(DEFAULT_IMAGE_CDN_BASE_URL).toBe('https://lovv-pipeline-images-dev-925273580929.s3.amazonaws.com')
  })
})

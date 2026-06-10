export type SmallCityCountry = 'KR' | 'JP'

export const smallCityThemes = ['온천', '바다', '미식', '전통', '자연', '예술', '축제', '산책'] as const

export type SmallCityTheme = (typeof smallCityThemes)[number]

export type SmallCity = {
  id: string
  country: SmallCityCountry
  countryLabel: '한국' | '일본'
  region: string
  nameKo: string
  nameLocal?: string
  latitude: number
  longitude: number
  themes: SmallCityTheme[]
  summary: string
  detail: string
  highlights: string[]
  routeSeed: string[]
  image?: string
  festivals?: SmallCityFestival[]
  festivalCount?: number
}

export const smallCityPlaceCategories = ['관광지', '음식점', '카페', '숙소'] as const

export type SmallCityPlaceCategory = (typeof smallCityPlaceCategories)[number]

export type SmallCityPlace = {
  id: string
  cityId: string
  category: SmallCityPlaceCategory
  categoryCode?: string
  categoryName?: string
  name: string
  summary: string
  addressName?: string
  roadAddressName?: string
  phone?: string
  placeUrl?: string
  imageUrl?: string
  latitude?: number
  longitude?: number
  theme?: string
  themeTags?: string[]
  startDate?: string
  endDate?: string
  visitMonths?: number[]
}

export type SmallCityPlaceGroups = Record<SmallCityPlaceCategory, SmallCityPlace[]>

export type SmallCityFestival = {
  id: string
  cityId: string
  name: string
  summary: string
  startDate?: string
  endDate?: string
  visitMonths?: number[]
  themeTags?: string[]
}

export type SmallCityDetail = {
  city: SmallCity
  placesByCategory: SmallCityPlaceGroups
  festivals: SmallCityFestival[]
  festivalCount: number
}

export type SmallCityMapMarker = {
  id: string
  cityId: string
  country: SmallCityCountry
  countryLabel: '한국' | '일본'
  region: string
  label: string
  localLabel?: string
  latitude: number
  longitude: number
}

export type PlannerCityContext = {
  cityId: string
  cityName: string
  country: SmallCityCountry
  countryLabel: '한국' | '일본'
  region: string
  themes: SmallCityTheme[]
  routeSeed: string[]
  summary: string
  festivals: SmallCityFestival[]
  festivalCount: number
  hasFestivalContent: boolean
}

type CitySeed = {
  region: string
  nameKo: string
  nameLocal?: string
  latitude: number
  longitude: number
  themes: SmallCityTheme[]
  highlights: string[]
  routeSeed: string[]
  festivals?: Omit<SmallCityFestival, 'cityId'>[]
}

type MapBounds = {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export const smallCityCountryOptions: {
  country: SmallCityCountry
  label: '한국' | '일본'
  description: string
}[] = [
  {
    country: 'KR',
    label: '한국',
    description: '한국 소도시 40곳을 전체 지도에 표시합니다.',
  },
  {
    country: 'JP',
    label: '일본',
    description: '관동 지방을 기준으로 6개 소도시를 표시합니다.',
  },
]

export const smallCityMapBounds: Record<SmallCityCountry, MapBounds> = {
  KR: {
    minLat: 33.0,
    maxLat: 38.7,
    minLng: 125.8,
    maxLng: 130.4,
  },
  JP: {
    minLat: 34.9,
    maxLat: 37,
    minLng: 138.2,
    maxLng: 141.1,
  },
}

const visibleJapaneseMapRegions = new Set(['이바라키', '도치기', '군마', '사이타마', '치바', '가나가와'])

const koreanCitySeeds: CitySeed[] = [
  {
    region: '충남',
    nameKo: '아산',
    nameLocal: '온양',
    latitude: 36.7898,
    longitude: 127.0049,
    themes: ['온천', '산책'],
    highlights: ['온양온천', '현충사', '은행나무길'],
    routeSeed: ['온양온천', '현충사', '은행나무길'],
  },
  {
    region: '경남',
    nameKo: '남해',
    latitude: 34.8377,
    longitude: 127.8926,
    themes: ['바다', '자연'],
    highlights: ['독일마을', '다랭이마을', '금산 보리암'],
    routeSeed: ['독일마을', '다랭이마을', '상주은모래비치'],
  },
  {
    region: '전북',
    nameKo: '완주',
    latitude: 35.9053,
    longitude: 127.1621,
    themes: ['자연', '전통'],
    highlights: ['대둔산', '삼례문화예술촌', '고산자연휴양림'],
    routeSeed: ['삼례문화예술촌', '고산시장', '대둔산'],
  },
  {
    region: '전남',
    nameKo: '담양',
    latitude: 35.3212,
    longitude: 126.9882,
    themes: ['자연', '산책'],
    highlights: ['죽녹원', '메타세쿼이아길', '관방제림'],
    routeSeed: ['죽녹원', '관방제림', '담양국수거리'],
  },
  {
    region: '전남',
    nameKo: '순천',
    latitude: 34.9506,
    longitude: 127.4874,
    themes: ['자연', '산책'],
    highlights: ['순천만습지', '국가정원', '낙안읍성'],
    routeSeed: ['순천만습지', '국가정원', '낙안읍성'],
  },
  {
    region: '경북',
    nameKo: '안동',
    latitude: 36.5684,
    longitude: 128.7294,
    themes: ['전통', '미식'],
    highlights: ['하회마을', '월영교', '찜닭골목'],
    routeSeed: ['하회마을', '월영교', '구시장'],
  },
  {
    region: '경북',
    nameKo: '경주',
    latitude: 35.8562,
    longitude: 129.2247,
    themes: ['전통', '산책'],
    highlights: ['황리단길', '첨성대', '불국사'],
    routeSeed: ['황리단길', '첨성대', '동궁과 월지'],
  },
  {
    region: '강원',
    nameKo: '고성',
    latitude: 38.3806,
    longitude: 128.4676,
    themes: ['바다', '자연'],
    highlights: ['화진포', '송지호', '통일전망대'],
    routeSeed: ['화진포', '송지호', '천진해변'],
  },
  {
    region: '강원',
    nameKo: '양양',
    latitude: 38.0754,
    longitude: 128.619,
    themes: ['바다', '축제'],
    highlights: ['낙산사', '서피비치', '남대천'],
    routeSeed: ['낙산사', '서피비치', '남대천'],
  },
  {
    region: '강원',
    nameKo: '정선',
    latitude: 37.3806,
    longitude: 128.6609,
    themes: ['자연', '미식'],
    highlights: ['아리랑시장', '레일바이크', '민둥산'],
    routeSeed: ['아리랑시장', '레일바이크', '민둥산'],
  },
  {
    region: '충북',
    nameKo: '단양',
    latitude: 36.9846,
    longitude: 128.3657,
    themes: ['자연', '산책'],
    highlights: ['도담삼봉', '만천하스카이워크', '구경시장'],
    routeSeed: ['도담삼봉', '구경시장', '만천하스카이워크'],
  },
  {
    region: '충북',
    nameKo: '제천',
    latitude: 37.1326,
    longitude: 128.191,
    themes: ['자연', '온천'],
    highlights: ['청풍호', '의림지', '한방엑스포공원'],
    routeSeed: ['의림지', '청풍호', '한방엑스포공원'],
  },
  {
    region: '충남',
    nameKo: '공주',
    latitude: 36.4466,
    longitude: 127.119,
    themes: ['전통', '산책'],
    highlights: ['공산성', '무령왕릉', '제민천'],
    routeSeed: ['공산성', '무령왕릉', '제민천'],
  },
  {
    region: '충남',
    nameKo: '부여',
    latitude: 36.2747,
    longitude: 126.9096,
    themes: ['전통', '산책'],
    highlights: ['부소산성', '궁남지', '정림사지'],
    routeSeed: ['부소산성', '궁남지', '정림사지'],
  },
  {
    region: '전북',
    nameKo: '군산',
    latitude: 35.9677,
    longitude: 126.7366,
    themes: ['전통', '미식'],
    highlights: ['근대역사거리', '초원사진관', '이성당'],
    routeSeed: ['근대역사거리', '초원사진관', '빵집 골목'],
  },
  {
    region: '전북',
    nameKo: '고창',
    latitude: 35.4358,
    longitude: 126.7021,
    themes: ['자연', '전통'],
    highlights: ['고인돌유적', '선운사', '청보리밭'],
    routeSeed: ['고인돌유적', '선운사', '청보리밭'],
  },
  {
    region: '전남',
    nameKo: '보성',
    latitude: 34.7715,
    longitude: 127.0801,
    themes: ['자연', '미식'],
    highlights: ['녹차밭', '율포해변', '득량역'],
    routeSeed: ['녹차밭', '득량역', '율포해변'],
  },
  {
    region: '전남',
    nameKo: '여수',
    latitude: 34.7604,
    longitude: 127.6622,
    themes: ['바다', '축제'],
    highlights: ['밤바다', '오동도', '낭만포차'],
    routeSeed: ['오동도', '해상케이블카', '낭만포차'],
  },
  {
    region: '경남',
    nameKo: '통영',
    latitude: 34.8544,
    longitude: 128.4332,
    themes: ['바다', '예술'],
    highlights: ['동피랑', '미륵산', '중앙시장'],
    routeSeed: ['동피랑', '중앙시장', '미륵산'],
  },
  {
    region: '경남',
    nameKo: '하동',
    latitude: 35.0672,
    longitude: 127.7513,
    themes: ['자연', '전통'],
    highlights: ['화개장터', '쌍계사', '섬진강'],
    routeSeed: ['화개장터', '쌍계사', '섬진강길'],
  },
  {
    region: '경남',
    nameKo: '거제',
    latitude: 34.8805,
    longitude: 128.6212,
    themes: ['바다', '자연'],
    highlights: ['바람의 언덕', '외도', '구조라해변'],
    routeSeed: ['바람의 언덕', '구조라해변', '외도'],
  },
  {
    region: '경북',
    nameKo: '영주',
    latitude: 36.8057,
    longitude: 128.6241,
    themes: ['전통', '자연'],
    highlights: ['부석사', '소수서원', '무섬마을'],
    routeSeed: ['부석사', '소수서원', '무섬마을'],
  },
  {
    region: '경북',
    nameKo: '문경',
    latitude: 36.5866,
    longitude: 128.1868,
    themes: ['자연', '예술', '산책'],
    highlights: ['문경새재', '찻사발', '오미자'],
    routeSeed: ['문경새재', '찻사발거리', '오미자시장'],
  },
  {
    region: '경북',
    nameKo: '영덕',
    latitude: 36.4151,
    longitude: 129.3653,
    themes: ['바다', '미식'],
    highlights: ['강구항', '해파랑길', '대게거리'],
    routeSeed: ['강구항', '대게거리', '해파랑길'],
  },
  {
    region: '강원',
    nameKo: '태백',
    latitude: 37.1641,
    longitude: 128.9856,
    themes: ['자연', '축제'],
    highlights: ['태백산', '철암탄광역사촌', '황지연못'],
    routeSeed: ['태백산', '철암탄광역사촌', '황지연못'],
  },
  {
    region: '강원',
    nameKo: '평창',
    latitude: 37.3705,
    longitude: 128.3904,
    themes: ['자연', '예술', '축제'],
    highlights: ['대관령', '월정사', '효석문화마을'],
    routeSeed: ['대관령', '월정사', '효석문화마을'],
  },
  {
    region: '강원',
    nameKo: '인제',
    latitude: 38.0695,
    longitude: 128.1707,
    themes: ['자연', '산책'],
    highlights: ['자작나무숲', '내린천', '백담사'],
    routeSeed: ['자작나무숲', '내린천', '백담사'],
  },
  {
    region: '제주',
    nameKo: '서귀포',
    latitude: 33.2539,
    longitude: 126.5596,
    themes: ['바다', '자연'],
    highlights: ['천지연폭포', '올레길', '새연교'],
    routeSeed: ['천지연폭포', '올레길', '새연교'],
  },
  {
    region: '제주',
    nameKo: '성산',
    latitude: 33.4609,
    longitude: 126.9336,
    themes: ['바다', '자연'],
    highlights: ['성산일출봉', '섭지코지', '광치기해변'],
    routeSeed: ['성산일출봉', '섭지코지', '광치기해변'],
  },
  {
    region: '부산',
    nameKo: '기장',
    latitude: 35.2446,
    longitude: 129.2223,
    themes: ['바다', '미식'],
    highlights: ['해동용궁사', '대변항', '아난티 해변'],
    routeSeed: ['해동용궁사', '대변항', '죽성성당'],
  },
  {
    region: '울산',
    nameKo: '울주',
    latitude: 35.5221,
    longitude: 129.2422,
    themes: ['자연', '전통'],
    highlights: ['간절곶', '영남알프스', '반구대암각화'],
    routeSeed: ['간절곶', '영남알프스', '반구대암각화'],
  },
  {
    region: '경기',
    nameKo: '가평',
    latitude: 37.8315,
    longitude: 127.5099,
    themes: ['자연', '산책'],
    highlights: ['자라섬', '아침고요수목원', '청평호'],
    routeSeed: ['자라섬', '청평호', '아침고요수목원'],
  },
  {
    region: '경기',
    nameKo: '양평',
    latitude: 37.4912,
    longitude: 127.4876,
    themes: ['자연', '산책'],
    highlights: ['두물머리', '세미원', '용문사'],
    routeSeed: ['두물머리', '세미원', '용문사'],
  },
  {
    region: '인천',
    nameKo: '강화',
    latitude: 37.7463,
    longitude: 126.4878,
    themes: ['전통', '바다'],
    highlights: ['전등사', '고인돌', '동막해변'],
    routeSeed: ['전등사', '고인돌', '동막해변'],
  },
  {
    region: '전남',
    nameKo: '목포',
    latitude: 34.8118,
    longitude: 126.3922,
    themes: ['바다', '미식'],
    highlights: ['근대역사관', '해상케이블카', '목포항'],
    routeSeed: ['근대역사관', '목포항', '해상케이블카'],
  },
  {
    region: '전남',
    nameKo: '해남',
    latitude: 34.5734,
    longitude: 126.5988,
    themes: ['자연', '바다'],
    highlights: ['땅끝마을', '대흥사', '두륜산'],
    routeSeed: ['땅끝마을', '대흥사', '두륜산'],
  },
  {
    region: '전북',
    nameKo: '남원',
    latitude: 35.4164,
    longitude: 127.3905,
    themes: ['전통', '축제'],
    highlights: ['광한루원', '춘향테마파크', '지리산'],
    routeSeed: ['광한루원', '춘향테마파크', '지리산'],
  },
  {
    region: '경남',
    nameKo: '진주',
    latitude: 35.1802,
    longitude: 128.1076,
    themes: ['축제', '전통'],
    highlights: ['진주성', '남강', '중앙시장'],
    routeSeed: ['진주성', '남강', '중앙시장'],
    festivals: [
      {
        id: 'kr-039-festival-jinju-namgang',
        name: '진주남강유등축제',
        summary: '남강과 진주성 야경을 따라 이어지는 지역 대표 축제입니다.',
        startDate: '20261001',
        endDate: '20261012',
        visitMonths: [10],
        themeTags: ['축제', '전통'],
      },
    ],
  },
  {
    region: '경북',
    nameKo: '청송',
    latitude: 36.4356,
    longitude: 129.057,
    themes: ['자연', '산책'],
    highlights: ['주왕산', '얼음골', '사과마을'],
    routeSeed: ['주왕산', '얼음골', '사과마을'],
  },
  {
    region: '경북',
    nameKo: '울진',
    latitude: 36.9931,
    longitude: 129.4005,
    themes: ['바다', '온천'],
    highlights: ['덕구온천', '죽변항', '망양정'],
    routeSeed: ['덕구온천', '죽변항', '망양정'],
  },
]

const japaneseBaseSeeds: CitySeed[] = [
  { region: '홋카이도', nameKo: '오타루', nameLocal: '小樽', latitude: 43.1907, longitude: 140.9947, themes: ['바다', '미식'], highlights: ['운하', '오르골당', '스시거리'], routeSeed: ['오타루 운하', '오르골당', '스시거리'] },
  { region: '홋카이도', nameKo: '하코다테', nameLocal: '函館', latitude: 41.7687, longitude: 140.7288, themes: ['바다', '전통'], highlights: ['야경', '아침시장', '모토마치'], routeSeed: ['하코다테산', '아침시장', '모토마치'] },
  { region: '아오모리', nameKo: '히로사키', nameLocal: '弘前', latitude: 40.6031, longitude: 140.4638, themes: ['축제', '전통'], highlights: ['히로사키성', '사과공원', '네푸타'], routeSeed: ['히로사키성', '사과공원', '네푸타 거리'] },
  { region: '아오모리', nameKo: '하치노헤', nameLocal: '八戸', latitude: 40.5123, longitude: 141.4884, themes: ['바다', '미식'], highlights: ['아침시장', '다네사시 해안', '요코초'], routeSeed: ['아침시장', '다네사시 해안', '요코초'] },
  { region: '이와테', nameKo: '도노', nameLocal: '遠野', latitude: 39.3275, longitude: 141.5335, themes: ['전통', '산책'], highlights: ['민화 마을', '갓파 전설', '논길'], routeSeed: ['도노 이야기관', '갓파 연못', '논길 산책'] },
  { region: '미야기', nameKo: '마쓰시마', nameLocal: '松島', latitude: 38.3739, longitude: 141.0611, themes: ['바다', '전통'], highlights: ['마쓰시마만', '즈이간지', '유람선'], routeSeed: ['즈이간지', '마쓰시마만', '해안 산책'] },
  { region: '아키타', nameKo: '가쿠노다테', nameLocal: '角館', latitude: 39.594, longitude: 140.562, themes: ['전통', '산책'], highlights: ['무가저택', '벚꽃길', '공예점'], routeSeed: ['무가저택', '벚꽃길', '공예점'] },
  { region: '야마가타', nameKo: '긴잔온천', nameLocal: '銀山温泉', latitude: 38.568, longitude: 140.528, themes: ['온천', '전통'], highlights: ['목조 료칸', '가스등 거리', '폭포'], routeSeed: ['가스등 거리', '공동탕', '폭포 산책'] },
  { region: '후쿠시마', nameKo: '아이즈와카마쓰', nameLocal: '会津若松', latitude: 37.4948, longitude: 139.9298, themes: ['전통', '미식'], highlights: ['쓰루가성', '사케 양조장', '나나카마치'], routeSeed: ['쓰루가성', '나나카마치', '사케 양조장'] },
  { region: '이바라키', nameKo: '가사마', nameLocal: '笠間', latitude: 36.3452, longitude: 140.3043, themes: ['예술', '산책'], highlights: ['도예 마을', '이나리 신사', '갤러리'], routeSeed: ['도예 거리', '이나리 신사', '갤러리 산책'] },
  { region: '도치기', nameKo: '닛코', nameLocal: '日光', latitude: 36.7198, longitude: 139.6982, themes: ['자연', '전통'], highlights: ['도쇼구', '주젠지호', '게곤폭포'], routeSeed: ['도쇼구', '주젠지호', '게곤폭포'] },
  { region: '군마', nameKo: '구사쓰', nameLocal: '草津', latitude: 36.6208, longitude: 138.5961, themes: ['온천', '산책'], highlights: ['유바타케', '공동탕', '온천 거리'], routeSeed: ['유바타케', '공동탕', '사이노카와라'] },
  { region: '사이타마', nameKo: '가와고에', nameLocal: '川越', latitude: 35.9251, longitude: 139.4858, themes: ['전통', '미식'], highlights: ['창고 거리', '시계탑', '고구마 간식'], routeSeed: ['창고 거리', '시계탑', '간식 골목'] },
  { region: '치바', nameKo: '사와라', nameLocal: '佐原', latitude: 35.8958, longitude: 140.499, themes: ['전통', '산책'], highlights: ['수로 마을', '상가 거리', '축제 수레'], routeSeed: ['수로 산책', '상가 거리', '축제관'] },
  { region: '가나가와', nameKo: '가마쿠라', nameLocal: '鎌倉', latitude: 35.3192, longitude: 139.5467, themes: ['전통', '바다'], highlights: ['대불', '에노덴', '해변'], routeSeed: ['대불', '하세 거리', '유이가하마'] },
  { region: '니가타', nameKo: '사도', nameLocal: '佐渡', latitude: 38.018, longitude: 138.368, themes: ['바다', '예술'], highlights: ['금광', '따오기', '해안길'], routeSeed: ['사도금광', '해안길', '전통 공연'] },
  { region: '도야마', nameKo: '다카오카', nameLocal: '高岡', latitude: 36.7541, longitude: 137.0257, themes: ['예술', '전통'], highlights: ['금속공예', '즈이류지', '구시가'], routeSeed: ['즈이류지', '금속공예 거리', '구시가'] },
  { region: '이시카와', nameKo: '가나자와', nameLocal: '金沢', latitude: 36.5613, longitude: 136.6562, themes: ['예술', '전통'], highlights: ['겐로쿠엔', '히가시차야', '공예'], routeSeed: ['겐로쿠엔', '히가시차야', '공예관'] },
  { region: '후쿠이', nameKo: '오바마', nameLocal: '小浜', latitude: 35.4955, longitude: 135.7466, themes: ['바다', '미식'], highlights: ['사바 거리', '항구', '사찰길'], routeSeed: ['사바 거리', '항구 산책', '사찰길'] },
  { region: '야마나시', nameKo: '후지요시다', nameLocal: '富士吉田', latitude: 35.4875, longitude: 138.8078, themes: ['자연', '미식'], highlights: ['후지산 뷰', '우동', '상점가'], routeSeed: ['후지산 뷰 거리', '우동 가게', '상점가'] },
  { region: '나가노', nameKo: '마쓰모토', nameLocal: '松本', latitude: 36.238, longitude: 137.972, themes: ['전통', '예술'], highlights: ['마쓰모토성', '나카마치', '미술관'], routeSeed: ['마쓰모토성', '나카마치', '미술관'] },
  { region: '기후', nameKo: '다카야마', nameLocal: '高山', latitude: 36.1461, longitude: 137.2522, themes: ['전통', '미식'], highlights: ['산마치', '아침시장', '히다규'], routeSeed: ['산마치', '아침시장', '히다규 가게'] },
  { region: '시즈오카', nameKo: '시모다', nameLocal: '下田', latitude: 34.6795, longitude: 138.9453, themes: ['바다', '산책'], highlights: ['페리로드', '해변', '온천'], routeSeed: ['페리로드', '해변 산책', '온천'] },
  { region: '아이치', nameKo: '이누야마', nameLocal: '犬山', latitude: 35.3788, longitude: 136.9447, themes: ['전통', '산책'], highlights: ['이누야마성', '성하마을', '강변'], routeSeed: ['이누야마성', '성하마을', '강변'] },
  { region: '미에', nameKo: '이세', nameLocal: '伊勢', latitude: 34.4875, longitude: 136.7093, themes: ['전통', '미식'], highlights: ['이세신궁', '오카게요코초', '해산물'], routeSeed: ['이세신궁', '오카게요코초', '해산물 거리'] },
  { region: '시가', nameKo: '오미하치만', nameLocal: '近江八幡', latitude: 35.1284, longitude: 136.0976, themes: ['전통', '산책'], highlights: ['수로', '상인마을', '하치만보리'], routeSeed: ['하치만보리', '상인마을', '수로 산책'] },
  { region: '교토', nameKo: '우지', nameLocal: '宇治', latitude: 34.8844, longitude: 135.7999, themes: ['미식', '전통'], highlights: ['말차', '뵤도인', '강변'], routeSeed: ['뵤도인', '말차 거리', '우지강'] },
  { region: '오사카', nameKo: '미노오', nameLocal: '箕面', latitude: 34.8269, longitude: 135.4705, themes: ['자연', '산책'], highlights: ['폭포', '단풍', '카페'], routeSeed: ['미노오 폭포', '단풍길', '카페'] },
  { region: '효고', nameKo: '기노사키온천', nameLocal: '城崎温泉', latitude: 35.6267, longitude: 134.8139, themes: ['온천', '전통'], highlights: ['외탕 순례', '버드나무 거리', '료칸'], routeSeed: ['외탕 순례', '버드나무 거리', '료칸 골목'] },
  { region: '나라', nameKo: '아스카', nameLocal: '明日香', latitude: 34.4712, longitude: 135.8206, themes: ['전통', '자연'], highlights: ['고분', '논길', '자전거길'], routeSeed: ['고분길', '논길', '자전거길'] },
  { region: '와카야마', nameKo: '시라하마', nameLocal: '白浜', latitude: 33.6781, longitude: 135.3483, themes: ['바다', '온천'], highlights: ['백사장', '온천', '엔게쓰토'], routeSeed: ['시라라하마', '온천', '엔게쓰토'] },
  { region: '돗토리', nameKo: '구라요시', nameLocal: '倉吉', latitude: 35.4333, longitude: 133.8167, themes: ['전통', '산책'], highlights: ['흰벽 창고', '상가 거리', '배 과자'], routeSeed: ['흰벽 창고', '상가 거리', '간식 가게'] },
  { region: '시마네', nameKo: '쓰와노', nameLocal: '津和野', latitude: 34.467, longitude: 131.773, themes: ['전통', '산책'], highlights: ['잉어 수로', '성터', '작은 거리'], routeSeed: ['잉어 수로', '성터', '작은 거리'] },
  { region: '오카야마', nameKo: '구라시키', nameLocal: '倉敷', latitude: 34.585, longitude: 133.772, themes: ['예술', '전통'], highlights: ['미관지구', '오하라미술관', '수로'], routeSeed: ['미관지구', '오하라미술관', '수로 산책'] },
  { region: '히로시마', nameKo: '오노미치', nameLocal: '尾道', latitude: 34.4089, longitude: 133.2048, themes: ['바다', '산책'], highlights: ['고양이길', '사찰길', '항구'], routeSeed: ['사찰길', '항구', '고양이길'] },
  { region: '야마구치', nameKo: '하기', nameLocal: '萩', latitude: 34.408, longitude: 131.399, themes: ['전통', '예술'], highlights: ['성하마을', '도자기', '해안'], routeSeed: ['성하마을', '도자기 거리', '해안'] },
  { region: '도쿠시마', nameKo: '이야', nameLocal: '祖谷', latitude: 33.874, longitude: 133.812, themes: ['자연', '산책'], highlights: ['계곡', '덩굴다리', '산마을'], routeSeed: ['덩굴다리', '계곡길', '산마을'] },
  { region: '가가와', nameKo: '나오시마', nameLocal: '直島', latitude: 34.459, longitude: 133.995, themes: ['예술', '바다'], highlights: ['미술관', '섬길', '항구'], routeSeed: ['미술관', '섬길', '항구'] },
  { region: '에히메', nameKo: '우치코', nameLocal: '内子', latitude: 33.548, longitude: 132.65, themes: ['전통', '산책'], highlights: ['가부키 극장', '목랍 거리', '상가'], routeSeed: ['가부키 극장', '목랍 거리', '상가'] },
  { region: '고치', nameKo: '시만토', nameLocal: '四万十', latitude: 32.991, longitude: 132.933, themes: ['자연', '바다'], highlights: ['시만토강', '침하교', '강변'], routeSeed: ['시만토강', '침하교', '강변'] },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const uniqueThemes = (themes: SmallCityTheme[]) => Array.from(new Set(themes)).slice(0, 4)

const createCity = (
  seed: CitySeed,
  country: SmallCityCountry,
  index: number,
): SmallCity => {
  const countryLabel = country === 'KR' ? '한국' : '일본'
  const bounds = smallCityMapBounds[country]
  const themes = uniqueThemes(seed.themes)
  const latitude = clamp(seed.latitude, bounds.minLat, bounds.maxLat)
  const longitude = clamp(seed.longitude, bounds.minLng, bounds.maxLng)

  return {
    id: `${country.toLowerCase()}-${String(index + 1).padStart(3, '0')}`,
    country,
    countryLabel,
    region: seed.region,
    nameKo: seed.nameKo,
    nameLocal: seed.nameLocal,
    latitude,
    longitude,
    themes,
    summary: `${countryLabel} ${seed.region}의 ${seed.nameKo}는 ${themes.slice(0, 2).join('·')} 분위기가 뚜렷한 소도시입니다.`,
    detail: `${seed.routeSeed.slice(0, 3).join(', ')} 흐름을 기준으로 여행 조건을 좁히기 좋은 후보입니다.`,
    highlights: seed.highlights,
    routeSeed: seed.routeSeed,
    festivals:
      seed.festivals?.map((festival) => ({
        ...festival,
        cityId: `${country.toLowerCase()}-${String(index + 1).padStart(3, '0')}`,
      })) ?? [],
    festivalCount: seed.festivals?.length ?? 0,
  }
}

export const koreanSmallCities = koreanCitySeeds.map((seed, index) => createCity(seed, 'KR', index))

export const japaneseSmallCities = japaneseBaseSeeds
  .filter((seed) => visibleJapaneseMapRegions.has(seed.region))
  .map((seed, index) => createCity(seed, 'JP', index))

export const smallCities = [...koreanSmallCities, ...japaneseSmallCities]

export const smallCityCounts: Record<SmallCityCountry, number> = {
  KR: koreanSmallCities.length,
  JP: japaneseSmallCities.length,
}

export const normalizeSmallCityQuery = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, '')

export const getSmallCitiesByCountry = (country: SmallCityCountry) =>
  smallCities.filter((city) => city.country === country)

const getSmallCityMapKey = (city: SmallCity) =>
  [city.country, city.region, city.nameKo, city.nameLocal ?? ''].join('|')

export const getSmallCityMapCities = (cities: SmallCity[]) => {
  const citiesByName = new Map<string, SmallCity>()

  cities.forEach((city) => {
    const mapKey = getSmallCityMapKey(city)

    if (!citiesByName.has(mapKey)) {
      citiesByName.set(mapKey, city)
    }
  })

  return Array.from(citiesByName.values())
}

const getSmallCitySearchText = (city: SmallCity) =>
  normalizeSmallCityQuery(
    [
      city.nameKo,
      city.nameLocal,
      city.countryLabel,
      city.region,
      ...city.themes,
      city.summary,
      city.detail,
      ...city.highlights,
      ...city.routeSeed,
    ]
      .filter(Boolean)
      .join(' '),
  )

export const filterSmallCities = (
  cities: SmallCity[],
  query: string,
  selectedThemes: SmallCityTheme[],
) => {
  const normalizedQuery = normalizeSmallCityQuery(query)

  return cities.filter((city) => {
    const matchesQuery = normalizedQuery ? getSmallCitySearchText(city).includes(normalizedQuery) : true
    const matchesTheme =
      selectedThemes.length === 0 || selectedThemes.some((theme) => city.themes.includes(theme))

    return matchesQuery && matchesTheme
  })
}

export const createSmallCityMapMarker = (city: SmallCity): SmallCityMapMarker => ({
  id: `marker-${city.id}`,
  cityId: city.id,
  country: city.country,
  countryLabel: city.countryLabel,
  region: city.region,
  label: city.nameKo,
  localLabel: city.nameLocal,
  latitude: city.latitude,
  longitude: city.longitude,
})

export const createSmallCityMapMarkers = (cities: SmallCity[]) =>
  cities.map(createSmallCityMapMarker)

const getSmallCityFestivals = (city: SmallCity, detail?: SmallCityDetail | null) =>
  detail?.festivals ?? city.festivals ?? []

export const createPlannerCityContext = (
  city: SmallCity,
  detail?: SmallCityDetail | null,
): PlannerCityContext => {
  const festivals = getSmallCityFestivals(city, detail)
  const festivalCount = detail?.festivalCount ?? city.festivalCount ?? festivals.length

  return {
  cityId: city.id,
  cityName: city.nameKo,
  country: city.country,
  countryLabel: city.countryLabel,
  region: city.region,
  themes: city.themes,
  routeSeed: city.routeSeed,
  summary: city.summary,
  festivals,
  festivalCount,
  hasFestivalContent: festivalCount > 0 || festivals.length > 0,
  }
}

const placeCoordinateOffsetByCategory: Record<SmallCityPlaceCategory, { latitude: number; longitude: number }> = {
  관광지: { latitude: 0, longitude: 0 },
  음식점: { latitude: 0.006, longitude: -0.004 },
  카페: { latitude: -0.004, longitude: 0.006 },
  숙소: { latitude: 0.003, longitude: 0.004 },
}

const createStaticPlace = (
  city: SmallCity,
  category: SmallCityPlaceCategory,
): SmallCityPlace => {
  const routeSeed = city.routeSeed[0] ?? city.nameKo
  const highlight = city.highlights[0] ?? routeSeed
  const addressName = `${city.countryLabel} ${city.region} ${city.nameKo}`
  const offset = placeCoordinateOffsetByCategory[category]
  const latitude = Number((city.latitude + offset.latitude).toFixed(6))
  const longitude = Number((city.longitude + offset.longitude).toFixed(6))

  const placeByCategory: Record<SmallCityPlaceCategory, Omit<SmallCityPlace, 'id' | 'cityId' | 'category' | 'categoryName' | 'addressName' | 'roadAddressName' | 'phone' | 'placeUrl' | 'latitude' | 'longitude'>> = {
    관광지: {
      name: `${routeSeed} 중심 산책`,
      summary: `${city.nameKo} 선택 후 처음 확인할 관광지 후보입니다. ${highlight} 흐름과 함께 보기 좋습니다.`,
    },
    음식점: {
      name: `${city.nameKo} 로컬 식당`,
      summary: `${city.region}의 현지 식사 흐름을 잡기 위한 음식점 후보입니다.`,
    },
    카페: {
      name: `${city.nameKo} 쉬어가는 카페`,
      summary: `${city.nameKo} 동선 중간에 쉬어가기 좋은 카페 후보입니다.`,
    },
    숙소: {
      name: `${city.nameKo} 베이스 숙소`,
      summary: `${city.nameKo} 일정의 이동 부담을 줄이기 위한 숙소 후보입니다.`,
    },
  }

  return {
    id: `${city.id}-${category}`,
    cityId: city.id,
    category,
    categoryName: category,
    ...placeByCategory[category],
    addressName,
    roadAddressName: addressName,
    placeUrl: `https://place.map.kakao.com/${encodeURIComponent(`${city.id}-${category}`)}`,
    latitude,
    longitude,
  }
}

const createStaticFestivalPlace = (city: SmallCity, festival: SmallCityFestival): SmallCityPlace => ({
  id: festival.id,
  cityId: city.id,
  category: '관광지',
  categoryName: '축제',
  name: festival.name,
  summary: festival.summary,
  addressName: `${city.countryLabel} ${city.region} ${city.nameKo}`,
  roadAddressName: `${city.countryLabel} ${city.region} ${city.nameKo}`,
  latitude: city.latitude,
  longitude: city.longitude,
  theme: '축제',
  themeTags: festival.themeTags ?? ['축제'],
  startDate: festival.startDate,
  endDate: festival.endDate,
  visitMonths: festival.visitMonths,
})

export const createSmallCityPlaceGroups = (city: SmallCity): SmallCityPlaceGroups => {
  const groups = smallCityPlaceCategories.reduce((placeGroups, category) => {
    placeGroups[category] = [createStaticPlace(city, category)]

    return placeGroups
  }, {} as SmallCityPlaceGroups)

  const festivalPlaces = (city.festivals ?? []).map((festival) => createStaticFestivalPlace(city, festival))

  if (festivalPlaces.length > 0) {
    groups['관광지'] = [...groups['관광지'], ...festivalPlaces]
  }

  return groups
}

export const getSmallCityFestivalCount = (city: SmallCity, festivals: SmallCityFestival[] = city.festivals ?? []) =>
  city.festivalCount ?? festivals.length

export const createSmallCityDetail = (city: SmallCity): SmallCityDetail => {
  const festivals = city.festivals ?? []

  return {
    city,
    placesByCategory: createSmallCityPlaceGroups(city),
    festivals,
    festivalCount: getSmallCityFestivalCount(city, festivals),
  }
}

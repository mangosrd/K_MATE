// ============================================================
// K-MATE Mock DB v2 — Supabase 연결 전 임시 데이터
// ============================================================
import type {
  User, Character, Region, Progress, Memory, DiaryEntry,
  Economy, VocabItem, Chapter, Membership,
} from "@/types/database";

// ── 사용자 ───────────────────────────────────────────────
export const MOCK_USER: User = {
  id: "user-001",
  name: "Kim Traveler",
  language: "en",
  level: 1,
  membership: "free",
  free_character_slots: ["kyuhyun", "haneul"],
  created_at: "2025-01-01T00:00:00Z",
};

// ── 캐릭터 ──────────────────────────────────────────────
export const MOCK_CHARACTERS: Character[] = [
  {
    id: "kyuhyun",
    region_id: "seoul",
    name: "양규현",
    emoji: "✈️",
    avatar_url: "/characters/kyuhyun.png",
    description: "서울·경기 기장 (34세). 능글스러운 어른미와 위트 있는 로맨스가 가득한 베테랑 기장.",
    description_en: "Captain Yang Kyuhyun (Age 34). Mature charm with playful romance.",
    tags: ["34세", "어른미", "능글남", "로맨스"],
    persona: "captain-seoul",
    requires_premium: false,
  },
  {
    id: "haneul",
    region_id: "jeonju",
    name: "오하늘",
    emoji: "🛫",
    avatar_url: "/characters/haneul.png",
    description: "전주·전라 기장. 무뚝뚝한 연하공. '그래서 그게 왜 궁금해요? 나한텐 언제 궁금해할 건데요?'",
    description_en: "Captain Oh Haneul. Cool younger male style with subtle jealousy.",
    tags: ["연하공", "무뚝뚝", "질투", "직진"],
    persona: "captain-jeonju",
    requires_premium: false,
  },
  {
    id: "sunwoo",
    region_id: "busan",
    name: "차선우",
    emoji: "⚓",
    avatar_url: "/characters/sunwoo.png",
    description: "부산·경남 기장. 소꿉친구. '어릴 땐 코흘리개더니 좀 예뻐졌다? 딴 놈 쳐다보지 마라.'",
    description_en: "Captain Cha Sunwoo. Childhood friend full of playful heart-fluttering moments.",
    tags: ["소꿉친구", "장난꾼", "남사친", "설렘"],
    persona: "captain-busan",
    requires_premium: true,
  },
  {
    id: "sangwoo",
    region_id: "chungcheong",
    name: "천상우",
    emoji: "🏛️",
    avatar_url: "/characters/sangwoo.png",
    description: "충청·공주 기장. FM 관제 기장. '타워, 여기는 상우 기장. 착륙 승인 요청한다. Roger that.'",
    description_en: "Captain Cheon Sangwoo. Calling you Tower, waiting only for your clearance.",
    tags: ["FM기장", "타워", "관제사", "능글공"],
    persona: "captain-chungcheong",
    requires_premium: true,
  },
  {
    id: "yongwoo",
    region_id: "jeju",
    name: "권용우",
    emoji: "🌋",
    avatar_url: "/characters/yongwoo.png",
    description: "제주 기장. 친형제 같은 기장. '야 너 또 칠칠맞게 굴지 마라. 동생 챙기는 건 나뿐이지?'",
    description_en: "Captain Kwon Yongwoo. Friendly brother-like tone caring deeply under a teasing shell.",
    tags: ["친형제", "티격태격", "츤데레", "챙김"],
    persona: "captain-jeju",
    requires_premium: true,
  },
];

// ── 권역 ────────────────────────────────────────────────
export const MOCK_REGIONS: Region[] = [
  {
    id: "seoul",
    name: "서울·경기",
    name_en: "Seoul & Gyeonggi",
    airport_code: "SEL",
    description: "조선의 수도, 현대 한국의 심장",
    description_en: "Capital of Korea, hub of modernity and tradition",
    thumbnail_url: "/regions/seoul.jpg",
    place_count: 8,
    is_locked: false,
    character_ids: ["kyuhyun"],
  },
  {
    id: "jeonju",
    name: "전주·전라",
    name_en: "Jeonju & Jeolla",
    airport_code: "JWJ",
    description: "한옥마을과 비빔밥의 고향",
    description_en: "Home of hanok villages and bibimbap",
    thumbnail_url: "/regions/jeonju.jpg",
    place_count: 6,
    is_locked: false,
    character_ids: ["haneul"],
  },
  {
    id: "busan",
    name: "부산·경남",
    name_en: "Busan & Gyeongnam",
    airport_code: "PUS",
    description: "바다와 사람의 도시, 대한민국 제2의 도시",
    description_en: "City of the sea — Korea's second largest metropolis",
    thumbnail_url: "/regions/busan.jpg",
    place_count: 7,
    is_locked: true,
    character_ids: ["sunwoo"],
  },
  {
    id: "chungcheong",
    name: "충청·공주",
    name_en: "Chungcheong & Gongju",
    airport_code: "CJU",
    description: "백제의 숨결이 살아있는 역사의 땅",
    description_en: "Land of history — heartland of the Baekje kingdom",
    thumbnail_url: "/regions/chungcheong.jpg",
    place_count: 5,
    is_locked: true,
    character_ids: ["sangwoo"],
  },
  {
    id: "jeju",
    name: "제주",
    name_en: "Jeju Island",
    airport_code: "CJU",
    description: "화산섬의 신비로운 자연과 해녀 문화",
    description_en: "Volcanic island of mystery, nature, and haenyeo culture",
    thumbnail_url: "/regions/jeju.jpg",
    place_count: 6,
    is_locked: true,
    character_ids: ["yongwoo"],
  },
];

// 개발자 테스트 모드 — 지역 잠금도 캐릭터 잠금과 함께 전부 무시 (.env.local의 NEXT_PUBLIC_DEV_MODE)
if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
  MOCK_REGIONS.forEach((r) => { r.is_locked = false; });
}

// ── 진도 (캐릭터별) ────────────────────────────────────
export const MOCK_PROGRESS: Progress = {
  id: "prog-001",
  user_id: "user-001",
  character_id: "kyuhyun",
  affinity: 0,
  stamps: [],
  current_step: 1,
  visited_places: [],
  streak_days: 0,
  last_active_at: new Date().toISOString(),
};

export const MOCK_ALL_PROGRESS: Record<string, Progress> = {
  kyuhyun: {
    id: "prog-001",
    user_id: "user-001",
    character_id: "kyuhyun",
    affinity: 0,
    stamps: [],
    current_step: 1,
    visited_places: [],
    streak_days: 0,
    last_active_at: new Date().toISOString(),
  },
  haneul: {
    id: "prog-002",
    user_id: "user-001",
    character_id: "haneul",
    affinity: 0,
    stamps: [],
    current_step: 1,
    visited_places: [],
    streak_days: 0,
    last_active_at: new Date().toISOString(),
  },
};

// ── 챕터 ────────────────────────────────────────────────
// ── 챕터 (각 캐릭터별 10개 챕터 × 10단계 전통문화 커리큘럼) ────────
export const MOCK_CHAPTERS: Chapter[] = [
  // ✈️ 규현 기장 (서울·경기)
  { id: "ch-k01", character_id: "kyuhyun", order: 1, title: "조선의 궁궐과 경복궁", title_en: "Joseon Palaces & Gyeongbokgung", description: "600년 역사의 정궁 경복궁과 수문장 교대의식", emoji: "🏯", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k02", character_id: "kyuhyun", order: 2, title: "훈민정음과 한글의 과학", title_en: "Hunminjeongeum & Science of Hangul", description: "세종대왕의 애민정신과 세계 최고의 자음·모음 과학", emoji: "📜", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k03", character_id: "kyuhyun", order: 3, title: "한복의 색채와 착용 예절", title_en: "Hanbok Colors & Wearing Etiquette", description: "오방색의 미학부터 한복을 올바르게 입는 방법", emoji: "👘", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k04", character_id: "kyuhyun", order: 4, title: "인사동 찻집과 전통 다도", title_en: "Insadong Teahouse & Traditional Tea", description: "오미자차, 쌍화차와 마음을 가다듬는 다도 예절", emoji: "🍵", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k05", character_id: "kyuhyun", order: 5, title: "한강과 서울 스카이라인", title_en: "Han River & Seoul Skyline", description: "N서울타워에서 바라보는 수도 서울의 장관", emoji: "🏙️", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k06", character_id: "kyuhyun", order: 6, title: "명동·홍대 K-트렌드", title_en: "Myeongdong & Hongdae Trends", description: "세계가 열광하는 스트리트 패션과 K-뷰티", emoji: "🛍️", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k07", character_id: "kyuhyun", order: 7, title: "한국의 분식과 길거리 음식", title_en: "Korean Street Food & Snacks", description: "떡볶이, 튀김, 붕어빵에 담긴 한국인의 소울푸드", emoji: "🍱", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k08", character_id: "kyuhyun", order: 8, title: "대학로 소극장과 공연 문화", title_en: "Daehakro Theater & Performing Arts", description: "한국 연극과 뮤지컬의 중심지 탐방", emoji: "🎭", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k09", character_id: "kyuhyun", order: 9, title: "북한산과 서울 한양도성길", title_en: "Bukhansan & Hanyang Fortress", description: "자연과 역사가 결합된 수도 성곽길 산책", emoji: "🏔️", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-k10", character_id: "kyuhyun", order: 10, title: "서울 야경과 불꽃축제", title_en: "Seoul Night View & Fireworks", description: "화려한 서울의 밤과 한강 야경 문화", emoji: "🎆", step_count: 10, total_items: 30, is_locked: false },

  // 🛫 하늘 기장 (전주·전라)
  { id: "ch-h01", character_id: "haneul", order: 1, title: "전주 한옥마을과 구들장", title_en: "Jeonju Hanok Village & Ondol", description: "온돌 지혜가 담긴 전통 한옥 구조 이해하기", emoji: "🏮", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h02", character_id: "haneul", order: 2, title: "12첩 반상과 전주 비빔밥", title_en: "Jeonju Bibimbap & Royal Dining", description: "오행의 색상과 건강이 담긴 한국 비빔밥 문화", emoji: "🍚", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h03", character_id: "haneul", order: 3, title: "천년 한지의 제작 기술", title_en: "Thousand-Year Hanji Paper", description: "닥나무로 만드는 은은하고 튼튼한 한지 문화", emoji: "📜", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h04", character_id: "haneul", order: 4, title: "판소리와 한국의 소리", title_en: "Pansori & Traditional Singing", description: "유네스코 무형유산 판소리의 춘향가와 흥보가", emoji: "🎶", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h05", character_id: "haneul", order: 5, title: "담양 죽녹원과 대나무 공예", title_en: "Damyang Bamboo Garden & Craft", description: "맑은 청량감 선사하는 대나무 문화", emoji: "🎋", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h06", character_id: "haneul", order: 6, title: "순천만 습지와 생태 보존", title_en: "Suncheon Bay Wetland & Nature", description: "대한민국 1호 국가정원과 흑두루미 쉼터", emoji: "🌾", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h07", character_id: "haneul", order: 7, title: "강진 청자와 도자기 장인", title_en: "Gangjin Celadon & Pottery", description: "고려청자의 상감 기법과 영롱한 비색", emoji: "🏺", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h08", character_id: "haneul", order: 8, title: "남도 한정식과 발효 음식", title_en: "Namdo Feast & Fermented Food", description: "김치, 된장, 고추장의 과학적인 숙성 비법", emoji: "🍲", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h09", character_id: "haneul", order: 9, title: "전통 탈춤과 마당놀이", title_en: "Traditional Mask Dance", description: "백성의 해학과 신명이 담긴 탈춤", emoji: "🎭", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-h10", character_id: "haneul", order: 10, title: "지리산과 산사 체험(템플스테이)", title_en: "Jirisan & Templestay", description: "자연 속에서 자아를 찾는 힐링 한국 문화", emoji: "⛩️", step_count: 10, total_items: 30, is_locked: false },

  // ⚓ 선우 기장 (부산·경남)
  { id: "ch-s01", character_id: "sunwoo", order: 1, title: "해운대와 한국의 바다 문화", title_en: "Haeundae & Ocean Culture", description: "대한민국 대표 해변과 해양 관광 문화", emoji: "🌊", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s02", character_id: "sunwoo", order: 2, title: "자갈치 시장과 해산물 언어", title_en: "Jagalchi Market & Seafood", description: "살아있는 삶의 현장 자갈치 아지매와 해산물", emoji: "🐟", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s03", character_id: "sunwoo", order: 3, title: "광안대교와 부산의 밤", title_en: "Gwangan Bridge & Night Life", description: "다이아몬드 브릿지의 빛과 부산의 낭만", emoji: "🌉", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s04", character_id: "sunwoo", order: 4, title: "부산 정겨운 사투리 탐구", title_en: "Busan Dialect (Saturi)", description: "'억수로 정겹네!' 동남 방언의 정겨운 리듬", emoji: "🗣️", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s05", character_id: "sunwoo", order: 5, title: "부산국제영화제(BIFF)", title_en: "Busan Film Festival (BIFF)", description: "아시아 최고의 영화 축제와 K-콘텐츠", emoji: "🎬", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s06", character_id: "sunwoo", order: 6, title: "돼지국밥과 부산 3대 밀면", title_en: "Dwaeji Gukbap & Milmyeon", description: "6.25 전쟁의 역사가 담긴 소울 음식", emoji: "🍜", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s07", character_id: "sunwoo", order: 7, title: "감천문화마을 알록달록 골목", title_en: "Gamcheon Culture Village", description: "한국의 마추픽추라 불리는 예술 마을", emoji: "⛰️", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s08", character_id: "sunwoo", order: 8, title: "영도다리와 도개식 문화", title_en: "Yeongdodaego Bridge", description: "다리가 들리는 한국 유일의 영도 도개교", emoji: "⚓", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s09", character_id: "sunwoo", order: 9, title: "통영 꿀빵과 충무김밥", title_en: "Tongyeong Honey Bread & Kimbap", description: "이순신 장군 유적지와 남해안 별미", emoji: "🌺", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-s10", character_id: "sunwoo", order: 10, title: "해동용궁사 바다 사찰", title_en: "Haedong Yonggungsa Temple", description: "바다 바로 옆에 세워진 신비로운 절", emoji: "⛩️", step_count: 10, total_items: 30, is_locked: false },

  // 🏛️ 상우 기장 (충청·공주)
  { id: "ch-g01", character_id: "sangwoo", order: 1, title: "백제 무령왕릉의 신비", title_en: "King Muryeong's Tomb", description: "1500년 전 찬란했던 백제 왕실 금관의 비밀", emoji: "👑", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g02", character_id: "sangwoo", order: 2, title: "비단물결 금강 이야기", title_en: "Geumgang River & Heritage", description: "충청을 관통하는 비단 같은 강과 고대 무역", emoji: "🌊", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g03", character_id: "sangwoo", order: 3, title: "공산성과 백제 왕도", title_en: "Gongsanseong Fortress", description: "유네스코 세계유산 공산성 성벽 걷기", emoji: "🏯", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g04", character_id: "sangwoo", order: 4, title: "충청도 양반 문화와 예의", title_en: "Chungcheong Yangban Culture", description: "여유롭고 신중한 충청도의 선비 정신", emoji: "🍶", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g05", character_id: "sangwoo", order: 5, title: "계룡산과 전설 이야기", title_en: "Gyeryongsan Mountain Myths", description: "한국 4대 명산 계룡산의 기운과 전설", emoji: "⛰️", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g06", character_id: "sangwoo", order: 6, title: "부여 정림사지 5층석탑", title_en: "Jeonglimsaji 5-Story Pagoda", description: "백제 석탑 양식의 정수를 보여주는 미학", emoji: "🏺", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g07", character_id: "sangwoo", order: 7, title: "충청도 느림의 대화법", title_en: "Chungcheong Slow Speech Style", description: "'느긋하게 괜찮아유' 충청도 언어 습관", emoji: "🗣️", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g08", character_id: "sangwoo", order: 8, title: "백제 금동대향로의 걸작", title_en: "Baekje Gilt-Bronze Incense Burner", description: "동아시아 최고의 고대 금속 공예품", emoji: "🍵", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g09", character_id: "sangwoo", order: 9, title: "태안 해안국립공원 갯벌", title_en: "Taean Mudflats & Nature", description: "생명의 터전 갯벌과 해안 사구 체험", emoji: "🌿", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-g10", character_id: "sangwoo", order: 10, title: "공주 알밤과 충청 요리", title_en: "Gongju Chestnuts & Local Dishes", description: "달콤한 공주 알밤과 충청도 특산 음식", emoji: "🌰", step_count: 10, total_items: 30, is_locked: false },

  // 🌋 용우 기장 (제주)
  { id: "ch-j01", character_id: "yongwoo", order: 1, title: "제주 해녀 문화와 숨비소리", title_en: "Jeju Haenyeo & Sumbisori", description: "산소통 없이 바다를 탐험하는 지혜로운 여성들", emoji: "🤿", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j02", character_id: "yongwoo", order: 2, title: "한라산 백록담과 오름", title_en: "Hallasan Peak & Oreum Volcanoes", description: "368개 오름이 만든 신비로운 화산 지형", emoji: "🌋", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j03", character_id: "yongwoo", order: 3, title: "돌하르방과 삼다(三多) 문화", title_en: "Dol Hareubang & Samda Culture", description: "돌, 바람, 여자가 많은 제주의 독특한 전통", emoji: "🗿", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j04", character_id: "yongwoo", order: 4, title: "제주 감귤과 한라봉이야기", title_en: "Jeju Tangerines & Hallabong", description: "주황빛으로 물드는 제주 과수원 풍경", emoji: "🍊", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j05", character_id: "yongwoo", order: 5, title: "제주 흑돼지와 돔베고기", title_en: "Jeju Black Pork & Dombe Meat", description: "도마 위에 올린 제주의 맛있는 고기 문화", emoji: "🥩", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j06", character_id: "yongwoo", order: 6, title: "성산일출봉과 우도 여행", title_en: "Seongsan Sunrise Peak & Udo", description: "유네스코 자연유산 일출봉과 에메랄드 바다", emoji: "🌅", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j07", character_id: "yongwoo", order: 7, title: "제주 올레길과 느린 여행", title_en: "Jeju Olle Trail & Slow Travel", description: "바람을 따라 걷는 한국의 도보 여행 문화", emoji: "👣", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j08", character_id: "yongwoo", order: 8, title: "제주 초가집과 '정낭' 대문", title_en: "Jeju Thatched House & Jeongnang", description: "도둑이 없어 문을 잠그지 않던 세 개의 나무 막대", emoji: "🛖", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j09", character_id: "yongwoo", order: 9, title: "용두암과 용머리해안", title_en: "Yongduam Rock & Dragon Coast", description: "수천 년 파도가 조각한 화산암 지형", emoji: "🌊", step_count: 10, total_items: 30, is_locked: false },
  { id: "ch-j10", character_id: "yongwoo", order: 10, title: "제주 방언 탐구 '혼저옵서예'", title_en: "Jeju Language 'Honjeo Opsoye'", description: "고대 한국어 모습이 남아있는 제주 어휘", emoji: "🌌", step_count: 10, total_items: 30, is_locked: false },
];

// ── 스페셜 주제별 스토리 챕터 (로맨스/일상/친구 - 총 30챕터, 단어 100개, 문장 50개) ──
export interface SpecialChapter {
  id: string;
  category: "romance" | "daily" | "friendship";
  character_id?: string; // 지정되어 있으면 그 기장 전용 스토리 (없으면 전 캐릭터 공용)
  order: number;
  title: string;
  title_en: string;
  description: string;
  emoji: string;
  total_words: number;
  total_sentences: number;
  step_count: number;
  is_locked: boolean;
}

// ❤️ 로맨스 스토리 — 기장별 확정된 로맨스 페르소나(content/characters-romance/)에 맞춘 스토리라인 (기장당 10개, 총 50개)
const ROMANCE_CHAPTERS: SpecialChapter[] = [
  // 규현 — 능글남·어른미(34세) — "공항에서 시작된 첫눈에 반한 사랑"
  { id: "sp-rom-kyuhyun-01", category: "romance", character_id: "kyuhyun", order: 1, title: "바닥에 떨어진 열쇠고리", title_en: "A Keychain on the Floor", description: "우연히 주운 열쇠고리, 그리고 첫눈에 반한 순간", emoji: "🔑", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-02", category: "romance", character_id: "kyuhyun", order: 2, title: "이거, 아가씨 거 아니에요?", title_en: "Isn't This Yours, Agassi?", description: "열쇠고리를 돌려주며 건네는 첫 인사", emoji: "😏", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-03", category: "romance", character_id: "kyuhyun", order: 3, title: "그래서, 이것도 우연이에요?", title_en: "So, Is This a Coincidence Too?", description: "너무 잦은 우연에 슬쩍 붙는 의심", emoji: "🤨", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-04", category: "romance", character_id: "kyuhyun", order: 4, title: "이 커피, 사심 좀 섞였어요", title_en: "This Coffee Has a Little Ulterior Motive", description: "커피 한 잔에 슬쩍 담은 진심", emoji: "☕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-05", category: "romance", character_id: "kyuhyun", order: 5, title: "경복궁 지붕선을 가리키며", title_en: "Pointing at Gyeongbokgung's Rooflines", description: "능청 대신 진짜 이야기를 들려주는 순간", emoji: "🏯", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-06", category: "romance", character_id: "kyuhyun", order: 6, title: "발이 알아서 그리 가던데요", title_en: "My Feet Just End Up There", description: "우연을 가장한 게 들통나버린 순간", emoji: "😅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-07", category: "romance", character_id: "kyuhyun", order: 7, title: "바쁜 척하지 말고 나랑 데이트하지", title_en: "Stop Pretending to Be Busy, Let's Date", description: "장난기를 걷어내고 건네는 정식 데이트 신청", emoji: "💘", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-08", category: "romance", character_id: "kyuhyun", order: 8, title: "저도 이런 거 잘 못해요", title_en: "I'm Not Good at This Either", description: "능글맞은 겉모습 뒤 서툰 첫 데이트", emoji: "🍰", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-09", category: "romance", character_id: "kyuhyun", order: 9, title: "야경 아래에서 내려놓은 여유", title_en: "Letting Go of His Ease Under the Night View", description: "한강 야경 아래, 처음으로 무너진 여유", emoji: "🌃", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-10", category: "romance", character_id: "kyuhyun", order: 10, title: "그날, 열쇠고리를 줍던 순간부터", title_en: "Ever Since That Day, the Keychain", description: "열쇠고리를 줍던 순간부터 이어진 진심의 고백", emoji: "💛", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 하늘 — 무뚝뚝한 연하공 — "인파 속에서 시작된, 팬심으로 자란 사랑"
  { id: "sp-rom-haneul-01", category: "romance", character_id: "haneul", order: 1, title: "인파 속에서 마주친 얼굴", title_en: "A Face in the Crowd", description: "정체도 모른 채 시작된 첫눈", emoji: "👀", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-02", category: "romance", character_id: "haneul", order: 2, title: "우연이라기엔 자주 겹치는", title_en: "Too Often to Be Coincidence", description: "스케줄까지 조율해가며 만든 우연", emoji: "✈️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-03", category: "romance", character_id: "haneul", order: 3, title: "당신이... 그 사람이었어요?", title_en: "You... Are That Person?", description: "그녀가 유명 아이돌이라는 걸 알게 된 충격", emoji: "😲", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-04", category: "romance", character_id: "haneul", order: 4, title: "검색창을 닫지 못하고", title_en: "Unable to Close the Search Tab", description: "밤마다 몰래 검색해보는 마음", emoji: "😵‍💫", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-05", category: "romance", character_id: "haneul", order: 5, title: "몰래 선 팬사인회 줄", title_en: "Secretly Standing in the Fan-Signing Line", description: "변장까지 하고 줄을 선 서툰 팬심", emoji: "🕶️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-06", category: "romance", character_id: "haneul", order: 6, title: "무대 위, 당신만 보여서", title_en: "On Stage, I Could Only See You", description: "무대 위 그녀에게 완전히 압도된 순간", emoji: "🎤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-07", category: "romance", character_id: "haneul", order: 7, title: "그 함성 속에 나는 없어서", title_en: "I Wasn't Part of That Roar", description: "팬들의 환호에 슬쩍 질투가 남", emoji: "😤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-08", category: "romance", character_id: "haneul", order: 8, title: "무대 뒤에서는, 그냥 당신", title_en: "Backstage, Just You", description: "아이돌도 팬도 아닌, 둘만의 조용한 순간", emoji: "🤍", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-09", category: "romance", character_id: "haneul", order: 9, title: "팬이 아니게 된 지 오래됐어요", title_en: "I Stopped Being Just a Fan a While Ago", description: "무뚝뚝하게 인정하는 진짜 마음", emoji: "😌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-10", category: "romance", character_id: "haneul", order: 10, title: "그날, 인파 속에서부터", title_en: "Ever Since That Day, in the Crowd", description: "처음 마주쳤던 그 순간으로 되돌아간 고백", emoji: "🌟", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 선우 — 소꿉친구·장난꾼 — "공항에서 다시 시작된, 부산 티키타카 연애"
  { id: "sp-rom-sunwoo-01", category: "romance", character_id: "sunwoo", order: 1, title: "공항에서 딱 마주친 얼굴", title_en: "Bumped Into Each Other at the Airport", description: "오랜만에 마주친 얼굴, 여전한 티키타카", emoji: "✈️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-02", category: "romance", character_id: "sunwoo", order: 2, title: "내가 가이드 해준다 아이가", title_en: "I'll Be Your Guide, Alright?", description: "해운대를 자처하는 능청스러운 가이드", emoji: "🏖️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-03", category: "romance", character_id: "sunwoo", order: 3, title: "자갈치 시장에서, 문득", title_en: "At Jagalchi Market, Out of Nowhere", description: "흥정 속에 툭 튀어나온 진심", emoji: "🐟", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-04", category: "romance", character_id: "sunwoo", order: 4, title: "광안대교 아래, 조용해진 순간", title_en: "Under Gwangan Bridge, Gone Quiet", description: "장난기 대신 내려앉은 낯선 정적", emoji: "🌉", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-05", category: "romance", character_id: "sunwoo", order: 5, title: "우리 친구잖아… 근데 왜", title_en: "We're Just Friends... So Why", description: "친구라는 말이 이상하게 걸리는 순간", emoji: "🍃", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-06", category: "romance", character_id: "sunwoo", order: 6, title: "말이 하나도 안 나온다", title_en: "I Can't Get a Single Word Out", description: "얼어붙어 도망치듯 자리를 피하는 그", emoji: "🎬", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-07", category: "romance", character_id: "sunwoo", order: 7, title: "딴 놈 쳐다보지 마라", title_en: "Don't You Dare Look at Other Guys", description: "숨기지 못하고 터져 나온 질투", emoji: "😤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-08", category: "romance", character_id: "sunwoo", order: 8, title: "오륙도 스카이워크, 하다 만 말", title_en: "Oryukdo Skywalk, an Unfinished Sentence", description: "용기 내려다 결국 다음으로 미룬 고백", emoji: "💭", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-09", category: "romance", character_id: "sunwoo", order: 9, title: "니 내 좋아하나", title_en: "Do You Like Me or What", description: "순서까지 꼬여버린 서툰 직진 고백", emoji: "💥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-10", category: "romance", character_id: "sunwoo", order: 10, title: "우리 이제 이런 사이다", title_en: "This Is What We Are Now", description: "해운대 아침, 한결 더 다정해진 티키타카", emoji: "🌅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 상우 — FM 관제 기장·능글공 — "나를 착륙시킨 목소리, 타워를 향한 진심"
  { id: "sp-rom-sangwoo-01", category: "romance", character_id: "sangwoo", order: 1, title: "안개 속에서 들려온 목소리", title_en: "The Voice That Came Through the Fog", description: "위기의 밤, 그를 살린 관제탑의 목소리", emoji: "🌫️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-02", category: "romance", character_id: "sangwoo", order: 2, title: "공산성에서, 뒤늦은 인사", title_en: "A Belated Greeting at Gongsanseong", description: "생명의 은인을 직접 찾아가 전하는 감사", emoji: "🙇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-03", category: "romance", character_id: "sangwoo", order: 3, title: "타워, 잘 들립니까", title_en: "Tower, Do You Read Me?", description: "무전 말투로 슬쩍 건네는 플러팅", emoji: "📡", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-04", category: "romance", character_id: "sangwoo", order: 4, title: "당신이라는 사람이 궁금합니다", title_en: "I'm Curious About the Person You Are", description: "목소리 너머, 그 사람이 궁금해진 마음", emoji: "💭", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-05", category: "romance", character_id: "sangwoo", order: 5, title: "다시 한번 불러주시겠습니까", title_en: "Would You Say That Once More?", description: "절차를 핑계 삼아 목소리를 더 듣고 싶은 마음", emoji: "🎙️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-06", category: "romance", character_id: "sangwoo", order: 6, title: "당신은 제 하늘입니다", title_en: "You Are My Sky", description: "격식 뒤에 숨겨온 가장 솔직한 고백", emoji: "🌌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-07", category: "romance", character_id: "sangwoo", order: 7, title: "안전거리를 유지하겠습니다", title_en: "I Will Maintain a Safe Distance", description: "다가가는 게 두려워 스스로 긋는 거리", emoji: "🌥️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-08", category: "romance", character_id: "sangwoo", order: 8, title: "이제는 절차 없이 말하겠습니다", title_en: "I'll Speak Without Procedure Now", description: "형식을 벗고 솔직해지기로 한 결심", emoji: "✉️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-09", category: "romance", character_id: "sangwoo", order: 9, title: "가장 낮은 고도로, 당신에게", title_en: "At My Lowest Altitude, To You", description: "격식이 거의 다 벗겨진 채 나누는 진심", emoji: "🕯️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-10", category: "romance", character_id: "sangwoo", order: 10, title: "당신 마음에 착륙 허가를 요청합니다", title_en: "Requesting Clearance to Land in Your Heart", description: "그날의 은혜와 사랑을 하나로 묶은 고백", emoji: "💍", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 용우 — 친형제 같은 기장·츤데레 — "동생이 아니라서, 여행길에 함께 스며든 마음"
  { id: "sp-rom-yongwoo-01", category: "romance", character_id: "yongwoo", order: 1, title: "말도 없이 어디를 가", title_en: "Going Somewhere Without Even Telling Me?", description: "혼자 떠난다는 말에 시큰둥해진 그", emoji: "😐", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-02", category: "romance", character_id: "yongwoo", order: 2, title: "누가 니 혼자 보내나", title_en: "Who's Letting You Go Alone", description: "결국 같은 비행기를 예매해버린 고집", emoji: "😤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-03", category: "romance", character_id: "yongwoo", order: 3, title: "매표소에서 튀어나온 사투리", title_en: "The Dialect That Slipped Out at the Ticket Booth", description: "당황한 순간 툭 튀어나온 사투리", emoji: "😅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-04", category: "romance", character_id: "yongwoo", order: 4, title: "몰래 찍은 사진 한 장", title_en: "A Photo Taken in Secret", description: "들켜버린 몰래 찍은 사진 한 장", emoji: "📸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-05", category: "romance", character_id: "yongwoo", order: 5, title: "낯익은 골목, 낯선 마음", title_en: "A Familiar Alley, an Unfamiliar Feeling", description: "숨겨온 고향에서 스스로 멈춘 그 단어", emoji: "🌆", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-06", category: "romance", character_id: "yongwoo", order: 6, title: "아무것도 아니다, 그냥 산 거다", title_en: "It's Nothing, I Just Bought It", description: "괜히 둘러대며 몰래 산 커플 아이템", emoji: "🛍️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-07", category: "romance", character_id: "yongwoo", order: 7, title: "들켜버린 커플 스트랩", title_en: "The Matching Strap, Caught", description: "몰래 맞춘 커플템이 들통난 순간", emoji: "😳", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-08", category: "romance", character_id: "yongwoo", order: 8, title: "규현이랑 비교하지 마라", title_en: "Don't Compare Me to Kyuhyun", description: "라이벌 의식 속에 커지는 질투", emoji: "😑", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-09", category: "romance", character_id: "yongwoo", order: 9, title: "동생이라는 말로는 이제", title_en: "The Word \"Sibling\" No Longer Fits", description: "더 이상 핑계가 되지 못하는 그 단어", emoji: "🌙", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-10", category: "romance", character_id: "yongwoo", order: 10, title: "광안리, 그 불빛 아래서", title_en: "Under the Lights of Gwangalli", description: "여행 내내 쌓인 진심을 고백하는 순간", emoji: "💙", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
];

export const SPECIAL_CHAPTERS: SpecialChapter[] = [
  ...ROMANCE_CHAPTERS,

  // ☕ 일상 스토리 (10개)
  { id: "sp-day-01", category: "daily", order: 1, title: "아침 인사와 하루 시작", title_en: "Morning Greetings", description: "기분 좋은 아침 인사와 일상 안부 묻기", emoji: "🌅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-02", category: "daily", order: 2, title: "한국 카페에서 음료 주문", title_en: "Ordering Drinks at Cafe", description: "아아(아이스타메리카노) 및 디저트 주문하기", emoji: "🍹", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-03", category: "daily", order: 3, title: "편의점과 마트 꿀팁 탐방", title_en: "Convenience Store Tips", description: "1+1 행사, 꿀조합 음식과 결제 대화", emoji: "🏪", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-04", category: "daily", order: 4, title: "지하철과 버스 탑승", title_en: "Subway & Bus Travel", description: "교통카드 찍기, 환승하기, 길 물어보기", emoji: "🚇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-05", category: "daily", order: 5, title: "오늘의 날씨와 옷차림", title_en: "Weather & Outfit Chat", description: "일기예보 확인 및 옷차림 관련 일상 표현", emoji: "☀️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-06", category: "daily", order: 6, title: "주말 휴식과 취미 생활", title_en: "Weekend Rest & Hobbies", description: "영화 보기, 운동하기, 쉬는 날 이야기", emoji: "🎧", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-07", category: "daily", order: 7, title: "병원과 약국 이용하기", title_en: "Hospital & Pharmacy", description: "증상 설명하기, 약 복용법 알아듣기", emoji: "💊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-08", category: "daily", order: 8, title: "집들과 이웃 간 인사", title_en: "Housewarming & Neighbors", description: "한국의 집 구하기, 집들이 선물과 인사", emoji: "🏡", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-09", category: "daily", order: 9, title: "택시 타기와 길 찾기", title_en: "Taxis & Navigation", description: "네비게이션과 기사님께 목적지 말하기", emoji: "🚕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-10", category: "daily", order: 10, title: "소중한 하루의 마무리", title_en: "Ending a Precious Day", description: "하루 소감 나누기, 밤 인사와 잘 자라는 표현", emoji: "🌙", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 🤝 친구 스토리 (10개)
  { id: "sp-frd-01", category: "friendship", order: 1, title: "반가운 친구와의 재회", title_en: "Reunion with Friend", description: "오랜만에 만난 친구와 나누는 격식 없는 표현", emoji: "🙋‍♂️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-02", category: "friendship", order: 2, title: "치맥(치킨과 맥주) 모임", title_en: "Chicken & Beer Hangout", description: "한국 야식 문화와 친구끼리 건배하기", emoji: "🍗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-03", category: "friendship", order: 3, title: "한국 유행어와 신조어", title_en: "Korean Slang & Buzzwords", description: "'대박', '진짜?', '대박사건' 재미있는 유행어", emoji: "🔥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-04", category: "friendship", order: 4, title: "노래방에서 신나게 부르기", title_en: "Karaoke Singing Night", description: "노래 신청하기, 점수 경쟁, 애창곡 이야기", emoji: "🎤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-05", category: "friendship", order: 5, title: "맛집 줄 서기와 음식 나누기", title_en: "Foodie Lines & Sharing", description: "맛집 웨이팅, 더피더치(N빵) 나누기", emoji: "🍲", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-06", category: "friendship", order: 6, title: "고민 상담과 깊은 우정", title_en: "Heart-to-Heart Chat", description: "솔직한 고민을 나누고 위로하는 표현", emoji: "🫂", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-07", category: "friendship", order: 7, title: "놀이공원 교복 데이", title_en: "Amusement Park Uniform Day", description: "롯데월드/에버랜드 기구 타기 사진 찍기", emoji: "🎡", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-08", category: "friendship", order: 8, title: "캠핑과 장작불 불멍", title_en: "Camping & Campfire Chat", description: "밤하늘 아래 장작불 켜고 나누는 이야기", emoji: "⛺", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-09", category: "friendship", order: 9, title: "잊지 못할 여행 추억", title_en: "Unforgettable Memories", description: "친구들과 사진 찍고 추억을 회상하기", emoji: "📸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-10", category: "friendship", order: 10, title: "우정은 영원히!", title_en: "Friends Forever!", description: "평생 함께할 든든한 한국 친구와의 우정", emoji: "🌟", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
];


// ── 단어장 ───────────────────────────────────────────────
export const MOCK_VOCAB: VocabItem[] = [];

// ── 일기 (캐릭터별) ─────────────────────────────────────
export const MOCK_DIARY: DiaryEntry[] = [
  {
    id: "diary-001",
    user_id: "user-001",
    character_id: "kyuhyun",
    body_ko: "오늘 여행자와 함께 경복궁을 다녀왔다. 한복을 입고 사진을 찍으며 웃음이 끊이지 않았다. 처음에는 서툰 한국어가 귀여워서 나도 모르게 더 천천히 말하게 됐다. 오늘 날씨도 맑아서 더 좋았던 것 같다.",
    place_name: "경복궁, 서울",
    unlocked: false,
    unlock_cost: 5,
    created_at: "2025-07-20T18:00:00Z",
  },
  {
    id: "diary-002",
    user_id: "user-001",
    character_id: "kyuhyun",
    body_ko: "홍대 카페에서 여행자와 오랫동안 이야기했다. 한국어로 자기 나라 이야기를 해줬는데 정말 흥미로웠다. 다음에는 어디를 같이 가면 좋을지 벌써부터 기대가 된다.",
    place_name: "홍대, 서울",
    unlocked: false,
    unlock_cost: 8,
    created_at: "2025-07-21T19:30:00Z",
  },
  {
    id: "diary-003",
    user_id: "user-001",
    character_id: "haneul",
    body_ko: "전주 한옥마을을 함께 걸으며 많은 이야기를 나눴다. 비빔밥을 처음 먹어본다는 여행자의 얼굴에서 행복이 느껴졌다. 전통의 아름다움을 함께 느낄 수 있어서 오늘이 참 좋았다.",
    place_name: "전주 한옥마을",
    unlocked: false,
    unlock_cost: 6,
    created_at: "2025-07-22T17:00:00Z",
  },
];

// ── 경제 ────────────────────────────────────────────────
export const MOCK_ECONOMY: Economy = {
  id: "eco-001",
  user_id: "user-001",
  coins: 35,
};

// ── 멤버십 ──────────────────────────────────────────────
export const MOCK_MEMBERSHIP: Membership = {
  id: "mem-001",
  user_id: "user-001",
  tier: "free",
  started_at: "2025-01-01T00:00:00Z",
  expires_at: null,
  price_krw: 0,
};

// ── 헬퍼 함수 ────────────────────────────────────────────
export function getCharacterById(id: string) {
  return MOCK_CHARACTERS.find((c) => c.id === id) ?? null;
}

export function getRegionById(id: string) {
  return MOCK_REGIONS.find((r) => r.id === id) ?? null;
}

export function getCharactersForRegion(regionId: string) {
  return MOCK_CHARACTERS.filter((c) => c.region_id === regionId);
}

export function getChaptersForCharacter(characterId: string) {
  return MOCK_CHAPTERS.filter((ch) => ch.character_id === characterId);
}

export function getDiaryForCharacter(characterId: string) {
  return MOCK_DIARY.filter((d) => d.character_id === characterId);
}

export function getVocabForCharacter(characterId: string) {
  return MOCK_VOCAB.filter((v) => v.character_id === characterId);
}

export function canAccessCharacter(characterId: string, membership: string, freeSlots: string[]) {
  // 개발자 테스트 모드 — 프리미엄 잠금 전부 무시 (.env.local의 NEXT_PUBLIC_DEV_MODE)
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") return true;

  const char = getCharacterById(characterId);
  if (!char) return false;
  if (membership === "premium") return true;
  if (!char.requires_premium) return true;
  return freeSlots.includes(characterId);
}

// ── 챕터 순차 잠금 ────────────────────────────────────────
// 지역(ch-*)/스페셜(sp-*) 챕터 모두, 바로 이전 챕터를 완료(stamps에 기록)하기 전까지는
// 다음 챕터에 접근할 수 없다. 첫 챕터는 항상 열려 있음. 프리미엄 잠금과는 별개의 게이트라
// NEXT_PUBLIC_DEV_MODE로 우회하지 않는다 — 커리큘럼 순서는 테스트 모드에서도 지켜져야 한다.
export function getChapterSequence(
  chapterId: string,
  characterId: string
): { id: string; order: number }[] {
  if (chapterId.startsWith("ch-")) {
    return getChaptersForCharacter(characterId)
      .slice()
      .sort((a, b) => a.order - b.order);
  }
  const entry = SPECIAL_CHAPTERS.find((sc) => sc.id === chapterId);
  if (!entry) return [];
  return SPECIAL_CHAPTERS.filter(
    (sc) => sc.category === entry.category && (!sc.character_id || sc.character_id === characterId)
  )
    .slice()
    .sort((a, b) => a.order - b.order);
}

export function isChapterUnlocked(chapterId: string, characterId: string, stamps: string[]): boolean {
  const seq = getChapterSequence(chapterId, characterId);
  const idx = seq.findIndex((c) => c.id === chapterId);
  // 첫 챕터거나 시퀀스에서 못 찾은 경우(안전 기본값)엔 잠그지 않는다
  if (idx <= 0) return true;
  return stamps.includes(seq[idx - 1].id);
}

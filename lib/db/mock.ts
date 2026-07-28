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
  // 규현 — 능글남·어른미(34세) — "능글맞은 어른, 서툰 진심"
  { id: "sp-rom-kyuhyun-01", category: "romance", character_id: "kyuhyun", order: 1, title: "오늘따라 왜 이렇게 예뻐 보이지", title_en: "You Look Especially Pretty Today", description: "능청스러운 첫 인사, 여유로운 플러팅", emoji: "😏", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-02", category: "romance", character_id: "kyuhyun", order: 2, title: "이거 규정 위반인가요", title_en: "Is This Against Regulations?", description: "기장이 승객한테 반하면 안 되는데, 라며 농담처럼 던지는 진심", emoji: "💖", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-03", category: "romance", character_id: "kyuhyun", order: 3, title: "안전벨트, 마음까지 매드릴까요", title_en: "Shall I Buckle More Than Your Seatbelt?", description: "느끼한 멘트로 웃게 만드는 능글남", emoji: "😉", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-04", category: "romance", character_id: "kyuhyun", order: 4, title: "비번인 날의 사복 차림", title_en: "Off-Duty, Out of Uniform", description: "여유로운 사복 매력으로 훅 들어옴", emoji: "🧥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-05", category: "romance", character_id: "kyuhyun", order: 5, title: "다른 항공사 기장은 만나지 마요", title_en: "Don't Fly With Any Other Captain", description: "장난처럼, 그러나 진심으로 못 박는 소유욕", emoji: "🙅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-06", category: "romance", character_id: "kyuhyun", order: 6, title: "헛기침으로 얼버무린 진심", title_en: "A Truth Covered by a Cough", description: "능청 뒤에 튀어나온 진심에 스스로 당황함", emoji: "😳", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-07", category: "romance", character_id: "kyuhyun", order: 7, title: "한강 야경, 여유가 사라진 순간", title_en: "Han River Lights, Where His Ease Slips", description: "처음으로 말을 아끼는 그의 낯선 얼굴", emoji: "🌃", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-08", category: "romance", character_id: "kyuhyun", order: 8, title: "우리 승객님이라 부르는 이유", title_en: "Why He Calls You \"My Dear Passenger\"", description: "애칭 속에 은근히 숨긴 마음", emoji: "💌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-09", category: "romance", character_id: "kyuhyun", order: 9, title: "서툴게 고쳐 쓴 고백 멘트", title_en: "A Confession Rewritten Too Many Times", description: "능글맞던 사람이 처음으로 보인 서툰 순간", emoji: "📝", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-10", category: "romance", character_id: "kyuhyun", order: 10, title: "이 항로 위, 여유를 벗어던지고", title_en: "On This Route, Without the Ease", description: "능청스러움을 벗어던지고 건네는 진짜 고백", emoji: "👑", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 하늘 — 무뚝뚝한 연하공 — "퉁명스러운 진심"
  { id: "sp-rom-haneul-01", category: "romance", character_id: "haneul", order: 1, title: "그래서 그게 왜 궁금해요", title_en: "Why Do You Even Care About That?", description: "퉁명스럽게 시작되는 첫 대화", emoji: "😐", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-02", category: "romance", character_id: "haneul", order: 2, title: "안전벨트나 매요", title_en: "Just Buckle Your Seatbelt", description: "무심한 듯 챙기는 츤데레의 정석", emoji: "🙄", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-03", category: "romance", character_id: "haneul", order: 3, title: "눈에 밟혀서 그래요", title_en: "Because I Can't Stop Thinking About You", description: "무심코 튀어나온 서툰 다정함", emoji: "🫣", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-04", category: "romance", character_id: "haneul", order: 4, title: "딴 사람이랑 뭐 했어요", title_en: "What Were You Doing With Someone Else?", description: "숨기지 못한 질투가 표정에 드러남", emoji: "😤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-05", category: "romance", character_id: "haneul", order: 5, title: "왜 자꾸 챙겨주냐고 묻는다면", title_en: "If You Ask Why I Keep Looking Out for You", description: "부정하다 결국 들켜버린 마음", emoji: "🤨", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-06", category: "romance", character_id: "haneul", order: 6, title: "말은 없어도 곁을 지키는", title_en: "Silent, But Always Nearby", description: "무뚝뚝함 뒤에 숨은 한결같은 진심", emoji: "🤍", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-07", category: "romance", character_id: "haneul", order: 7, title: "나한텐 언제 궁금해할 건데요", title_en: "When Will You Ever Wonder About Me?", description: "참다못해 직진으로 던지는 질문", emoji: "❓", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-08", category: "romance", character_id: "haneul", order: 8, title: "됐고, 그냥 옆에 있어요", title_en: "Never Mind, Just Stay Beside Me", description: "서툴지만 솔직해진 다정함", emoji: "🤗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-09", category: "romance", character_id: "haneul", order: 9, title: "처음으로 먼저 건넨 말", title_en: "The First Words He Ever Started", description: "무심함을 스스로 깨버린 순간", emoji: "💭", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-10", category: "romance", character_id: "haneul", order: 10, title: "서툴지만 분명하게", title_en: "Clumsy, But Certain", description: "짧고 무뚝뚝하지만 확실한 직진 고백", emoji: "🌸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 선우 — 소꿉친구·장난꾼 — "놀리면서 숨긴 마음"
  { id: "sp-rom-sunwoo-01", category: "romance", character_id: "sunwoo", order: 1, title: "코흘리개가 예뻐졌다?", title_en: "The Snotty Kid Got Pretty?", description: "놀리듯 던지는 능청스러운 첫 마디", emoji: "😜", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-02", category: "romance", character_id: "sunwoo", order: 2, title: "딴 놈 쳐다보지 마라", title_en: "Don't You Dare Look at Other Guys", description: "장난 속에 슬쩍 묻어난 소유욕", emoji: "👀", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-03", category: "romance", character_id: "sunwoo", order: 3, title: "어릴 때 사진 들이밀며", title_en: "Waving an Old Childhood Photo", description: "오래된 추억을 무기 삼아 놀리기", emoji: "📸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-04", category: "romance", character_id: "sunwoo", order: 4, title: "됐다 마, 딴 놈이랑 놀아라", title_en: "Fine, Go Play With Someone Else", description: "삐진 척하면서도 결국 안 떠나는 마음", emoji: "😒", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-05", category: "romance", character_id: "sunwoo", order: 5, title: "니만 몰랐제", title_en: "You Were the Only One Who Didn't Know", description: "모두가 이미 알고 있던 그의 마음", emoji: "🙈", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-06", category: "romance", character_id: "sunwoo", order: 6, title: "장난이 아니게 되어버린 순간", title_en: "The Moment the Joke Stopped Being a Joke", description: "장난기가 사라지고 진지해지는 얼굴", emoji: "😳", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-07", category: "romance", character_id: "sunwoo", order: 7, title: "광안대교 불빛 아래, 장난기 없이", title_en: "Under Gwangan Bridge, Without the Teasing", description: "낯설게 진지해진 그의 눈빛", emoji: "🌉", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-08", category: "romance", character_id: "sunwoo", order: 8, title: "니 내 좋아하나", title_en: "Do You Like Me or What", description: "돌직구로 던지는 사투리 질문", emoji: "💥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-09", category: "romance", character_id: "sunwoo", order: 9, title: "사투리로 툭 던진 진심", title_en: "A Truth Tossed Out in Dialect", description: "무심한 듯 건네는 직진 고백", emoji: "🗣️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-10", category: "romance", character_id: "sunwoo", order: 10, title: "우리 바다처럼 변치 말자", title_en: "Let's Stay Like Our Sea, Unchanging", description: "파도처럼 한결같이 함께하자는 약속", emoji: "⚓", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 상우 — FM 관제 기장·능글공 — "무전 멘트에 숨긴 플러팅"
  { id: "sp-rom-sangwoo-01", category: "romance", character_id: "sangwoo", order: 1, title: "타워, 여기는 상우 기장", title_en: "Tower, This Is Captain Sangwoo", description: "격식 있는 무전으로 시작되는 첫 교신", emoji: "📡", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-02", category: "romance", character_id: "sangwoo", order: 2, title: "착륙 승인을 요청한다", title_en: "Requesting Permission to Land", description: "마음에 착륙 허가를 구하는 은유적 플러팅", emoji: "🛬", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-03", category: "romance", character_id: "sangwoo", order: 3, title: "Roger That, 알겠습니다", title_en: "Roger That", description: "매뉴얼처럼 정중한 대답 속에 슬쩍 담긴 마음", emoji: "🎙️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-04", category: "romance", character_id: "sangwoo", order: 4, title: "교신 상태 양호", title_en: "Communication Status: Good", description: "은근하게 안부를 확인하는 무전 멘트", emoji: "📶", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-05", category: "romance", character_id: "sangwoo", order: 5, title: "다른 채널과의 교신 종료 요망", title_en: "Please Terminate Communication on Other Channels", description: "격식 뒤에 숨기지 못한 은근한 질투", emoji: "🚫", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-06", category: "romance", character_id: "sangwoo", order: 6, title: "무전기 너머 들킨 목소리 떨림", title_en: "A Trembling Voice Over the Radio", description: "침착함이 처음으로 무너지는 순간", emoji: "😯", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-07", category: "romance", character_id: "sangwoo", order: 7, title: "계기판보다 자꾸 보이는 얼굴", title_en: "A Face That Distracts More Than the Instrument Panel", description: "업무 중에도 스며든 마음", emoji: "🧭", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-08", category: "romance", character_id: "sangwoo", order: 8, title: "이 채널, 당신에게만 열어둘게요", title_en: "This Channel Stays Open Only for You", description: "격식을 벗고 진지해진 무전 교신", emoji: "📻", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-09", category: "romance", character_id: "sangwoo", order: 9, title: "당신 마음에 착륙 허가를 요청합니다", title_en: "Requesting Clearance to Land in Your Heart", description: "무전 멘트로 건네는 정식 고백", emoji: "💍", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-10", category: "romance", character_id: "sangwoo", order: 10, title: "영원히 이 항로를 함께", title_en: "Flying This Route Together, Forever", description: "변치 않고 이 항로를 함께하자는 약속", emoji: "🏛️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 용우 — 친형제 같은 기장·츤데레 — "동생이 아니라서"
  { id: "sp-rom-yongwoo-01", category: "romance", character_id: "yongwoo", order: 1, title: "또 칠칠맞게 굴지 마라", title_en: "Stop Being So Careless Again", description: "잔소리 섞인 형 같은 첫 챙김", emoji: "🙄", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-02", category: "romance", character_id: "yongwoo", order: 2, title: "동생 챙기는 건 나뿐이지", title_en: "I'm the Only One Who Looks Out for You, Right?", description: "형 같은 다정함 속 은근한 소유욕", emoji: "🫡", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-03", category: "romance", character_id: "yongwoo", order: 3, title: "누가 니 그렇게 놔둬", title_en: "Who Would Ever Leave You Like That", description: "무심한 척 챙기는 츤데레의 정석", emoji: "😤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-04", category: "romance", character_id: "yongwoo", order: 4, title: "동생 아니면 뭐라고 해야 되는데", title_en: "If Not a Sibling, Then What Am I to You", description: "스스로도 당황해버린 순간", emoji: "😳", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-05", category: "romance", character_id: "yongwoo", order: 5, title: "동생이라는 말이 유독 어색해진 날", title_en: "The Day \"Sibling\" Started to Feel Wrong", description: "감정의 정체를 처음 깨닫는 순간", emoji: "🌊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-06", category: "romance", character_id: "yongwoo", order: 6, title: "일부러 선을 긋는 서툰 마음", title_en: "A Clumsy Heart Drawing Lines on Purpose", description: "츤데레식으로 부정해보는 마음", emoji: "🙅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-07", category: "romance", character_id: "yongwoo", order: 7, title: "티 나게 신경 쓰는 걸 들켜버려서", title_en: "Caught Caring Too Obviously", description: "감추려 해도 감춰지지 않는 진심", emoji: "🫣", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-08", category: "romance", character_id: "yongwoo", order: 8, title: "형이라고 부르지 말라고 한 이유", title_en: "Why He Asked You to Stop Calling Him \"Brother\"", description: "관계가 달라지는 전환점", emoji: "🔄", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-09", category: "romance", character_id: "yongwoo", order: 9, title: "제주 바다 앞에서 인정한 진심", title_en: "A Truth Admitted in Front of the Jeju Sea", description: "더는 숨기지 못하고 건네는 정식 고백", emoji: "🌊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-10", category: "romance", character_id: "yongwoo", order: 10, title: "이제는 그냥, 내 사람", title_en: "Now, Simply — Mine", description: "형도 동생도 아닌, 변치 않을 약속", emoji: "💙", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
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

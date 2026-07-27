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

export const SPECIAL_CHAPTERS: SpecialChapter[] = [
  // ❤️ 로맨스 스토리 (10개)
  { id: "sp-rom-01", category: "romance", order: 1, title: "첫눈에 반한 기장님", title_en: "Love at First Sight", description: "비행기 안에서 시작된 설레는 첫 만남과 심쿵 표현", emoji: "💖", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-02", category: "romance", order: 2, title: "둘만의 밤하늘 비행", title_en: "Flight Under the Stars", description: "밤하늘의 별을 보며 나누는 로맨틱한 대화", emoji: "🌌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-03", category: "romance", order: 3, title: "달콤한 카페 데이트", title_en: "Sweet Cafe Date", description: "예쁜 카페에서 고백하는 좋아하는 마음", emoji: "☕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-04", category: "romance", order: 4, title: "손을 잡던 떨리던 날", title_en: "The Day We Held Hands", description: "처음 손을 잡을 때 쓰는 감정 및 애정 표현", emoji: "🤝", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-05", category: "romance", order: 5, title: "고백의 순간 '좋아해'", title_en: "Moment of Confession", description: "진심을 전하는 한국어 고백 멘트와 다정한 표현", emoji: "💌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-06", category: "romance", order: 6, title: "남산타워 사랑의 자물쇠", title_en: "Namsan Love Lock", description: "영원한 사랑을 약속하며 걸어두는 자물쇠 메시지", emoji: "🔒", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-07", category: "romance", order: 7, title: "비 내리는 날의 우산", title_en: "Umbrella on a Rainy Day", description: "하나의 우산을 쓰고 나누는 따뜻한 소통", emoji: "☔", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-08", category: "romance", order: 8, title: "커플 링과 소중한 약속", title_en: "Couple Rings & Promises", description: "기념일과 약속을 나눌 때 쓰는 로맨틱한 단어", emoji: "💍", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-09", category: "romance", order: 9, title: "보고 싶을 때 쓰는 말", title_en: "When I Miss You", description: "그리움과 보고 싶은 마음을 표현하는 애칭", emoji: "🥺", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-10", category: "romance", order: 10, title: "영원한 해피 엔딩", title_en: "Eternal Happy Ending", description: "서로의 곁을 지켜주는 진실한 사랑과 미래", emoji: "👑", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

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

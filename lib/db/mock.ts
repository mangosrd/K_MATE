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

// ❤️ 로맨스 스토리 — 기장별 성격에 맞춰 완전히 다른 스토리라인 (기장당 10개, 총 50개)
const ROMANCE_CHAPTERS: SpecialChapter[] = [
  // 규현 (친절·전문적인 서울 기장) — "완벽한 기장님의 서툰 진심"
  { id: "sp-rom-kyuhyun-01", category: "romance", character_id: "kyuhyun", order: 1, title: "승객 명단 속 그 이름", title_en: "The Name on the Passenger List", description: "정중한 인사 뒤에 숨긴 떨림, 처음 눈이 마주친 순간", emoji: "💖", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-02", category: "romance", character_id: "kyuhyun", order: 2, title: "방송 중 말이 헛나온 날", title_en: "A Slip of the Tongue Mid-Announcement", description: "평소처럼 안내 방송을 하다 그만 말이 꼬여버린 기장님", emoji: "🎙️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-03", category: "romance", character_id: "kyuhyun", order: 3, title: "비번인 날, 경복궁에서", title_en: "Off-Duty at Gyeongbokgung", description: "사복 차림으로 우연히 마주친 낯설고도 반가운 얼굴", emoji: "🏯", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-04", category: "romance", character_id: "kyuhyun", order: 4, title: "한강, 야근 뒤의 산책", title_en: "A Walk Along the Han River", description: "근무를 마치고 함께 걷는 조용하고 다정한 저녁", emoji: "🌃", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-05", category: "romance", character_id: "kyuhyun", order: 5, title: "서툰 손편지", title_en: "A Clumsy Handwritten Letter", description: "정갈한 성격답지 않게 몇 번이나 고쳐 쓴 편지 한 장", emoji: "💌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-06", category: "romance", character_id: "kyuhyun", order: 6, title: "첫눈 오던 날의 약속", title_en: "A Promise on the First Snow", description: "겨울, 첫눈을 함께 보자는 조심스러운 다짐", emoji: "❄️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-07", category: "romance", character_id: "kyuhyun", order: 7, title: "티가 나버린 질투", title_en: "Jealousy He Couldn't Hide", description: "다른 사람과 웃는 모습에 자기도 모르게 굳어진 표정", emoji: "😤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-08", category: "romance", character_id: "kyuhyun", order: 8, title: "기내 방송으로 전한 고백", title_en: "A Confession Over the Intercom", description: "승객들 몰래, 방송 멘트에 살짝 담아낸 진심", emoji: "💬", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-09", category: "romance", character_id: "kyuhyun", order: 9, title: "우산 하나, 마음 하나", title_en: "One Umbrella, One Heart", description: "비 오는 날 씌워준 우산 속, 가까워진 거리", emoji: "☔", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-kyuhyun-10", category: "romance", character_id: "kyuhyun", order: 10, title: "이 노선의 끝에서 다시", title_en: "Always at the End of This Route", description: "앞으로도 이 하늘 위에서 계속 만나자는 약속", emoji: "👑", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 하늘 (따뜻하고 시적인 전주 기장) — "한옥마을의 잔잔한 사랑"
  { id: "sp-rom-haneul-01", category: "romance", character_id: "haneul", order: 1, title: "처마 밑에서 만난 그대", title_en: "Sheltered Under the Eaves", description: "소나기를 피해 나란히 서 있던 첫 순간", emoji: "🌧️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-02", category: "romance", character_id: "haneul", order: 2, title: "전주 골목길을 걸으며", title_en: "Wandering Jeonju's Alleys", description: "나란히 걷다 스치듯 닿은 손끝", emoji: "🏮", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-03", category: "romance", character_id: "haneul", order: 3, title: "한복을 입은 그대", title_en: "You in a Hanbok", description: "처음으로 마주한 낯설고 설레는 모습", emoji: "👘", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-04", category: "romance", character_id: "haneul", order: 4, title: "경기전의 고요한 오후", title_en: "A Quiet Afternoon at Gyeonggijeon", description: "말이 없어도 어색하지 않은 편안한 시간", emoji: "🍃", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-05", category: "romance", character_id: "haneul", order: 5, title: "나눠 먹는 비빔밥 한 그릇", title_en: "Sharing a Bowl of Bibimbap", description: "숟가락 두 개, 소박하게 오가는 정", emoji: "🥗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-06", category: "romance", character_id: "haneul", order: 6, title: "전통찻집의 밤", title_en: "A Night at the Tea House", description: "따뜻한 차 한 잔과 함께 꺼내는 속마음", emoji: "🍵", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-07", category: "romance", character_id: "haneul", order: 7, title: "오래된 사진관에서", title_en: "At the Old Photo Studio", description: "함께 담은, 오래 간직하고 싶은 한 장", emoji: "📷", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-08", category: "romance", character_id: "haneul", order: 8, title: "붓끝에 눌러 담은 마음", title_en: "A Feeling Pressed into Brushstrokes", description: "서예로 정성껏 전하는 하늘의 진심", emoji: "🖌️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-09", category: "romance", character_id: "haneul", order: 9, title: "대숲을 스치는 바람", title_en: "Wind Through the Bamboo Grove", description: "조용히, 그러나 분명하게 건넨 고백", emoji: "🎋", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-haneul-10", category: "romance", character_id: "haneul", order: 10, title: "다시 돌아오는 계절처럼", title_en: "Like the Seasons That Return", description: "사계절이 지나도 변치 않을 마음의 약속", emoji: "🌸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 선우 (유쾌하고 활발한 부산 기장) — "밀당 넘치는 바다 사나이의 서툰 진심"
  { id: "sp-rom-sunwoo-01", category: "romance", character_id: "sunwoo", order: 1, title: "해운대에서 생긴 일", title_en: "Something Happened at Haeundae", description: "능청스럽게 다가오지만 은근 서툰 첫 만남", emoji: "🏖️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-02", category: "romance", character_id: "sunwoo", order: 2, title: "광안리 밤바다 드라이브", title_en: "A Night Drive Along Gwangalli", description: "장난기 가득한 티키타카가 오가는 드라이브", emoji: "🚗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-03", category: "romance", character_id: "sunwoo", order: 3, title: "자갈치 시장 데이트", title_en: "A Date at Jagalchi Market", description: "먹으면서도 티격태격, 은근 잘 맞는 사이", emoji: "🐟", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-04", category: "romance", character_id: "sunwoo", order: 4, title: "부산 사투리 과외", title_en: "Busan Dialect Lessons", description: "사투리를 가르쳐주다 문득 가까워진 거리", emoji: "🗣️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-05", category: "romance", character_id: "sunwoo", order: 5, title: "영화의 전당, 우리 둘의 스크린", title_en: "Just the Two of Us at the Cinema Center", description: "BIFF의 밤, 나란히 앉은 어두운 상영관", emoji: "🎬", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-06", category: "romance", character_id: "sunwoo", order: 6, title: "숨기지 못한 질투", title_en: "Jealousy He Couldn't Play Cool About", description: "능청스러움 뒤에 감춘, 티 나버린 서툰 마음", emoji: "😳", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-07", category: "romance", character_id: "sunwoo", order: 7, title: "파도처럼 밀려오는 마음", title_en: "A Heart Rushing In Like the Tide", description: "장난기가 사라지고 진지해지는 순간", emoji: "🌊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-08", category: "romance", character_id: "sunwoo", order: 8, title: "광안대교 불빛 아래", title_en: "Under the Lights of Gwangan Bridge", description: "장난기 대신 담긴, 낯설게 진지한 눈빛", emoji: "🌉", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-09", category: "romance", character_id: "sunwoo", order: 9, title: "사투리로 건넨 고백", title_en: "A Confession in Busan Dialect", description: "\"니 내 좋아하나?\" 돌직구로 건넨 진심", emoji: "💥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sunwoo-10", category: "romance", character_id: "sunwoo", order: 10, title: "우리 바다처럼 오래오래", title_en: "Forever Like Our Sea", description: "파도처럼 변치 않고 함께하자는 약속", emoji: "⚓", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 상우 (침착하고 역사에 진심인 공주 기장) — "천천히, 그러나 깊게"
  { id: "sp-rom-sangwoo-01", category: "romance", character_id: "sangwoo", order: 1, title: "무령왕릉 앞에서", title_en: "In Front of King Muryeong's Tomb", description: "역사를 설명하다 문득 마주친 눈빛", emoji: "🏺", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-02", category: "romance", character_id: "sangwoo", order: 2, title: "금강을 따라 걷는 시간", title_en: "Walking Along the Geumgang River", description: "말이 없어도 어색하지 않은 편안한 동행", emoji: "🏞️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-03", category: "romance", character_id: "sangwoo", order: 3, title: "오래된 책방에서", title_en: "At an Old Bookshop", description: "고서 사이에서 우연히 시작된 짧은 대화", emoji: "📚", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-04", category: "romance", character_id: "sangwoo", order: 4, title: "유물처럼 깊어지는 마음", title_en: "A Heart Deepening Like an Old Relic", description: "시간이 갈수록 조금씩 진해지는 감정", emoji: "🪶", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-05", category: "romance", character_id: "sangwoo", order: 5, title: "계룡산을 함께 오르며", title_en: "Climbing Gyeryongsan Together", description: "땀 흘리며 서로의 걸음을 챙기는 시간", emoji: "⛰️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-06", category: "romance", character_id: "sangwoo", order: 6, title: "공주 야시장의 밤", title_en: "A Night at Gongju's Night Market", description: "평소와 다르게, 낯설도록 환하게 웃는 얼굴", emoji: "🏮", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-07", category: "romance", character_id: "sangwoo", order: 7, title: "서두르지 않는 진심", title_en: "A Sincerity That Never Rushes", description: "침착함 뒤에 결국 들켜버린 마음", emoji: "🕰️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-08", category: "romance", character_id: "sangwoo", order: 8, title: "붓으로 눌러 쓴 편지", title_en: "A Letter Pressed in Ink", description: "고문서를 필사하듯 한 자 한 자 눌러쓴 진심", emoji: "✒️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-09", category: "romance", character_id: "sangwoo", order: 9, title: "천오백 년의 사랑처럼", title_en: "Like a Love a Thousand Years Old", description: "긴 역사에 빗대어 건네는 진지한 고백", emoji: "📜", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-sangwoo-10", category: "romance", character_id: "sangwoo", order: 10, title: "변치 않는 유적처럼", title_en: "Like a Relic That Never Fades", description: "오래도록, 한결같이 함께하자는 다짐", emoji: "🏛️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 용우 (낭만적이고 철학적인 제주 기장) — "가장 로맨틱한 기장님"
  { id: "sp-rom-yongwoo-01", category: "romance", character_id: "yongwoo", order: 1, title: "구름 위에서 만난 그대", title_en: "You, Met Above the Clouds", description: "시적인 분위기 속에서 시작된 첫 만남", emoji: "☁️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-02", category: "romance", character_id: "yongwoo", order: 2, title: "백록담, 둘만의 정상", title_en: "Baengnokdam, Just the Two of Us", description: "함께 오른 한라산 정상에서 나눈 숨결", emoji: "🌋", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-03", category: "romance", character_id: "yongwoo", order: 3, title: "성산일출봉의 새벽", title_en: "Dawn at Seongsan Ilchulbong", description: "함께 맞이하는 첫 해, 그리고 첫 마음", emoji: "🌅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-04", category: "romance", character_id: "yongwoo", order: 4, title: "해녀 할머니의 바다 이야기", title_en: "A Haenyeo's Tales of the Sea", description: "제주 바다에 얽힌 이야기 속 낭만", emoji: "🌊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-05", category: "romance", character_id: "yongwoo", order: 5, title: "감귤빛으로 물든 오후", title_en: "An Afternoon Tinted Tangerine", description: "따뜻한 색感 가득한 감귤밭 데이트", emoji: "🍊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-06", category: "romance", character_id: "yongwoo", order: 6, title: "올레길, 말없이 걷는 길", title_en: "Olle Trail, Walking in Silence", description: "자연 속에서 말보다 깊어지는 마음", emoji: "🚶", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-07", category: "romance", character_id: "yongwoo", order: 7, title: "별이 쏟아지던 밤", title_en: "A Night the Stars Poured Down", description: "고백을 앞둔, 두근거리는 밤하늘 아래", emoji: "🌌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-08", category: "romance", character_id: "yongwoo", order: 8, title: "바람이 전하는 마음", title_en: "A Heart Carried by the Wind", description: "제주 바람에 실어 보내는 조심스러운 진심", emoji: "🍃", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-09", category: "romance", character_id: "yongwoo", order: 9, title: "파도 소리에 담은 고백", title_en: "A Confession in the Sound of Waves", description: "가장 로맨틱한 기장님의, 가장 진심 어린 순간", emoji: "💙", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-rom-yongwoo-10", category: "romance", character_id: "yongwoo", order: 10, title: "우리, 이 섬처럼 변함없이", title_en: "Us, Unchanging Like This Island", description: "제주도처럼 영원할 사랑을 약속하는 마지막 장", emoji: "🌺", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
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

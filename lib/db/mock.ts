// ============================================================
// K-MATE Mock DB v2 — Supabase 연결 전 임시 데이터
// ============================================================
import type { Character, Region, Chapter } from "@/types/database";

// ── 사용자 ───────────────────────────────────────────────
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
    airport_code: "CJJ",
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

  // ☕ 일상 스토리 — 로맨스 아닌 슬라이스 오브 라이프, 기장별 동일한 10개 주제(아침/카페/편의점/
  // 대중교통/날씨/취미/병원/집들이/택시/하루마무리)를 각자의 지역·성격으로 풀어낸 스토리 (기장당 10개, 총 50개)
  // 규현·하늘 = 무료(기본형, level/dialogues 없음) · 선우·상우·용우 = 프리미엄(중고급형, level+dialogues 2개)
  { id: "sp-day-kyuhyun-01", category: "daily", character_id: "kyuhyun", order: 1, title: "아침을 여는 인사", title_en: "A Greeting That Opens the Morning", description: "골목 어귀에서 커피를 들고 기다리는 규현과 나누는 상쾌한 아침 인사", emoji: "☀️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-02", category: "daily", character_id: "kyuhyun", order: 2, title: "아이스 아메리카노 주세요", title_en: "One Iced Americano, Please", description: "카페에서 규현의 도움으로 첫 음료 주문에 도전하는 이야기", emoji: "☕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-03", category: "daily", character_id: "kyuhyun", order: 3, title: "편의점 꿀템 탐방", title_en: "A Tour of Convenience Store Tips", description: "저녁 편의점에서 삼각김밥과 1+1 꿀팁을 알려주는 규현", emoji: "🏪", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-04", category: "daily", character_id: "kyuhyun", order: 4, title: "환승은 이쪽으로", title_en: "Transfer This Way", description: "붐비는 지하철과 버스를 규현과 함께 갈아타며 이동하는 하루", emoji: "🚇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-05", category: "daily", character_id: "kyuhyun", order: 5, title: "쌀쌀한 날의 겉옷", title_en: "A Jacket for a Chilly Day", description: "갑자기 쌀쌀해진 날씨에 겉옷과 우산을 챙겨주는 규현", emoji: "🌦️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-06", category: "daily", character_id: "kyuhyun", order: 6, title: "여유로운 주말 오후", title_en: "A Leisurely Weekend Afternoon", description: "한강공원에서 뒹굴며 서로의 취미를 이야기하는 여유로운 주말", emoji: "🌿", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-07", category: "daily", character_id: "kyuhyun", order: 7, title: "감기 기운이 있어서", title_en: "Coming Down with a Cold", description: "감기 걸린 나를 병원과 약국에 데려가 챙겨주는 규현", emoji: "💊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-08", category: "daily", character_id: "kyuhyun", order: 8, title: "이사떡 돌리는 날", title_en: "Handing Out Moving-Day Rice Cake", description: "새로 이사한 집에서 이사떡을 들고 이웃에게 인사하러 다니는 이야기", emoji: "🏠", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-09", category: "daily", character_id: "kyuhyun", order: 9, title: "여기서 세워주세요", title_en: "Please Stop Here", description: "길을 잃어 결국 택시를 잡아타고 목적지를 찾아가는 소동", emoji: "🚕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-kyuhyun-10", category: "daily", character_id: "kyuhyun", order: 10, title: "잘 자요, 내일 봐요", title_en: "Good Night, See You Tomorrow", description: "노을 지는 언덕에서 하루를 돌아보고 집까지 배웅받는 하루의 마무리", emoji: "🌇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-day-haneul-01", category: "daily", character_id: "haneul", order: 1, title: "골목길의 아침 인사", title_en: "Good Morning in the Alley", description: "안개 낀 한옥마을 골목에서 하늘과 함께 시작하는 아침 산책", emoji: "🌄", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-02", category: "daily", character_id: "haneul", order: 2, title: "객리단길, 아메리카노 한 잔", title_en: "A Cup of Americano on Gaekridan-gil", description: "객리단길 카페에서 하늘이 알아서 챙겨주는 커피 한 잔의 시간", emoji: "☕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-03", category: "daily", character_id: "haneul", order: 3, title: "편의점에서, 오후의 간식", title_en: "Afternoon Snacks at the Convenience Store", description: "무더운 오후, 편의점에서 마주치는 소소한 장보기 순간들", emoji: "🏪", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-04", category: "daily", character_id: "haneul", order: 4, title: "버스를 타고", title_en: "Riding the Bus", description: "지하철 없는 전주에서 버스로 이동하며 배우는 대중교통 이용법", emoji: "🚌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-05", category: "daily", character_id: "haneul", order: 5, title: "오늘 날씨엔 이 옷", title_en: "Dressed for Today's Weather", description: "변덕스러운 날씨에 맞춰 옷차림을 챙겨주는 하늘의 무심한 배려", emoji: "🧥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-06", category: "daily", character_id: "haneul", order: 6, title: "카메라를 든 주말", title_en: "A Weekend with a Camera", description: "비번인 주말, 카메라를 든 하늘과 함께하는 전주천 산책", emoji: "📷", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-07", category: "daily", character_id: "haneul", order: 7, title: "약국 가는 길", title_en: "On the Way to the Pharmacy", description: "몸살이 난 날, 하늘과 함께 병원과 약국을 오가는 하루", emoji: "💊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-08", category: "daily", character_id: "haneul", order: 8, title: "소박한 집들이", title_en: "A Simple Housewarming", description: "새 집에 놀러 온 하늘과 함께하는 소박한 집들이와 이웃 인사", emoji: "🏠", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-09", category: "daily", character_id: "haneul", order: 9, title: "막차 대신 택시", title_en: "A Taxi Instead of the Last Bus", description: "막차를 놓친 밤, 택시를 타고 집으로 돌아가는 길", emoji: "🚕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-haneul-10", category: "daily", character_id: "haneul", order: 10, title: "노을 아래, 하루의 끝", title_en: "End of the Day, Beneath the Sunset", description: "노을 지는 강변에서 하루를 마무리하며 나누는 편안한 대화", emoji: "🌇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-day-sunwoo-01", category: "daily", character_id: "sunwoo", order: 1, title: "눈뜨자마자 온 전화", title_en: "The Call the Moment I Woke Up", description: "선우가 늦잠 자는 승객을 놀리듯 깨워 함께 아침 산책을 시작하는 이야기", emoji: "🌅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-02", category: "daily", character_id: "sunwoo", order: 2, title: "오늘의 당 충전", title_en: "Today's Sugar Refill", description: "전포 카페거리에서 음료를 주문하고 포장해 바다 앞에서 마시기로 하는 이야기", emoji: "☕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-03", category: "daily", character_id: "sunwoo", order: 3, title: "편의점 단골의 자격", title_en: "Regular at the Convenience Store", description: "밤 산책 중 편의점에 들러 1+1, 포인트 적립 등 꿀팁을 나누는 이야기", emoji: "🏪", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-04", category: "daily", character_id: "sunwoo", order: 4, title: "서면에서 갈아타는 법", title_en: "How to Transfer at Seomyeon", description: "지하철에서 버스로 갈아타며 노선도와 하차벨을 챙기는 이야기", emoji: "🚇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-05", category: "daily", character_id: "sunwoo", order: 5, title: "일교차가 심하다카네", title_en: "The Weather Swing Is No Joke", description: "일교차 심한 날씨를 확인하고 겉옷과 우산을 챙기는 이야기", emoji: "🌤️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-06", category: "daily", character_id: "sunwoo", order: 6, title: "언덕 위의 취미 생활", title_en: "Hobbies on the Hill", description: "김해공항 근처 언덕에서 비행기 사진을 찍으며 여유로운 주말을 보내는 이야기", emoji: "🎨", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-07", category: "daily", character_id: "sunwoo", order: 7, title: "약은 식후 삼십 분", title_en: "Take This After Meals", description: "감기 증상으로 병원과 약국을 함께 다녀오는 이야기", emoji: "💊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-08", category: "daily", character_id: "sunwoo", order: 8, title: "떡 돌리는 날", title_en: "The Day We Hand Out Rice Cake", description: "새집으로 이사해 짐 정리와 떡 돌리기, 작은 집들이를 하는 이야기", emoji: "🏠", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-09", category: "daily", character_id: "sunwoo", order: 9, title: "기사님이 아시는 지름길", title_en: "The Shortcut the Driver Knows", description: "택시를 타고 이동하다 내비게이션 오류를 기사님의 지름길로 해결하는 이야기", emoji: "🚕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sunwoo-10", category: "daily", character_id: "sunwoo", order: 10, title: "노을 속으로", title_en: "Into the Sunset", description: "동백섬 노을을 보며 하루를 되짚고 집 앞까지 배웅받으며 마무리하는 이야기", emoji: "🌇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-day-sangwoo-01", category: "daily", character_id: "sangwoo", order: 1, title: "좋은 아침입니다", title_en: "Good Morning", description: "공산성 아침 산책. 상우가 '기상' 표현으로 컨디션을 확인하며 하루를 브리핑하듯 시작하는 이야기", emoji: "🌅", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-02", category: "daily", character_id: "sangwoo", order: 2, title: "무엇으로 주문하시겠습니까", title_en: "What Would You Like to Order", description: "제민천 한옥 카페에서 음료를 주문하고 테이크아웃해 걷는 이야기", emoji: "☕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-03", category: "daily", character_id: "sangwoo", order: 3, title: "편의점 브리핑", title_en: "Convenience Store Briefing", description: "편의점에서 유통기한·원플러스원·적립·시식을 화물 점검하듯 꼼꼼히 챙기는 이야기", emoji: "🏪", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-04", category: "daily", character_id: "sangwoo", order: 4, title: "정류장에서, 로저", title_en: "At the Stop, Roger", description: "공주-대전 버스와 지하철 환승을 정시성 있게 챙기는 이야기", emoji: "🚌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-05", category: "daily", character_id: "sangwoo", order: 5, title: "오늘의 기상 브리핑", title_en: "Today's Weather Briefing", description: "기상예보·체감온도·일교차를 확인해 겉옷을 챙겨주는 이야기", emoji: "🌤️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-06", category: "daily", character_id: "sangwoo", order: 6, title: "주말의 정비 시간", title_en: "Weekend Maintenance Time", description: "모형 비행기 조립이라는 여가·재충전 취미를 보여주는 이야기", emoji: "🛩️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-07", category: "daily", character_id: "sangwoo", order: 7, title: "증상 보고", title_en: "Symptom Report", description: "병원 진료와 약국에서 증상·처방전·복용법을 챙기는 이야기", emoji: "💊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-08", category: "daily", character_id: "sangwoo", order: 8, title: "집들이 브리핑", title_en: "Housewarming Briefing", description: "집들이 선물(세제·휴지)과 이웃 인사를 격식 있게 처리하는 이야기", emoji: "🏠", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-09", category: "daily", character_id: "sangwoo", order: 9, title: "목적지까지, 로저", title_en: "To the Destination, Roger", description: "택시 승차·경로·요금·지름길을 챙기는 이야기", emoji: "🚕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-sangwoo-10", category: "daily", character_id: "sangwoo", order: 10, title: "오늘의 비행 일지", title_en: "Today's Flight Log", description: "금강 노을을 보며 하루를 마무리하고 집까지 배웅하는 이야기", emoji: "🌇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-day-yongwoo-01", category: "daily", character_id: "yongwoo", order: 1, title: "제주 아침, 늦잠은 없다", title_en: "No Sleeping In, Jeju Mornings", description: "늦잠 잔 승객을 용우가 깨워 함께 아침을 먹는 제주 첫 아침 이야기", emoji: "☀️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-02", category: "daily", character_id: "yongwoo", order: 2, title: "샷 추가는 선택이 아니다", title_en: "Extra Shot, No Exceptions", description: "애월 카페에서 용우에게 아이스 아메리카노 주문법을 배우는 이야기", emoji: "☕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-03", category: "daily", character_id: "yongwoo", order: 3, title: "1+1의 정석", title_en: "The Art of Buy-One-Get-One", description: "편의점 야식 쇼핑에서 용우에게 알뜰한 장보기 요령을 배우는 이야기", emoji: "🏪", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-04", category: "daily", character_id: "yongwoo", order: 4, title: "막차를 놓치면 안 된다", title_en: "Don't Miss the Last Bus", description: "버스 환승과 교통카드 사용법을 익히며 막차를 잡으려 서두르는 이야기", emoji: "🚌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-05", category: "daily", character_id: "yongwoo", order: 5, title: "일교차를 이기는 법", title_en: "Beating the Temperature Swing", description: "변덕스러운 제주 날씨 속 용우가 챙겨준 겉옷과 우산 이야기", emoji: "🧥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-06", category: "daily", character_id: "yongwoo", order: 6, title: "손맛을 아는 시간", title_en: "The Feel of a Good Catch", description: "주말 휴일에 용우와 갯바위 낚시를 하며 기다림의 즐거움을 배우는 이야기", emoji: "🎣", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-07", category: "daily", character_id: "yongwoo", order: 7, title: "아프면 말을 해야지", title_en: "Say Something When It Hurts", description: "체한 승객을 병원과 약국에 데려가는 용우의 무뚝뚝하지만 다정한 보살핌 이야기", emoji: "💊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-08", category: "daily", character_id: "yongwoo", order: 8, title: "휴지 한 통의 인사", title_en: "A Greeting of Tissue and Detergent", description: "새집으로 이사해 집들이 선물을 준비하고 이웃에게 인사드리는 이야기", emoji: "🏠", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-09", category: "daily", character_id: "yongwoo", order: 9, title: "지름길은 내가 안다", title_en: "I Know the Shortcut", description: "택시를 타고 목적지를 말하고, 길 헤매는 기사를 용우가 지름길로 안내하는 이야기", emoji: "🚕", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-day-yongwoo-10", category: "daily", character_id: "yongwoo", order: 10, title: "오늘 하루도 수고했다", title_en: "Well Done, Today Too", description: "옥상에서 노을을 보며 평범한 하루를 소중히 여기는 법을 배우는 하루 마무리 이야기", emoji: "🌇", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  // 🤝 친구 스토리 — 로맨스 아닌 플라토닉 우정, 기장별 동일한 10개 주제(재회/치맥/유행어/노래방/맛집줄서기/
  // 고민상담/놀이공원/캠핑불멍/여행추억/영원한우정)를 각자의 지역·성격으로 풀어낸 스토리 (기장당 10개, 총 50개)
  { id: "sp-frd-kyuhyun-01", category: "friendship", character_id: "kyuhyun", order: 1, title: "오랜만이야, 잘 지냈어?", title_en: "Long Time No See", description: "김포공항 도착장에서 반갑게 재회하는 오랜 친구 규현", emoji: "🙌", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-02", category: "friendship", character_id: "kyuhyun", order: 2, title: "치맥 없인 못 살아", title_en: "Can't Live Without Chimaek", description: "을지로 술집에서 치킨과 맥주로 재회를 축하하는 건배", emoji: "🍗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-03", category: "friendship", character_id: "kyuhyun", order: 3, title: "요즘 애들 말, 알려줄게", title_en: "I'll Teach You the Latest Slang", description: "홍대 거리를 걸으며 규현이 알려주는 요즘 유행어", emoji: "🔥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-04", category: "friendship", character_id: "kyuhyun", order: 4, title: "노래방에서는 내가 진리다", title_en: "In Karaoke, I'm the Truth", description: "노래방에서 뜻밖의 가창력을 뽐내는 규현과의 신나는 밤", emoji: "🎤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-05", category: "friendship", character_id: "kyuhyun", order: 5, title: "이 집은 줄 서서라도 먹어야 돼", title_en: "This Place Is Worth the Wait", description: "맛집 웨이팅 줄에서 음식을 나눠 먹으며 보내는 시간", emoji: "🍜", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-06", category: "friendship", character_id: "kyuhyun", order: 6, title: "혼자 끙끙 앓지 마", title_en: "Don't Suffer Alone", description: "한강 벤치에서 능청스러움을 내려놓고 진심으로 위로하는 규현", emoji: "🫂", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-07", category: "friendship", character_id: "kyuhyun", order: 7, title: "이 정도는 타 줘야 놀이공원이지", title_en: "You've Gotta Ride This Much", description: "놀이공원에서 롤러코스터를 타며 신나게 보내는 하루", emoji: "🎢", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-08", category: "friendship", character_id: "kyuhyun", order: 8, title: "불멍 하면서 아무 말 안 해도 돼요", title_en: "You Don't Have to Say Anything While Staring at the Fire", description: "캠핑장 장작불 앞, 말없이도 편안한 규현과의 밤", emoji: "🏕️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-09", category: "friendship", character_id: "kyuhyun", order: 9, title: "이 순간, 진짜 오래 기억날 것 같아요", title_en: "I Think I'll Remember This for a Long Time", description: "여행 마지막 밤, 사진을 넘겨 보며 추억을 되짚는 시간", emoji: "📸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-kyuhyun-10", category: "friendship", character_id: "kyuhyun", order: 10, title: "우리 이 우정 변치 말자", title_en: "Let's Not Let This Friendship Change", description: "공항에서의 따뜻한 배웅과 변치 않을 우정의 약속", emoji: "🤗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-frd-haneul-01", category: "friendship", character_id: "haneul", order: 1, title: "반가운 친구와의 재회", title_en: "Reunion with a Friend", description: "전주역에서 마중 나온 하늘과의 무뚝뚝하지만 반가운 재회", emoji: "🙋‍♂️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-02", category: "friendship", character_id: "haneul", order: 2, title: "치맥(치킨과 맥주) 모임", title_en: "Chicken & Beer Hangout", description: "한옥마을 치킨집에서 건배하며 나누는 오랜만의 대화", emoji: "🍗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-03", category: "friendship", character_id: "haneul", order: 3, title: "한국 유행어와 신조어", title_en: "Korean Slang & Buzzwords", description: "대박·인정·갑분싸·꿀잼, 거리를 걸으며 배우는 진짜 유행어", emoji: "🔥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-04", category: "friendship", character_id: "haneul", order: 4, title: "노래방에서 신나게 부르기", title_en: "Karaoke Singing Night", description: "신청곡과 점수 경쟁, 의외로 다정한 하늘의 애창곡", emoji: "🎤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-05", category: "friendship", character_id: "haneul", order: 5, title: "맛집 줄 서기와 음식 나누기", title_en: "Foodie Lines & Sharing Food", description: "남부시장 국밥집 웨이팅과 곱빼기, 말없이 나눠 먹는 정", emoji: "🍲", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-06", category: "friendship", character_id: "haneul", order: 6, title: "고민 상담과 깊은 우정", title_en: "A Heart-to-Heart Talk", description: "전주천 밤길에서 고민을 털어놓고 위로받는 진심의 순간", emoji: "🫂", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-07", category: "friendship", character_id: "haneul", order: 7, title: "안 무섭다며", title_en: "You Said You Weren't Scared", description: "광주 패밀리랜드 롤러코스터 앞에서 무너지는 하늘의 허당미", emoji: "🎡", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-08", category: "friendship", character_id: "haneul", order: 8, title: "그 유명한 불멍이라는 거", title_en: "So This Is the Famous Bulmeong", description: "변산반도 캠핑장, 장작불 앞에서의 편안한 침묵과 불멍", emoji: "⛺", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-09", category: "friendship", character_id: "haneul", order: 9, title: "됐어, 남겼어", title_en: "Done, It's Kept", description: "사진첩을 넘기며 되짚는 열흘의 추억, 뿌듯함과 아쉬움", emoji: "📸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-haneul-10", category: "friendship", character_id: "haneul", order: 10, title: "넌 이제 내 친구야", title_en: "You're My Friend Now", description: "배웅과 약속, 확인하는 영원한 우정", emoji: "🌟", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-frd-sunwoo-01", category: "friendship", character_id: "sunwoo", order: 1, title: "야, 니 진짜 오랜만이다", title_en: "Hey, It's Really Been Forever", description: "김해공항에서 몇 년 만에 재회하는 소꿉친구 선우", emoji: "🙋‍♂️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-02", category: "friendship", character_id: "sunwoo", order: 2, title: "치맥 아니면 안 되는 밤", title_en: "A Night That Needs Chicken & Beer", description: "서면 치킨집에서 좋아하는 부위를 기억해주는 선우", emoji: "🍗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-03", category: "friendship", character_id: "sunwoo", order: 3, title: "그거 완전 인정이다", title_en: "Totally Agreed, That", description: "전포 카페거리에서 배우는 대박·레전드·인정 같은 유행어", emoji: "🔥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-04", category: "friendship", character_id: "sunwoo", order: 4, title: "마이크 놔라, 내 차례다", title_en: "Drop the Mic, My Turn", description: "서면 노래방에서 애창곡을 부르며 신나는 밤을 보내는 선우", emoji: "🎤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-05", category: "friendship", character_id: "sunwoo", order: 5, title: "웨이팅도 같이하면 놀이다", title_en: "Even Waiting in Line Is Fun Together", description: "남포동 돼지국밥 줄에서 좋아하는 고기를 양보하는 선우", emoji: "🍲", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-06", category: "friendship", character_id: "sunwoo", order: 6, title: "말 안 해도 안다, 내가", title_en: "I Know Without You Saying It", description: "이기대 해안 산책로에서 부담 없이 건네는 위로", emoji: "🫂", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-07", category: "friendship", character_id: "sunwoo", order: 7, title: "니 완전 겁먹었네", title_en: "You're Totally Scared Stiff", description: "롯데월드 어드벤처 부산에서 놀이기구를 타며 보내는 하루", emoji: "🎢", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-08", category: "friendship", character_id: "sunwoo", order: 8, title: "눈 감고도 한다, 내가", title_en: "I Could Do This With My Eyes Closed", description: "거제 바닷가 캠핑장, 모닥불 앞에서 나누는 편안한 침묵", emoji: "🔥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-09", category: "friendship", character_id: "sunwoo", order: 9, title: "맨날 오던 그 바다", title_en: "The Sea We Always Came To", description: "송정 해수욕장, 어릴 적 추억이 밀려오는 순간", emoji: "🌊", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sunwoo-10", category: "friendship", character_id: "sunwoo", order: 10, title: "이번 열흘 진짜 소중했다", title_en: "These Ten Days Were Really Precious", description: "김해공항 배웅, 새끼손가락 걸고 나누는 우정의 약속", emoji: "🤝", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-frd-sangwoo-01", category: "friendship", character_id: "sangwoo", order: 1, title: "공산성에서, 반가운 얼굴", title_en: "A Welcome Face at Gongsanseong", description: "십 년 지기 친구와 공산성에서 재회하는 반가움", emoji: "🤝", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-02", category: "friendship", character_id: "sangwoo", order: 2, title: "오늘 밤은 치맥입니다", title_en: "Tonight Is Chicken & Beer", description: "산성시장 치킨집에서 치맥을 즐기며 단골집을 약속", emoji: "🍗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-03", category: "friendship", character_id: "sangwoo", order: 3, title: "완전 대박입니다", title_en: "Totally Daebak", description: "격식 있는 상우가 친구에게 요즘 유행어와 신조어를 배우는 이야기", emoji: "🔥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-04", category: "friendship", character_id: "sangwoo", order: 4, title: "18번을 부탁드립니다", title_en: "My Go-To Song, Please", description: "노래방에서 상우와 친구가 각자의 애창곡을 부르는 밤", emoji: "🎤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-05", category: "friendship", character_id: "sangwoo", order: 5, title: "웨이팅도 함께라면", title_en: "Worth the Wait, Together", description: "공주 골목 맛집 앞에서 긴 줄을 서고 간식을 나누는 시간", emoji: "🌰", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-06", category: "friendship", character_id: "sangwoo", order: 6, title: "금강 밤바람 앞에서", title_en: "By the Geumgang Night Breeze", description: "금강 변 벤치에서 친구의 고민을 들어주고 위로하는 대화", emoji: "🌙", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-07", category: "friendship", character_id: "sangwoo", order: 7, title: "오월드, 짜릿한 하루", title_en: "O-World, A Thrilling Day", description: "대전 오월드에서 롤러코스터와 회전목마, 관람차 야경을 즐기는 하루", emoji: "🎢", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-08", category: "friendship", character_id: "sangwoo", order: 8, title: "대청호, 불멍의 밤", title_en: "Daecheongho, A Night of Fire-Gazing", description: "대청호 캠핑장에서 텐트를 치고 모닥불 앞 불멍을 즐기는 이야기", emoji: "🏕️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-09", category: "friendship", character_id: "sangwoo", order: 9, title: "사진첩 속, 우리의 여름", title_en: "In the Photo Album, Our Summer", description: "여행 마지막 밤, 함께 찍은 사진들을 넘겨 보며 추억하는 시간", emoji: "📷", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-sangwoo-10", category: "friendship", character_id: "sangwoo", order: 10, title: "다시, 우리는", title_en: "Once Again, We Are", description: "공주역 플랫폼에서의 마지막 배웅, 영원한 우정을 다짐하는 순간", emoji: "🌟", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },

  { id: "sp-frd-yongwoo-01", category: "friendship", character_id: "yongwoo", order: 1, title: "니 진짜 오랜만이다, 인마", title_en: "You're Really Back After So Long", description: "제주공항에서 몇 년 만에 재회하는 친형제 같은 용우", emoji: "🙋‍♂️", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-02", category: "friendship", character_id: "yongwoo", order: 2, title: "치킨 식기 전에 와라", title_en: "Get Here Before the Chicken Gets Cold", description: "골목 치킨집에서 나누는 건배와 취기 어린 진심", emoji: "🍗", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-03", category: "friendship", character_id: "yongwoo", order: 3, title: "그건 또 뭔 소리야", title_en: "What's That Supposed to Mean", description: "모르는 척하다 다 알고 있었다는 걸 들키는 용우의 유행어 상식", emoji: "🔥", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-04", category: "friendship", character_id: "yongwoo", order: 4, title: "박자 좀 맞춰봐라", title_en: "Try Keeping the Beat", description: "노래방에서 뜻밖의 실력을 뽐내는 용우와의 점수 경쟁", emoji: "🎤", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-05", category: "friendship", character_id: "yongwoo", order: 5, title: "배고파 죽겠다, 얼른", title_en: "I'm Starving, Hurry Up", description: "제주 국수 맛집 줄에서 알고 보니 단골이었던 용우", emoji: "🍲", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-06", category: "friendship", character_id: "yongwoo", order: 6, title: "말해봐라, 다 들어줄 테니까", title_en: "Talk to Me, I'll Listen to All of It", description: "협재 해변 노을 아래, 서로 처음 털어놓는 진짜 속마음", emoji: "🫂", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-07", category: "friendship", character_id: "yongwoo", order: 7, title: "쫄았으면 말을 해", title_en: "Just Say So If You're Scared", description: "제주신화월드 롤러코스터 앞 허세, 그리고 들통난 진짜 반응", emoji: "🎡", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-08", category: "friendship", character_id: "yongwoo", order: 8, title: "불 앞에서는 다 솔직해진다", title_en: "Everyone Gets Honest by the Fire", description: "함덕 해변 캠핑장, 모닥불 앞에서 꺼내는 어릴 적 이야기", emoji: "⛺", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-09", category: "friendship", character_id: "yongwoo", order: 9, title: "이 사진, 오래 간직해라", title_en: "Keep This Photo for a Long Time", description: "우도 여행, 여행이 끝나감을 실감하는 씁쓸한 순간", emoji: "📸", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
  { id: "sp-frd-yongwoo-10", category: "friendship", character_id: "yongwoo", order: 10, title: "언제든 다시 온나", title_en: "Come Back Anytime", description: "공항 배웅, 진심을 담아 전하는 사투리 섞인 작별 인사", emoji: "🌟", total_words: 10, total_sentences: 5, step_count: 10, is_locked: true },
];


// ── 경제 ────────────────────────────────────────────────
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

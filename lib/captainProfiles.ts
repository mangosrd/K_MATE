import type { Language } from "@/components/LanguageContext";
type Profile = { name: string; description: string };
type Profiles = Record<string, Profile>;
const ko: Profiles = {
  kyuhyun: { name: "양규현", description: "34세 능글맞고 다정한 베테랑 기장" },
  haneul: { name: "오하늘", description: "29세 무뚝뚝하지만 로맨스가 가득한 부기장" },
  sunwoo: { name: "차선우", description: "29세 늘 톡톡 튀는 비타민을 가지고 있는 장난꾸러기 부기장" },
  sangwoo: { name: "천상우", description: "31세 FM으로 움직이지만, 사랑만큼은 직진인 기장" },
  yongwoo: { name: "권용우", description: "34세 동생만 바라보는 잔소리꾼 기장" },
};
const profiles: Record<Language, Profiles> = {
  ko,
  en: { kyuhyun:{name:"Yang Kyuhyun",description:"34 · A playful, caring veteran captain"},haneul:{name:"Oh Haneul",description:"29 · A reserved first officer full of romance"},sunwoo:{name:"Cha Sunwoo",description:"29 · A bright, vitamin-like, playful first officer"},sangwoo:{name:"Cheon Sangwoo",description:"31 · A by-the-book captain who goes straight for love"},yongwoo:{name:"Kwon Yongwoo",description:"34 · A nagging captain devoted to his younger companion"} },
  ru: { kyuhyun:{name:"Ян Кюхён",description:"34 года · Игривый и заботливый опытный капитан"},haneul:{name:"О Ханыль",description:"29 лет · Сдержанный второй пилот, полный романтики"},sunwoo:{name:"Чха Сонъу",description:"29 лет · Яркий и озорной второй пилот-витамин"},sangwoo:{name:"Чхон Санъу",description:"31 год · Строгий капитан, прямолинейный в любви"},yongwoo:{name:"Квон Ёнъу",description:"34 года · Ворчливый капитан, преданный младшему"} },
  zh: { kyuhyun:{name:"杨圭贤",description:"34岁 · 风趣又体贴的资深机长"},haneul:{name:"吴天空",description:"29岁 · 外冷内热、充满浪漫的副机长"},sunwoo:{name:"车善宇",description:"29岁 · 活力十足、爱开玩笑的副机长"},sangwoo:{name:"千相宇",description:"31岁 · 按规章行事、对爱情勇往直前的机长"},yongwoo:{name:"权勇宇",description:"34岁 · 一心照顾弟弟的唠叨机长"} },
  ja: { kyuhyun:{name:"ヤン・ギュヒョン",description:"34歳 · 茶目っ気があり優しいベテラン機長"},haneul:{name:"オ・ハヌル",description:"29歳 · 無口だがロマンスにあふれた副機長"},sunwoo:{name:"チャ・ソヌ",description:"29歳 · いつも元気でいたずら好きな副機長"},sangwoo:{name:"チョン・サンウ",description:"31歳 · 規則に忠実で恋には一直線な機長"},yongwoo:{name:"クォン・ヨンウ",description:"34歳 · 弟思いで小言の多い機長"} },
  "zh-TW": { kyuhyun:{name:"楊圭賢",description:"34歲 · 風趣又體貼的資深機長"},haneul:{name:"吳天空",description:"29歲 · 外冷內熱、充滿浪漫的副機長"},sunwoo:{name:"車善宇",description:"29歲 · 活力十足、愛開玩笑的副機長"},sangwoo:{name:"千相宇",description:"31歲 · 按規章行事、對愛情勇往直前的機長"},yongwoo:{name:"權勇宇",description:"34歲 · 一心照顧弟弟的嘮叨機長"} },
  th: { kyuhyun:{name:"ยางกยูฮยอน",description:"34 ปี · กัปตันมากประสบการณ์ ขี้เล่นและอบอุ่น"},haneul:{name:"โอฮานึล",description:"29 ปี · นักบินผู้ช่วยสุขุมที่เต็มไปด้วยความโรแมนติก"},sunwoo:{name:"ชาซอนอู",description:"29 ปี · นักบินผู้ช่วยจอมซน สดใสเหมือนวิตามิน"},sangwoo:{name:"ชอนซังอู",description:"31 ปี · กัปตันเคร่งกฎที่ตรงไปตรงมาในความรัก"},yongwoo:{name:"ควอนยงอู",description:"34 ปี · กัปตันขี้บ่นที่ทุ่มเทให้น้อง"} },
};
export function getCaptainDisplayProfile(language: Language, id: string): Profile { return profiles[language]?.[id] ?? profiles.en[id] ?? ko[id]; }

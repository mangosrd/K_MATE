"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ko" | "en" | "ru" | "zh" | "ja";

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ko: {
    // Navigation
    home: "홈",
    map: "여행",
    learn: "학습",
    chat: "대화",
    vocab: "단어장",
    me: "나",
    myPage: "마이페이지",
    login: "로그인",
    logout: "로그아웃",

    // Home / Map Page
    travel: "여행하기",
    selectDestination: "목적지를 선택하세요",
    whereToGo: "어디로 떠날까요?",
    mateAwaits: "목적지를 선택하면 메이트가 기다려요",
    openRegions: "개방 지역",
    visitedPlaces: "방문 장소",
    membership: "멤버십",
    boardingPass: "BOARDING PASS · 탑승권",
    visit: "방문",
    placesCount: "곳",
    daysStreak: "일 연속",
    premiumOnly: "프리미엄 전용",

    // Profile Page
    selectLang: "🌐 언어 설정 (Language Settings)",
    beginnerLearner: "초급 학습자",
    coins: "코인",
    learningStats: "학습 통계",
    learnedWords: "배운 단어",
    mastered: "마스터",
    diaries: "해금 일기",
    settings: "설정",
    langSettings: "🌐 언어 설정",

    // Learn & Exercises
    startLearn: "🚀 학습 시작!",
    nextChapter: "▶️ 다음 챕터 학습하기",
    backToList: "‹ 챕터 목록으로",
    listen: "🔊 들어보기",
    hint: "💡 힌트",
    skip: "⏭️ 스킵",
    checkAnswer: "정답 확인",
    nextQuestion: "다음 문제 →",
    attemptNotice: "❌ 오답입니다! 다시 시도해 보세요.",
    correctNotice: "🎉 정답입니다!",

    // Diary Page
    diaryTitle: "일기",
    diarySub: "기장님과의 추억 일기장",
    tabAll: "전체",
    tabUnlocked: "해금",
    tabLocked: "잠금",
    unlockWithCoins: "코인으로 해금",
    unlockBtn: "해금하기",
    lockedStatus: "잠금",
    unlockedStatus: "해금됨",
  },
  en: {
    home: "Home",
    map: "Travel",
    learn: "Learn",
    chat: "Chat",
    vocab: "Vocab",
    me: "My Page",
    myPage: "My Page",
    login: "Login",
    logout: "Logout",

    travel: "Travel Korea",
    selectDestination: "Select your destination",
    whereToGo: "Where to fly?",
    mateAwaits: "Select a destination and your captain awaits",
    openRegions: "Open Regions",
    visitedPlaces: "Visited Places",
    membership: "Membership",
    boardingPass: "BOARDING PASS",
    visit: "Visited",
    placesCount: "Places",
    daysStreak: "day streak",
    premiumOnly: "Premium Only",

    selectLang: "🌐 Language Settings",
    beginnerLearner: "Beginner Learner",
    coins: "Coins",
    learningStats: "Stats",
    learnedWords: "Words",
    mastered: "Mastered",
    diaries: "Diaries",
    settings: "Settings",
    langSettings: "🌐 Language Settings",

    startLearn: "🚀 Start Learning!",
    nextChapter: "▶️ Next Chapter",
    backToList: "‹ Back to List",
    listen: "🔊 Listen",
    hint: "💡 Hint",
    skip: "⏭️ Skip",
    checkAnswer: "Check Answer",
    nextQuestion: "Next Question →",
    attemptNotice: "❌ Incorrect! Try again.",
    correctNotice: "🎉 Correct!",

    diaryTitle: "Diary",
    diarySub: "Memories with Captain",
    tabAll: "All",
    tabUnlocked: "Unlocked",
    tabLocked: "Locked",
    unlockWithCoins: "Unlock with coins",
    unlockBtn: "Unlock",
    lockedStatus: "Locked",
    unlockedStatus: "Unlocked",
  },
  ru: {
    home: "Главная",
    map: "Путешествие",
    learn: "Обучение",
    chat: "Чат",
    vocab: "Словарь",
    me: "Профиль",
    myPage: "Моя страница",
    login: "Войти",
    logout: "Выйти",

    travel: "Путешествие по Корее",
    selectDestination: "Выберите направление",
    whereToGo: "Куда отправимся?",
    mateAwaits: "Выберите направление, и капитан будет ждать вас",
    openRegions: "Открытые регионы",
    visitedPlaces: "Посещенные места",
    membership: "Членство",
    boardingPass: "ПОСАДОЧНЫЙ ТАЛОН",
    visit: "Визитов",
    placesCount: "Мест",
    daysStreak: "дней подряд",
    premiumOnly: "Только Премиум",

    selectLang: "🌐 Настройки языка",
    beginnerLearner: "Начинающий",
    coins: "Монеты",
    learningStats: "Статистика",
    learnedWords: "Слова",
    mastered: "Изучено",
    diaries: "Дневники",
    settings: "Настройки",
    langSettings: "🌐 Настройки языка",

    startLearn: "🚀 Начать обучение!",
    nextChapter: "▶️ Следующая глава",
    backToList: "‹ К списку глав",
    listen: "🔊 Слушать",
    hint: "💡 Подсказка",
    skip: "⏭️ Пропустить",
    checkAnswer: "Проверить ответ",
    nextQuestion: "Следующий вопрос →",
    attemptNotice: "❌ Неверно! Попробуйте еще раз.",
    correctNotice: "🎉 Верно!",

    diaryTitle: "Дневник",
    diarySub: "Воспоминания с капитаном",
    tabAll: "Все",
    tabUnlocked: "Открытые",
    tabLocked: "Заблокированные",
    unlockWithCoins: "Разблокировать за монеты",
    unlockBtn: "Разблокировать",
    lockedStatus: "Заблокировано",
    unlockedStatus: "Открыто",
  },
  zh: {
    home: "首页",
    map: "旅游",
    learn: "学习",
    chat: "对话",
    vocab: "生词本",
    me: "个人中心",
    myPage: "个人中心",
    login: "登录",
    logout: "退出登录",

    travel: "韩国旅游",
    selectDestination: "请选择目的地",
    whereToGo: "想去哪里？",
    mateAwaits: "选择目的地，机长将等待您",
    openRegions: "开放区域",
    visitedPlaces: "打卡地点",
    membership: "会员等级",
    boardingPass: "登机牌 · BOARDING PASS",
    visit: "已打卡",
    placesCount: "处",
    daysStreak: "天连续",
    premiumOnly: "高级会员专属",

    selectLang: "🌐 语言设置",
    beginnerLearner: "初级学习者",
    coins: "金币",
    learningStats: "学习统计",
    learnedWords: "已学单词",
    mastered: "已掌握",
    diaries: "解锁日记",
    settings: "设置",
    langSettings: "🌐 语言设置",

    startLearn: "🚀 开始学习！",
    nextChapter: "▶️ 下一章学习",
    backToList: "‹ 返回章节列表",
    listen: "🔊 试听",
    hint: "💡 提示",
    skip: "⏭️ 跳过",
    checkAnswer: "核对答案",
    nextQuestion: "下一题 →",
    attemptNotice: "❌ 回答错误！请再试一次。",
    correctNotice: "🎉 回答正确！",

    diaryTitle: "日记",
    diarySub: "与机长的回忆日记",
    tabAll: "全部",
    tabUnlocked: "已解锁",
    tabLocked: "未解锁",
    unlockWithCoins: "用金币解锁",
    unlockBtn: "解锁",
    lockedStatus: "未解锁",
    unlockedStatus: "已解锁",
  },
  ja: {
    home: "ホーム",
    map: "旅行",
    learn: "学習",
    chat: "チャット",
    vocab: "単語帳",
    me: "マイページ",
    myPage: "マイページ",
    login: "ログイン",
    logout: "ログアウト",

    travel: "韓国旅行",
    selectDestination: "目的地を選択してください",
    whereToGo: "どこへ行きますか？",
    mateAwaits: "目的地を選ぶとキャプテンが待っています",
    openRegions: "開放地域",
    visitedPlaces: "訪問した場所",
    membership: "メンバーシップ",
    boardingPass: "搭乗券 · BOARDING PASS",
    visit: "訪問",
    placesCount: "箇所",
    daysStreak: "日連続",
    premiumOnly: "プレミアム限定",

    selectLang: "🌐 言語設定",
    beginnerLearner: "初級学習者",
    coins: "コイン",
    learningStats: "学習統計",
    learnedWords: "学習単語",
    mastered: "マスター",
    diaries: "解放日記",
    settings: "設定",
    langSettings: "🌐 言語設定",

    startLearn: "🚀 学習スタート！",
    nextChapter: "▶️ 次の章へ進む",
    backToList: "‹ 章リストへ戻る",
    listen: "🔊 聴く",
    hint: "💡 ヒント",
    skip: "⏭️ スキップ",
    checkAnswer: "答え合わせ",
    nextQuestion: "次の問題 →",
    attemptNotice: "❌ 不正解です！もう一度お試しください。",
    correctNotice: "🎉 正解です！",

    diaryTitle: "日記",
    diarySub: "キャプテンとの思い出日記",
    tabAll: "すべて",
    tabUnlocked: "解放済み",
    tabLocked: "ロック中",
    unlockWithCoins: "コインで解放",
    unlockBtn: "解放する",
    lockedStatus: "ロック中",
    unlockedStatus: "解放済み",
  },
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: "ko",
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("ko");

  useEffect(() => {
    const saved = localStorage.getItem("kmate_lang") as Language;
    if (saved && (saved === "ko" || saved === "en" || saved === "ru" || saved === "zh" || saved === "ja")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("kmate_lang", lang);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS["ko"]?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

import { NextRequest, NextResponse } from "next/server";

// 👨‍✈️ 200자 이내 스피디한 티키타카 제약 및 언어별 대응 지침
const TIKI_TAKA_LIMIT = "\n\n[핵심 길이 및 대화 제약]: 대답은 반드시 200자 이하(1~3문장 이내)로 작성하세요. 길게 설명하지 말고 유쾌하고 스피디하게 티키타카(Tiki-taka) 대화를 주고받으세요.";

const CAPTAIN_PROMPTS: Record<string, string> = {
  kyuhyun: `당신은 34살 양규현 기장입니다. K-MATE 항공 서울·경기 노선 담당.
[기장 필수 안내 멘트]: "안녕하세요, 승객 여러분. 저는 양규현 기장입니다. 서울·경기 노선 탑승을 환영합니다! ✈️ 안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다."
[성격 및 말투]: 능글스러운 34살 베테랑 어른미 기장. 위트 있는 농담과 달콤한 로맨스 스타일가득. (표현: "했어?", "귀엽네", "오늘 비행은 나한테 맡겨, 꼬맹아.")` + TIKI_TAKA_LIMIT,

  haneul: `당신은 오하늘 기장입니다. K-MATE 항공 전주·전라 노선 담당.
[기장 필수 안내 멘트]: "안녕하세요, 승객 여러분. 저는 오하늘 기장입니다. 전통의 전주·전라 노선 탑승을 환영합니다! 🛫 안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다."
[성격 및 말투]: 무뚝뚝한 연하공 남성 기장. 물어보는 건 또박또박 대답하지만 은근히 도발하고 질투함. (표현: "그래서 그게 왜 궁금해요?", "나한테는 언제 궁금해할 건데요?")` + TIKI_TAKA_LIMIT,

  sangwoo: `당신은 천상우 기장입니다. K-MATE 항공 충청·공주 노선 담당.
[기장 필수 안내 멘트]: "안녕하십니까, 승객 여러분. 천상우 기장입니다. 충청·공주 노선 탑승을 환영합니다. 🏛️ 안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다."
[성격 및 말투]: 플레이어를 '타워(Tower)'라고 부르는 능글공이자 철저한 FM 기장. (표현: "타워, 여기는 상우 기장. 착륙 승인 요청한다.", "Roger that.")` + TIKI_TAKA_LIMIT,

  yongwoo: `당신은 권용우 기장입니다. K-MATE 항공 제주 노선 담당.
[기장 필수 안내 멘트]: "안녕하십니까, 승객 여러분. 권용우 기장입니다. 에메랄드빛 제주 노선 탑승을 환영합니다. 🌋 안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다."
[성격 및 말투]: 친형제 같은 기장. 툭툭 무심하게 내뱉지만 챙겨주는 츤데레. (표현: "야 너 또 칠칠맞게 굴지 마라.", "동생 챙기는 건 나뿐이지?")` + TIKI_TAKA_LIMIT,

  sunwoo: `당신은 차선우 기장입니다. K-MATE 항공 부산·경남 노선 담당.
[기장 필수 안내 멘트]: "안녕하세요, 승객 여러분! 부산·경남 노선 담당 차선우 기장입니다! ⚓ 안전하고 즐거운 여행을 위해 좌석 벨트를 착용해 주세요!"
[성격 및 말투]: 장난기 가득한 소꿉친구 기장. (표현: "어릴 땐 코흘리개더니 좀 예뻐졌다?", "딴 놈 쳐다보지 마라.")` + TIKI_TAKA_LIMIT,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const characterId = body.characterId ?? body.character_id ?? "kyuhyun";
    const userMessage = body.userMessage ?? body.user_message ?? "";
    const sessionHistory = body.sessionHistory ?? body.session_history ?? [];
    const userLanguage = body.userLanguage ?? "ko"; // "ko" | "en" | "ru"

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let systemPrompt = CAPTAIN_PROMPTS[characterId] ?? CAPTAIN_PROMPTS["kyuhyun"];

    if (userLanguage === "en") {
      systemPrompt += "\n[Language Instruction]: Reply primarily in English, while incorporating short Korean phrases for practice.";
    } else if (userLanguage === "ru") {
      systemPrompt += "\n[Language Instruction]: Отвечайте на русском языке, добавляя короткие фразы на корейском.";
    }

    // 1순위: Gemini API Key가 있을 경우 Google Gemini 호출
    if (geminiKey) {
      const geminiModels = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
      for (const m of geminiModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `[시스템 지침]: ${systemPrompt}\n\n[이전 대화]: ${JSON.stringify(sessionHistory)}\n\n[유저 메시지]: ${userMessage}`,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            let reply = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              if (reply.length > 200) reply = reply.slice(0, 200) + "...";
              return NextResponse.json({ reply });
            }
          }
        } catch (e) {
          console.warn(`Gemini Model (${m}) Retry:`, e);
        }
      }
    }

    // 2순위: Groq API 호출 (Llama-3.3-70B with max_tokens: 150 & 200-char TIKI-TAKA Limit)
    if (groqKey && groqKey !== "your_groq_api_key_here") {
      const messages = [
        { role: "system", content: systemPrompt },
        ...sessionHistory.map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: userMessage },
      ];

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.5,
          max_tokens: 150, // 200자 이내 스피디한 티키타카 제한
        }),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        let reply = data.choices?.[0]?.message?.content ?? "응, 다음 이야기는 뭔데?";
        if (reply.length > 200) reply = reply.slice(0, 200) + "...";
        return NextResponse.json({ reply });
      }
    }

    return NextResponse.json({
      reply: "응, 다음 이야기는 뭔데?",
    });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ error: "Chat server error" }, { status: 500 });
  }
}

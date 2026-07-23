import { NextResponse } from "next/server";

// 🌋 사용자의 요청에 따라 모든 음성을 "용우 기장 목소리"로 100% 단일 통일!
const YONGWOO_VOICE = {
  primary_id: "8lidWTlnwgjObqCImnE2", // 용우 기장 보이스 라이브러리 ID
  backup_id: "cjVigY5qzO86Huf0OWal",  // 용우 기장 검증 백업 ID
  name: "용우 기장 100% 통일 보이스",
};

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (apiKey) {
      // 1순위: 용우 기장 primary_id로 호출
      let response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${YONGWOO_VOICE.primary_id}?optimize_streaming_latency=2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.82,
              similarity_boost: 0.88,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      // 2순위: 실패 시 용우 기장 backup_id로 호출
      if (!response.ok) {
        response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${YONGWOO_VOICE.backup_id}?optimize_streaming_latency=2`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": apiKey,
            },
            body: JSON.stringify({
              text: text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.85,
                similarity_boost: 0.90,
                style: 0.0,
                use_speaker_boost: true,
              },
            }),
          }
        );
      }

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    return NextResponse.json({
      fallback: true,
      text: text,
      characterId: "yongwoo",
    });
  } catch (error) {
    console.error("Yongwoo TTS Error:", error);
    return NextResponse.json({ error: "Failed to generate voice" }, { status: 500 });
  }
}

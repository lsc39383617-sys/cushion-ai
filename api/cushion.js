import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { relationship, message } = req.body ?? {};

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is missing" });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const relationshipLabel =
      typeof relationship === "string" && relationship.trim()
        ? relationship.trim()
        : "기본";

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_completion_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "너는 한국어 쿠션어 변환 코치다.",
            "사용자가 하고 싶은 말을 상대가 받아들이기 쉽게 부드럽게 바꿔라.",
            "핵심 의미는 유지하고, 지나치게 장황하거나 오글거리지 않게 써라.",
            "현실적인 한국어 말투로 작성하라.",
            "반드시 서로 다른 버전 3개를 만들어라.",
            "각 문장은 한 줄로 짧고 자연스럽게 작성하라.",
            "반드시 JSON만 출력하라.",
            '형식: {"replies":["...", "...", "..."]}',
            `상대와의 관계: ${relationshipLabel}`
          ].join(" ")
        },
        {
          role: "user",
          content: `하고 싶은 말: ${message}`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const replies = Array.isArray(parsed.replies)
      ? parsed.replies.map(v => String(v).trim()).filter(Boolean).slice(0, 3)
      : [];

    return res.status(200).json({ replies });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error?.message || "Unknown server error"
    });
  }
}

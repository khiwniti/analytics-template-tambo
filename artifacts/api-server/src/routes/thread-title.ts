import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/thread-title", async (req, res) => {
  const { messages } = req.body as {
    messages?: Array<{ role: string; content: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseURL || !apiKey) {
    return res.json({ title: "" });
  }

  const transcript = messages
    .slice(0, 6)
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 24,
        messages: [
          {
            role: "system",
            content:
              "You generate extremely short, descriptive conversation titles (4–7 words, no quotes, no punctuation at the end). Output only the title.",
          },
          {
            role: "user",
            content: `Summarize this conversation in 4–7 words:\n\n${transcript}`,
          },
        ],
      }),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const title =
      data.choices?.[0]?.message?.content?.trim().replace(/['"]/g, "") ?? "";
    return res.json({ title });
  } catch (err) {
    console.error("thread-title generation error:", err);
    return res.json({ title: "" });
  }
});

export default router;

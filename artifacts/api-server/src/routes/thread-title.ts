import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/thread-title", async (req, res) => {
  const { messages } = req.body as {
    messages?: Array<{ role: string; content: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  const transcript = messages
    .slice(0, 6)
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
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
    });
    const title =
      completion.choices[0]?.message?.content?.trim().replace(/['"]/g, "") ??
      "";
    return res.json({ title });
  } catch (err) {
    console.error("thread-title generation error:", err);
    return res.status(500).json({ error: "Failed to generate title" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db, contactsTable, insertContactSchema } from "@workspace/db";

const router: IRouter = Router();

router.post("/contact", async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid submission",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null;

  try {
    await db
      .insert(contactsTable)
      .values({ ...parsed.data, ipAddress: ip ?? undefined });

    return res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Contact submission error:", err);
    return res
      .status(500)
      .json({ error: "Failed to save your message. Please try again." });
  }
});

export default router;

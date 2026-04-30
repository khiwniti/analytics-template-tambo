import { Router } from "express";
import { db, contactsTable, insertContactSchema } from "@workspace/db";

const contactRouter = Router();

contactRouter.post("/contact", async (req, res) => {
  const parsed = insertContactSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((e: { message: string }) => e.message).join(", ");
    res.status(400).json({ error: errors });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null;

  try {
    const [contact] = await db
      .insert(contactsTable)
      .values({ ...parsed.data, ipAddress: ip ?? undefined })
      .returning({ id: contactsTable.id, createdAt: contactsTable.createdAt });

    res.status(201).json({ success: true, id: contact.id, createdAt: contact.createdAt });
  } catch {
    res.status(500).json({ error: "Failed to save your message. Please try again." });
  }
});

export default contactRouter;

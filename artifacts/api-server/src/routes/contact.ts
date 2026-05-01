import { Router, type IRouter } from "express";
import { db, contactsTable, insertContactSchema } from "@workspace/db";
import { desc } from "drizzle-orm";
import { Resend } from "resend";

const router: IRouter = Router();

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function sendContactNotification(data: {
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  message: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const toEmail = process.env.NOTIFICATION_EMAIL || "kiw.brw@gmail.com";
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || "contact@notifications.ikkyu.dev";

  const companyLine = data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : "";
  const roleLine = data.role ? `<p><strong>Role:</strong> ${data.role}</p>` : "";

  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `New contact form submission from ${data.name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
      ${companyLine}
      ${roleLine}
      <p><strong>Message:</strong></p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 0;">
        ${data.message.replace(/\n/g, "<br>")}
      </blockquote>
    `,
    text: [
      `New Contact Form Submission`,
      ``,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      data.company ? `Company: ${data.company}` : "",
      data.role ? `Role: ${data.role}` : "",
      ``,
      `Message:`,
      data.message,
    ]
      .filter((line) => line !== undefined)
      .join("\n"),
  });
}

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

    sendContactNotification(parsed.data).catch((err) => {
      console.error("Failed to send contact notification email:", err);
    });

    return res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Contact submission error:", err);
    return res
      .status(500)
      .json({ error: "Failed to save your message. Please try again." });
  }
});

router.get("/admin/contacts", async (req, res) => {
  const adminToken = process.env.PORTFOLIO_ADMIN_TOKEN;
  const providedToken = req.headers["x-admin-token"];

  if (!adminToken || providedToken !== adminToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const contacts = await db
      .select({
        id: contactsTable.id,
        name: contactsTable.name,
        email: contactsTable.email,
        company: contactsTable.company,
        role: contactsTable.role,
        message: contactsTable.message,
        createdAt: contactsTable.createdAt,
      })
      .from(contactsTable)
      .orderBy(desc(contactsTable.createdAt));
    return res.json({ contacts });
  } catch (err) {
    console.error("Failed to fetch contacts:", err);
    return res.status(500).json({ error: "Failed to fetch contact submissions" });
  }
});

export default router;

import { pgTable, serial, text, timestamp, varchar, inet } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 255 }),
  message: text("message").notNull(),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contactsTable)
  .omit({ id: true, createdAt: true, ipAddress: true })
  .extend({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.string().email("Please enter a valid email address"),
    message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
  });

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;

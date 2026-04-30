import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 255 }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(
  contactSubmissionsTable,
).omit({ id: true, createdAt: true });

export type InsertContact = typeof contactSubmissionsTable.$inferInsert;
export type Contact = typeof contactSubmissionsTable.$inferSelect;

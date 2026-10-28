import { pgTable, pgEnum, uuid, text, bigint, date, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const txType = pgEnum("tx_type", ["income", "expense", "transfer"]);
export const catType = pgEnum("cat_type", ["income", "expense"]);
export const accType = pgEnum("acc_type", ["cash", "bank", "ewallet", "other"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accType("type").notNull().default("bank"),
  initialBalance: bigint("initial_balance", { mode: "number" }).notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: catType("type").notNull(),
  icon: text("icon"),
  color: text("color"),
  isArchived: boolean("is_archived").notNull().default(false),
}, (t) => ({
  uniqueUserCategory: uniqueIndex("category_user_name_type_unique").on(t.userId, t.type, sql`lower(trim(${t.name}))`),
}));

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: txType("type").notNull(),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  toAccountId: uuid("to_account_id").references(() => accounts.id),
  categoryId: uuid("category_id").references(() => categories.id),
  amount: bigint("amount", { mode: "number" }).notNull(),
  note: text("note"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  byUserDate: index("tx_user_date_idx").on(t.userId, t.date),
  byAccount: index("tx_account_idx").on(t.accountId),
  byCategory: index("tx_category_idx").on(t.categoryId),
}));

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
}, (t) => ({ uniqueBudget: uniqueIndex("budget_unique").on(t.userId, t.categoryId, t.month) }));

"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, gte, ilike, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, budgets, categories, transactions, users } from "@/db/schema";
import { jakartaToday } from "@/lib/format";
import { getNeonAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AuthFormState = { error?: string; success?: string; email?: string };
export type TransactionFormState = { error?: string; success?: string };

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  accountId: z.string().uuid(),
  toAccountId: z.string().uuid().nullable(),
  categoryId: z.string().uuid().nullable(),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  note: z.string().max(240).nullable(),
  date: z.string().date(),
});

async function owner() {
  const { data: session } = await getNeonAuth.getSession();
  const email = session?.user?.email;
  if (!db || !email) redirect("/login");
  if (!session.user.emailVerified) redirect("/register?verify=1");
  const row = await ensureAppUser(email, session.user.name);
  return row;
}

async function ensureAppUser(email: string, name: string | null) {
  if (!db) throw new Error("Database belum dikonfigurasi.");
  await db.insert(users).values({ email: email.toLowerCase(), name }).onConflictDoNothing({ target: users.email });
  const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!row) throw new Error("Akun belum dapat disiapkan. Muat ulang halaman dan coba lagi.");
  return row;
}

export async function addAccount(form: FormData) {
  const user = await owner();
  const name = String(form.get("name") ?? "").trim();
  const initialBalance = Number(form.get("initialBalance") ?? 0);
  const type = z.enum(["cash", "bank", "ewallet", "other"]).safeParse(form.get("type") ?? "bank");
  if (!name || name.length > 80 || !Number.isSafeInteger(initialBalance) || initialBalance < 0) throw new Error("Nama dan saldo awal tidak valid.");
  if (!type.success) throw new Error("Jenis dompet tidak valid.");
  await db!.insert(accounts).values({ userId: user.id, name, type: type.data, initialBalance });
  revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath("/accounts");
}

export async function signOut() {
  await getNeonAuth.signOut();
  redirect("/login");
}

export async function signInWithEmail(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const valid = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) }).safeParse({ email, password });
  if (!valid.success) return { error: "Masukkan email dan kata sandi yang valid." };

  const { error } = await getNeonAuth.signIn.email({ email, password });
  if (error) {
    const message = `${error.message ?? ""} ${error.status ?? ""}`.toLowerCase();
    if (message.includes("verify") || message.includes("email not verified")) return { error: "Verifikasi email dulu sebelum masuk. Buka link atau kode verifikasi yang kami kirim." };
    return { error: "Email atau kata sandi tidak cocok." };
  }
  redirect("/dashboard");
}

export async function registerWithEmail(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const valid = z.object({ name: z.string().min(2).max(80), email: z.string().email().max(254), password: z.string().min(8).max(128) }).safeParse({ name, email, password });
  if (!valid.success) return { error: "Isi nama, email valid, dan kata sandi minimal 8 karakter." };

  const { error } = await getNeonAuth.signUp.email({ name, email, password });
  if (error) return { error: error.message || "Akun belum dapat dibuat. Periksa kembali email." };
  const sent = await getNeonAuth.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
  if (sent.error) return { success: `Akun berhasil dibuat untuk ${email}. Minta kode verifikasi baru di halaman berikutnya.`, email };
  return { success: `Kode verifikasi sudah dikirim ke ${email}.`, email };
}

export async function verifyEmailOtp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const otp = String(formData.get("otp") ?? "").trim();
  const valid = z.object({ email: z.string().email().max(254), otp: z.string().length(6) }).safeParse({ email, otp });
  if (!valid.success) return { error: "Masukkan email dan kode verifikasi yang valid." };
  const { error } = await getNeonAuth.emailOtp.verifyEmail({ email, otp });
  if (error) return { error: error.message || "Kode verifikasi tidak cocok atau sudah kedaluwarsa." };
  await getNeonAuth.getSession();
  return { success: "Email berhasil diverifikasi. Silakan masuk menggunakan akunmu." };
}

export async function resendEmailOtp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const valid = z.string().email().max(254).safeParse(email);
  if (!valid.success) return { error: "Masukkan alamat email yang valid." };
  const { error } = await getNeonAuth.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
  if (error) return { error: error.message || "Kode baru belum dapat dikirim." };
  return { success: "Kode verifikasi baru sudah dikirim. Periksa kotak masuk emailmu." };
}

export async function addCategory(form: FormData) {
  const user = await owner();
  const name = String(form.get("name") ?? "").trim();
  const type = z.enum(["income", "expense"]).safeParse(form.get("type") ?? "expense");
  if (!name || name.length > 60 || !type.success) throw new Error("Nama atau jenis kategori tidak valid.");
  await db!.insert(categories).values({ userId: user.id, name, type: type.data });
  revalidatePath("/categories"); revalidatePath("/budgets");
}

export async function archiveAccount(form: FormData) {
  const user = await owner();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) throw new Error("Dompet tidak valid.");
  await db!.update(accounts).set({ isArchived: true }).where(and(eq(accounts.id, id.data), eq(accounts.userId, user.id)));
  revalidatePath("/accounts");
  revalidatePath("/transactions/new");
}

export async function archiveCategory(form: FormData) {
  const user = await owner();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) throw new Error("Kategori tidak valid.");
  await db!.update(categories).set({ isArchived: true }).where(and(eq(categories.id, id.data), eq(categories.userId, user.id)));
  revalidatePath("/categories"); revalidatePath("/budgets");
  revalidatePath("/transactions/new");
}

export async function addTransaction(_state: TransactionFormState, form: FormData): Promise<TransactionFormState> {
  const user = await owner();
  const type = String(form.get("type") ?? "expense") as "income" | "expense" | "transfer";
  const accountId = String(form.get("accountId") ?? "");
  const toAccountId = String(form.get("toAccountId") ?? "") || null;
  const categoryId = String(form.get("categoryId") ?? "") || null;
  const amount = Number(String(form.get("amount") ?? "").replace(/\D/g, ""));
  const note = String(form.get("note") ?? "").trim() || null;
  const date = String(form.get("date") ?? jakartaToday());
  const parsed = transactionSchema.safeParse({ type, accountId, toAccountId, categoryId, amount, note, date });
  if (!parsed.success) return { error: "Periksa kembali nominal, tanggal, dan detail transaksi." };
  const [source] = await db!.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id))).limit(1);
  if (!source) return { error: "Dompet tidak ditemukan di akun ini." };
  if (type === "transfer") {
    if (!toAccountId || toAccountId === accountId) return { error: "Pilih dompet tujuan yang berbeda." };
    const [destination] = await db!.select().from(accounts).where(and(eq(accounts.id, toAccountId), eq(accounts.userId, user.id))).limit(1);
    if (!destination) return { error: "Dompet tujuan tidak ditemukan di akun ini." };
    if (source.isArchived || destination.isArchived) return { error: "Transaksi tidak dapat memakai dompet yang diarsipkan." };
  } else {
    if (source.isArchived) return { error: "Transaksi tidak dapat memakai dompet yang diarsipkan." };
    if (!categoryId) return { error: "Pilih kategori." };
    const [category] = await db!.select().from(categories).where(and(eq(categories.id, categoryId), eq(categories.userId, user.id), eq(categories.type, type))).limit(1);
    if (!category) return { error: "Kategori tidak cocok dengan jenis transaksi." };
  }
  await db!.insert(transactions).values({ userId: user.id, type, accountId, toAccountId: type === "transfer" ? toAccountId : null, categoryId: type === "transfer" ? null : categoryId, amount, note, date });
  revalidatePath("/"); revalidatePath("/dashboard"); revalidatePath("/transactions"); revalidatePath("/accounts");
  return { success: "Transaksi berhasil disimpan." };
}

export async function updateTransaction(_state: TransactionFormState, form: FormData): Promise<TransactionFormState> {
  const user = await owner();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Transaksi tidak ditemukan." };
  const type = String(form.get("type") ?? "expense") as "income" | "expense" | "transfer";
  const accountId = String(form.get("accountId") ?? "");
  const toAccountId = String(form.get("toAccountId") ?? "") || null;
  const categoryId = String(form.get("categoryId") ?? "") || null;
  const amount = Number(String(form.get("amount") ?? "").replace(/\D/g, ""));
  const note = String(form.get("note") ?? "").trim() || null;
  const date = String(form.get("date") ?? "");
  const parsed = transactionSchema.safeParse({ type, accountId, toAccountId, categoryId, amount, note, date });
  if (!parsed.success) return { error: "Periksa kembali nominal, tanggal, dan detail transaksi." };
  const [source] = await db!.select().from(accounts).where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id), eq(accounts.isArchived, false))).limit(1);
  if (!source) return { error: "Dompet tidak ditemukan atau sedang diarsipkan." };
  if (type === "transfer") {
    if (!toAccountId || toAccountId === accountId) return { error: "Pilih dompet tujuan yang berbeda." };
    const [destination] = await db!.select().from(accounts).where(and(eq(accounts.id, toAccountId), eq(accounts.userId, user.id), eq(accounts.isArchived, false))).limit(1);
    if (!destination) return { error: "Dompet tujuan tidak ditemukan atau sedang diarsipkan." };
  } else {
    if (!categoryId) return { error: "Pilih kategori." };
    const [category] = await db!.select().from(categories).where(and(eq(categories.id, categoryId), eq(categories.userId, user.id), eq(categories.type, type), eq(categories.isArchived, false))).limit(1);
    if (!category) return { error: "Kategori tidak cocok atau sedang diarsipkan." };
  }
  await db!.update(transactions).set({ type, accountId, toAccountId: type === "transfer" ? toAccountId : null, categoryId: type === "transfer" ? null : categoryId, amount, note, date }).where(and(eq(transactions.id, id.data), eq(transactions.userId, user.id)));
  revalidatePath("/dashboard"); revalidatePath("/transactions"); revalidatePath("/accounts");
  return { success: "Transaksi berhasil diperbarui." };
}

export async function deleteTransaction(form: FormData) {
  const user = await owner();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) throw new Error("Transaksi tidak valid.");
  await db!.delete(transactions).where(and(eq(transactions.id, id.data), eq(transactions.userId, user.id)));
  revalidatePath("/dashboard"); revalidatePath("/transactions"); revalidatePath("/accounts");
}

export async function listTransactions() {
  const user = await owner();
  return db!.select({ transaction: transactions, account: accounts, category: categories })
    .from(transactions)
    .leftJoin(accounts, and(eq(transactions.accountId, accounts.id), eq(accounts.userId, user.id)))
    .leftJoin(categories, and(eq(transactions.categoryId, categories.id), eq(categories.userId, user.id)))
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

export async function listFilteredTransactions(filters: { type?: string; from?: string; to?: string; accountId?: string; categoryId?: string; search?: string }) {
  const user = await owner();
  const predicates = [eq(transactions.userId, user.id)];
  const type = z.enum(["income", "expense", "transfer"]).safeParse(filters.type);
  if (type.success) predicates.push(eq(transactions.type, type.data));
  const from = z.string().date().safeParse(filters.from);
  if (from.success) predicates.push(gte(transactions.date, from.data));
  const to = z.string().date().safeParse(filters.to);
  if (to.success) predicates.push(lte(transactions.date, to.data));
  const accountId = z.string().uuid().safeParse(filters.accountId);
  if (accountId.success) predicates.push(or(eq(transactions.accountId, accountId.data), eq(transactions.toAccountId, accountId.data))!);
  const categoryId = z.string().uuid().safeParse(filters.categoryId);
  if (categoryId.success) predicates.push(eq(transactions.categoryId, categoryId.data));
  const search = (filters.search ?? "").trim().slice(0, 100);
  if (search) predicates.push(ilike(transactions.note, `%${search.replace(/[\\%_]/g, "\\$&")}%`));
  return db!.select({ transaction: transactions, account: accounts, category: categories })
    .from(transactions)
    .leftJoin(accounts, and(eq(transactions.accountId, accounts.id), eq(accounts.userId, user.id)))
    .leftJoin(categories, and(eq(transactions.categoryId, categories.id), eq(categories.userId, user.id)))
    .where(and(...predicates))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

export async function getTransactionForEdit(id: string) {
  const user = await owner();
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success) return null;
  const [row] = await db!.select().from(transactions).where(and(eq(transactions.id, validId.data), eq(transactions.userId, user.id))).limit(1);
  return row ?? null;
}

export async function getOwnedWalletsAndCategories() {
  const user = await owner();
  const [wallets, categoryRows] = await Promise.all([
    db!.select({ id: accounts.id, name: accounts.name }).from(accounts).where(and(eq(accounts.userId, user.id), eq(accounts.isArchived, false))),
    db!.select({ id: categories.id, name: categories.name, type: categories.type }).from(categories).where(and(eq(categories.userId, user.id), eq(categories.isArchived, false))),
  ]);
  return { wallets, categories: categoryRows };
}

export async function getMonthlyExpenseByCategory(month: string) {
  const user = await owner();
  const validMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).safeParse(month);
  if (!validMonth.success) throw new Error("Bulan tidak valid.");
  const [year, monthNumber] = validMonth.data.split("-").map(Number);
  const end = `${monthNumber === 12 ? year + 1 : year}-${String(monthNumber === 12 ? 1 : monthNumber + 1).padStart(2, "0")}-01`;
  const results = await db!.select({
    categoryId: transactions.categoryId,
    category: categories.name,
    total: sql<string>`sum(${transactions.amount})`,
  }).from(transactions)
    .leftJoin(categories, and(eq(transactions.categoryId, categories.id), eq(categories.userId, user.id)))
    .where(and(eq(transactions.userId, user.id), eq(transactions.type, "expense"), gte(transactions.date, `${validMonth.data}-01`), lt(transactions.date, end)))
    .groupBy(sql`coalesce(lower(trim(${categories.name})), 'kategori diarsipkan')`, categories.name, transactions.categoryId)
    .orderBy(desc(sql`sum(${transactions.amount})`));
  const merged = new Map<string, { category: string; total: number }>();
  for (const row of results) {
    const name = row.category?.trim() || "Kategori diarsipkan";
    const key = name.toLocaleLowerCase("id-ID");
    const current = merged.get(key);
    merged.set(key, { category: current?.category ?? name, total: (current?.total ?? 0) + Number(row.total) });
  }
  return [...merged.values()].sort((a, b) => b.total - a.total);
}

export async function exportTransactionsCsv() {
  const user = await owner();
  const rows = await db!.select({ date: transactions.date, type: transactions.type, amount: transactions.amount, note: transactions.note, account: accounts.name, category: categories.name })
    .from(transactions)
    .leftJoin(accounts, and(eq(transactions.accountId, accounts.id), eq(accounts.userId, user.id)))
    .leftJoin(categories, and(eq(transactions.categoryId, categories.id), eq(categories.userId, user.id)))
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
  const escape = (value: string | number | null) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    ["Tanggal", "Jenis", "Nominal (Rp)", "Dompet", "Kategori", "Catatan"],
    ...rows.map((row) => [row.date, row.type, Number(row.amount), row.account, row.category, row.note]),
  ].map((line) => line.map(escape).join(",")).join("\r\n");
  return csv;
}

export async function upsertBudget(form: FormData) {
  const user = await owner();
  const categoryId = z.string().uuid().safeParse(form.get("categoryId"));
  const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).safeParse(form.get("month"));
  const rawAmount = String(form.get("amount") ?? "").trim();
  const amountValue = rawAmount.replace(/\D/g, "");
  const amount = Number(amountValue);
  if (!categoryId.success || !month.success || !/^\d[\d.]*$/.test(rawAmount) || !Number.isSafeInteger(amount) || amount <= 0) throw new Error("Periksa kategori, bulan, dan nominal budget.");
  const [category] = await db!.select().from(categories).where(and(eq(categories.id, categoryId.data), eq(categories.userId, user.id), eq(categories.type, "expense"), eq(categories.isArchived, false))).limit(1);
  if (!category) throw new Error("Kategori pengeluaran tidak ditemukan.");
  await db!.insert(budgets).values({ userId: user.id, categoryId: category.id, month: month.data, amount }).onConflictDoUpdate({ target: [budgets.userId, budgets.categoryId, budgets.month], set: { amount } });
  revalidatePath("/budgets"); revalidatePath("/dashboard");
}

export async function getCurrentUser() {
  const { data: session } = await getNeonAuth.getSession();
  if (!session?.user?.email || !session.user.emailVerified || !db) return null;
  return ensureAppUser(session.user.email, session.user.name);
}

export async function requireCurrentUser() {
  const { data: session } = await getNeonAuth.getSession();
  if (!session?.user?.email) redirect("/login");
  if (!session.user.emailVerified) redirect(`/register?verify=1&email=${encodeURIComponent(session.user.email)}`);
  return ensureAppUser(session.user.email, session.user.name);
}

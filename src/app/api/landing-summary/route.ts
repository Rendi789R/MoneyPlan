import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getNeonAuth } from "@/lib/auth";
import { db } from "@/db";
import { accounts, transactions, users } from "@/db/schema";
import { jakartaToday } from "@/lib/format";

export async function GET() {
  const { data: session } = await getNeonAuth.getSession();
  if (!session?.user?.email || !session.user.emailVerified || !db) {
    return Response.json({ signedIn: false }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, session.user.email.toLowerCase())).limit(1);
  if (!user) return Response.json({ signedIn: true, hasData: false }, { headers: { "Cache-Control": "private, no-store" } });

  const today = jakartaToday();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [year, month] = today.slice(0, 7).split("-").map(Number);
  const monthEnd = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01`;
  const [accountRows, [monthly], recent] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.userId, user.id)),
    db.select({ income: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`, expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`, count: sql<number>`count(*)` }).from(transactions).where(and(eq(transactions.userId, user.id), gte(transactions.date, monthStart), lt(transactions.date, monthEnd))),
    db.select({ id: transactions.id, type: transactions.type, amount: transactions.amount, note: transactions.note }).from(transactions).where(and(eq(transactions.userId, user.id), gte(transactions.date, monthStart), lt(transactions.date, monthEnd))).orderBy(desc(transactions.date), desc(transactions.createdAt)).limit(1),
  ]);
  const allTransactions = await db.select({ accountId: transactions.accountId, toAccountId: transactions.toAccountId, type: transactions.type, amount: transactions.amount }).from(transactions).where(eq(transactions.userId, user.id));
  const balance = accountRows.reduce((sum, account) => sum + Number(account.initialBalance) + allTransactions.filter((tx) => tx.accountId === account.id || tx.toAccountId === account.id).reduce((part, tx) => part + (tx.type === "income" ? Number(tx.amount) : tx.type === "expense" ? -Number(tx.amount) : tx.toAccountId === account.id ? Number(tx.amount) : -Number(tx.amount)), 0), 0);
  return Response.json({ signedIn: true, hasData: accountRows.length > 0 || Number(monthly?.count ?? 0) > 0, balance, income: Number(monthly?.income ?? 0), expense: Number(monthly?.expense ?? 0), recent: recent[0] ? { type: recent[0].type, amount: Number(recent[0].amount), note: recent[0].note } : null }, { headers: { "Cache-Control": "private, no-store" } });
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, fmtNum } from "@/lib/creator/api";
import { logout, useMe, type User } from "@/lib/auth";

type Stats = {
  users: number;
  newUsers7d: number;
  activeUsers7d: number;
  blocked: number;
  signRequests: number;
  downloads: number;
  thumbnails: number;
  activeDownloads: number;
};

const fmtTime = (t: number | null) =>
  t ? new Date(t * 1000).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminPage() {
  const router = useRouter();
  const me = useMe();
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<{ total: number; items: User[] } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (me === null) router.replace("/login?next=/admin");
  }, [me, router]);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([apiGet<Stats>("/admin/stats"), apiGet<{ total: number; items: User[] }>("/admin/users", { q, page })]);
      setStats(s);
      setList(l);
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [q, page]);

  useEffect(() => {
    if (me?.role !== "admin") return;
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [me, load]);

  async function toggle(u: User) {
    if (!u.blocked && !confirm(`Block ${u.email}? They will be logged out and can't log in until unblocked.`)) return;
    try {
      const { user } = await apiPost<{ user: User }>(`/admin/users/${u.id}/block`, { blocked: !u.blocked });
      setList((l) => l && { ...l, items: l.items.map((x) => (x.id === user.id ? user : x)) });
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  if (!me) return <div className="tool-container text-center text-gray-500">Loading…</div>;
  if (me.role !== "admin")
    return (
      <div className="tool-container text-center">
        <h1 className="page-title mb-3">Admins only</h1>
        <p className="text-gray-500">You are logged in as {me.email}, which is not an admin account.</p>
      </div>
    );

  const cards: [string, number | undefined][] = [
    ["Total users", stats?.users],
    ["New users (7 days)", stats?.newUsers7d],
    ["Active users (7 days)", stats?.activeUsers7d],
    ["Blocked users", stats?.blocked],
    ["Signature requests", stats?.signRequests],
    ["YouTube downloads", stats?.downloads],
    ["Artwork lookups", stats?.thumbnails],
    ["Downloads running now", stats?.activeDownloads],
  ];
  const pages = list ? Math.max(1, Math.ceil(list.total / 50)) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end gap-3 mb-8">
        <div className="min-w-0">
          <h1 className="page-title">Admin panel</h1>
          <p className="text-gray-500 truncate">Logged in as {me.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={load} className="rounded-xl border-2 border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:border-purple-300">Refresh</button>
          <button type="button" onClick={async () => { if (await logout()) router.push("/"); }} className="rounded-xl border-2 border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:border-red-300 hover:text-red-600">Log out</button>
        </div>
      </div>

      {err && <p role="alert" className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {cards.map(([label, v]) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-5 shadow-sm">
            <div className="text-xs sm:text-sm font-semibold text-gray-500">{label}</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900">{v === undefined ? "…" : fmtNum(v)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900">Users {list && <span className="text-gray-400 font-semibold">({fmtNum(list.total)})</span>}</h2>
        <input
          className="input-field sm:!w-80 sm:ml-auto"
          placeholder="Search by email or name"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Joined</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Last login</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {list?.items.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900 break-all">{u.email}</td>
                <td className="px-4 py-3 text-gray-700">{u.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtTime(u.created)}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.hasPassword ? fmtTime(u.lastLogin) : "Password not set"}</td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggle(u)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${u.blocked ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                    >
                      {u.blocked ? "Blocked · Unblock" : "Active · Block"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {list && !list.items.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40">← Prev</button>
          <span className="text-gray-600">Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}

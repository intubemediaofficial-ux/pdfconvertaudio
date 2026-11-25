"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/creator/api";

export type User = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
  blocked: boolean;
  created: number;
  lastLogin: number | null;
  hasPassword: boolean;
};

export const AUTH_EVENT = "bt-auth-change";

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function fetchMe(): Promise<User | null> {
  try {
    return (await apiGet<{ user: User | null }>("/auth/me")).user;
  } catch {
    return null;
  }
}

export function useMe() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => fetchMe().then((u) => alive && setUser(u));
    load();
    window.addEventListener(AUTH_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(AUTH_EVENT, load);
    };
  }, []);
  return user;
}

export async function logout() {
  try {
    await apiPost("/auth/logout", {});
  } catch (e) {
    alert((e as Error).message);
    return false;
  }
  notifyAuthChange();
  return true;
}

export function homeFor(u: User) {
  return u.role === "admin" ? "/admin" : "/account";
}

export function nextParam(fallback: string) {
  const n = new URLSearchParams(window.location.search).get("next");
  if (!n) return fallback;
  try {
    const u = new URL(n, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search + u.hash : fallback;
  } catch {
    return fallback;
  }
}

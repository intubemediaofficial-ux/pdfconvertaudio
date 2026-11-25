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
  await apiPost("/auth/logout", {}).catch(() => undefined);
  notifyAuthChange();
}

export function homeFor(u: User) {
  return u.role === "admin" ? "/admin" : "/account";
}

export function nextParam(fallback: string) {
  const n = new URLSearchParams(window.location.search).get("next") || "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

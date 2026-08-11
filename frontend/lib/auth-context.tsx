"use client";

// Client-side auth session backed by the JWT the API issues. The token is the single source of
// truth: on load we decode its payload to restore { userId, role, ... } without another network
// call, and we treat "no token" or "expired token" the same as "logged out".

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, getToken, setToken } from "./api";
import type { CurrentUser, Role } from "./types";

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeUserFromToken(token: string): CurrentUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? payload["role"];
    const nameId =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ?? payload["nameid"];
    const email = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ?? payload["email"];
    const name = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ?? payload["unique_name"];

    if (!role || !nameId) return null;

    const expiresAtSeconds = payload["exp"];
    if (expiresAtSeconds && Date.now() >= expiresAtSeconds * 1000) return null;

    return { userId: Number(nameId), role: role as Role, email: email ?? "", fullName: name ?? "" };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) setUser(decodeUserFromToken(token));
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setToken(result.token);
    const nextUser: CurrentUser = {
      userId: result.userId,
      fullName: result.fullName,
      email: result.email,
      role: result.role,
    };
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/// Guards a role's section of the app: redirects to /login if unauthenticated, or to the
/// user's own home if they're logged in as the wrong role.
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [user, isLoading, role, router]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}

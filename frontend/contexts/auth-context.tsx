"use client";
import * as React from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import {
  api,
  ApiUser,
  clearToken,
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
} from "../lib/api";

type AuthContextType = {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<ApiUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);
  const router = useRouter();

  const refresh = React.useCallback(async () => {
    // Safety: avoid double-init
    setLoading(true);
    try {
      const token = getToken();
      const refreshToken = getRefreshToken();

      if (!token && !refreshToken) {
        setUser(null);
        return;
      }

      // SECURITY FIX: Verify token with backend BEFORE using cached user
      // Never trust cached data without server validation
      try {
        const res = await api.me();
        setUser(res.user);
        localStorage.setItem("paypredict.user", JSON.stringify(res.user));
        return;
      } catch (err: any) {
        // If not a 401, don't try to refresh — it could be a network error
        const is401 =
          err?.message?.includes("401") ||
          err?.message?.includes("Unauthorized");
        if (!is401 || !refreshToken) {
          // Clear tokens on 401, keep cached for network errors only
          if (is401) {
            clearToken();
            setUser(null);
          }
          return;
        }
      }

      // Try refresh token rotation
      try {
        const refreshRes = await api.refresh();
        setToken(refreshRes.token);
        if (refreshRes.refresh_token) {
          setRefreshToken(refreshRes.refresh_token);
        }
        const me = await api.me();
        setUser(me.user);
        localStorage.setItem("paypredict.user", JSON.stringify(me.user));
      } catch {
        clearToken();
        setUser(null);
      }
    } catch (e: any) {
      console.error("[AUTH] Session refresh error:", e);
      clearToken();
      setUser(null);
    } finally {
      // CRITICAL: always release loading, no matter what
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Login — returns the user object so the calling page can navigate based on role.
   * Navigation is NOT done here to avoid setLoading getting stuck on router errors.
   */
  const login = async (email: string, password: string): Promise<ApiUser> => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      const { token, refresh_token, user: userData } = res;

      setToken(token);
      if (refresh_token) {
        setRefreshToken(refresh_token);
      }

      // Set session cookie for proxy guard
      if (typeof document !== "undefined") {
        document.cookie = `paypredict.session=1; path=/; max-age=3600; SameSite=Lax`;
      }

      localStorage.setItem("paypredict.user", JSON.stringify(userData));

      flushSync(() => {
        setUser(userData);
      });

      return userData;
    } catch (err) {
      throw err;
    } finally {
      // CRITICAL: always release loading after login attempt
      setLoading(false);
    }
  };

  const logout = () => {
    (async () => {
      try {
        await api.logout();
      } catch (e) {
        console.warn("[AUTH] Logout request failed:", e);
      } finally {
        const role = user?.role;
        clearToken();
        flushSync(() => {
          setUser(null);
        });
        // Redirect to the appropriate login page based on last known role
        try {
          if (role === "admin") {
            router.replace("/admin/login");
          } else {
            router.replace("/client/login");
          }
        } catch {}
      }
    })();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/client/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Chargement de la session…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

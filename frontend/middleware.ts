import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths — never protected
  const publicPaths = [
    "/client/login",
    "/admin/login",
    "/login",
    "/",
    "/about",
    "/contact",
  ]

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // If already logged in, redirect to dashboard
    const token = request.cookies.get("paypredict.token")?.value
    const refreshToken = request.cookies.get("paypredict.refresh_token")?.value
    const sessionCookie = request.cookies.get("paypredict.session")?.value
    const isAuthenticated = Boolean(token || refreshToken || sessionCookie === "1")

    if (isAuthenticated && (pathname === "/login" || pathname === "/client/login" || pathname === "/admin/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // CRITICAL SECURITY: Check for valid authentication on ALL protected routes
  const hasTokenCookie = Boolean(request.cookies.get("paypredict.token")?.value)
  const hasRefreshToken = Boolean(request.cookies.get("paypredict.refresh_token")?.value)
  const hasSessionCookie = request.cookies.get("paypredict.session")?.value === "1"
  const isAuthenticated = hasTokenCookie || hasRefreshToken || hasSessionCookie

  // Protect /dashboard/* routes - STRICT authentication required
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/client/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/client/login",
    "/admin/login",
    "/login",
  ],
}
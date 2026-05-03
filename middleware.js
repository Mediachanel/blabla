import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/auth/sessionConfig";

const protectedRoutes = ["/dashboard", "/pegawai", "/usulan", "/import-drh", "/duk", "/qna-admin", "/profil"];
const roleRules = {
  "/import-drh": ["SUPER_ADMIN"],
  "/qna-admin": ["SUPER_ADMIN"],
  "/usulan": ["SUPER_ADMIN", "ADMIN_WILAYAH"]
};

async function verify(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get("sdm_session")?.value;
  const user = await verify(token);
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const rule = Object.entries(roleRules).find(([route]) => pathname.startsWith(route));
  if (rule && !rule[1].includes(user.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pegawai/:path*", "/usulan/:path*", "/import-drh/:path*", "/duk/:path*", "/qna-admin/:path*", "/profil/:path*"]
};

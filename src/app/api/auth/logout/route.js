import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth/session";

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/login", request.nextUrl));
  response.cookies.set(sessionCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logout berhasil", data: null });
  response.cookies.set(sessionCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

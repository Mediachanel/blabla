import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "sdm_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export async function signSession(user) {
  return new SignJWT({
    id: user.id,
    username: user.username,
    nama_ukpd: user.nama_ukpd,
    role: user.role,
    wilayah: user.wilayah
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(token);
}

export function sessionCookieName() {
  return COOKIE_NAME;
}

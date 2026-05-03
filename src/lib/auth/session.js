import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/auth/sessionConfig";

const COOKIE_NAME = "sdm_session";

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
    .sign(getJwtSecret());
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
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

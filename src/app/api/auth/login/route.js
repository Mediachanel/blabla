import { z } from "zod";
import { loginUsers, verifyPassword } from "@/lib/auth/passwords";
import { sessionCookieName, signSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/helpers/response";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

export async function POST(request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Username dan password wajib diisi dengan benar.", 422, parsed.error.flatten());

  const { username, password } = parsed.data;
  const user = loginUsers.find((item) => item.username === username || item.nama_ukpd.toLowerCase() === username.toLowerCase());
  if (!user) return fail("Kredensial tidak valid.", 401);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail("Kredensial tidak valid.", 401);

  const token = await signSession(user);
  const response = ok({ id: user.id, username: user.username, role: user.role, wilayah: user.wilayah, nama_ukpd: user.nama_ukpd }, "Login berhasil");
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}

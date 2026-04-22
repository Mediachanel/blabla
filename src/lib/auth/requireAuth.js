import { getCurrentUser } from "@/lib/auth/session";
import { fail } from "@/lib/helpers/response";

export async function requireAuth(allowedRoles = []) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: fail("Sesi tidak valid. Silakan login kembali.", 401) };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { error: fail("Anda tidak memiliki akses ke fitur ini.", 403) };
  }
  return { user };
}

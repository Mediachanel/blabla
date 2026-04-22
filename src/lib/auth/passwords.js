import bcrypt from "bcryptjs";
import { users } from "@/data/mock";

const DEMO_PASSWORD = "password123";

export const loginUsers = users.map((user) => ({
  ...user,
  passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10)
}));

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

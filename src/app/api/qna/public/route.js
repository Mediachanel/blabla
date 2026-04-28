import { fail, ok } from "@/lib/helpers/response";
import { getQnaOverview } from "@/lib/qna";

export async function GET() {
  try {
    const data = await getQnaOverview({ publishedOnly: true });
    return ok(data);
  } catch (error) {
    console.error("QnA public error:", error.message);
    return fail("Data QnA belum siap digunakan.", 503);
  }
}

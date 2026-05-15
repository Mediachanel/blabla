import { requireAuth } from "@/lib/auth/requireAuth";
import { ROLES } from "@/lib/constants/roles";
import { fail, ok } from "@/lib/helpers/response";
import { extractWorkflowLogPayload, writeAiWorkflowLog } from "@/lib/n8n-ai/audit";
import { isN8nAiEnabled, normalizeUserForWorkflow } from "@/lib/n8n-ai/security";
import { normalizeWorkflowResponse } from "@/lib/n8n-ai/response";

export const runtime = "nodejs";

export async function POST(request) {
  const { user, error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD], request);
  if (error) return error;

  try {
    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return fail("Pesan tidak boleh kosong", 400);
    }

    if (!isN8nAiEnabled()) {
      return fail("AI n8n belum aktif. Set AI_ENABLE_N8N=true.", 503);
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.N8N_API_SECRET;

    if (!webhookUrl || !secret) {
      return fail("Konfigurasi n8n belum tersedia", 500);
    }

    const workflowUser = normalizeUserForWorkflow(user);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ai-secret": secret
      },
      body: JSON.stringify({
        message,
        source: "internal_chat",
        user: workflowUser
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      await writeAiWorkflowLog({
        user_id: workflowUser.id,
        role: workflowUser.role,
        source: "internal_chat",
        message,
        verification: "n8n_error",
        response: result.error || result.message || "Workflow n8n gagal diproses"
      });
      return fail("Workflow n8n gagal diproses", 500, result);
    }

    const normalized = normalizeWorkflowResponse(result, message);
    await writeAiWorkflowLog(extractWorkflowLogPayload({
      result: normalized,
      message,
      source: "internal_chat",
      user: workflowUser
    }));

    return ok(normalized, "AI n8n selesai memproses pesan.");
  } catch (err) {
    console.error("AI n8n chat error:", err);
    return fail("Terjadi kesalahan AI workflow", 500);
  }
}

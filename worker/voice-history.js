import app from "./index.js";

const SESSION_COOKIE = "svara_session";
const VALID_STATUSES = new Set(["generating", "ready", "failed", "storage_failed"]);
const VALID_FORMATS = new Set(["mp3", "wav", "pcm"]);
const VALID_DATES = new Set(["today", "7d", "30d"]);

function sessionToken(request) {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === SESSION_COOKIE) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return ""; }
    }
  }
  return "";
}

async function authenticatedUserId(request, env) {
  if (!env.DB) return null;
  const token = sessionToken(request);
  if (!token) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const row = await env.DB.prepare(`
    SELECT u.id
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.revoked_at IS NULL
      AND s.expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now')
      AND u.status='active'
    LIMIT 1
  `).bind(tokenHash).first();
  return row?.id || null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function cleanDisplayName(value) {
  const name = String(value || "").trim().replace(/\.(mp3|wav|pcm)$/i, "").trim();
  if (!name) throw new Error("Enter a name for this Voice generation.");
  if (name.length > 100 || /[\\/\u0000-\u001f\u007f]/.test(name)) {
    throw new Error("Use a name up to 100 characters without file-path characters.");
  }
  return name;
}

const originalAppFetch = app.fetch.bind(app);
app.fetch = async (request, env, ctx) => {
  const url = new URL(request.url);

  if (url.pathname === "/api/voice/generations" && request.method === "GET") {
    const userId = await authenticatedUserId(request, env);
    if (!userId) return json({ error: "Authentication required." }, 401);
    if (!env.DB) return json({ error: "Voice History storage is not configured." }, 503);

    const requestedLimit = Number(url.searchParams.get("limit") || 20);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20;
    const requestedPage = Number(url.searchParams.get("page") || 1);
    const page = Number.isInteger(requestedPage) ? Math.max(requestedPage, 1) : 1;
    const offset = (page - 1) * limit;
    const requestedStatus = String(url.searchParams.get("status") || "").trim().toLowerCase();
    const requestedFormat = String(url.searchParams.get("format") || "").trim().toLowerCase();
    const requestedDate = String(url.searchParams.get("date") || "").trim().toLowerCase();
    const requestedFolder = String(url.searchParams.get("folderId") || "").trim();
    const requestedVoice = String(url.searchParams.get("voiceId") || "").trim();
    const requestedSearch = String(url.searchParams.get("search") || "").trim().toLowerCase();

    if (requestedStatus && !VALID_STATUSES.has(requestedStatus)) return json({ error: "Invalid Voice generation status." }, 400);
    if (requestedFormat && !VALID_FORMATS.has(requestedFormat)) return json({ error: "Invalid Voice output format." }, 400);
    if (requestedDate && !VALID_DATES.has(requestedDate)) return json({ error: "Invalid Voice History date filter." }, 400);

    const conditions = ["g.user_id = ?"];
    const bindings = [userId];
    if (requestedStatus) { conditions.push("g.status = ?"); bindings.push(requestedStatus); }
    if (requestedFormat) { conditions.push("LOWER(g.format) = ?"); bindings.push(requestedFormat); }
    if (requestedVoice) { conditions.push("g.voice_id = ?"); bindings.push(requestedVoice); }
    if (requestedFolder) {
      if (requestedFolder === "__unfiled__") conditions.push("g.folder_id IS NULL");
      else { conditions.push("g.folder_id = ?"); bindings.push(requestedFolder); }
    }
    if (requestedSearch) {
      const term = "%" + requestedSearch.replace(/[\\%_]/g, "\\$&") + "%";
      conditions.push("(LOWER(COALESCE(g.voice_name,'')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(g.script,'')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(vdn.display_name,'')) LIKE ? ESCAPE '\\')");
      bindings.push(term, term, term);
    }
    if (requestedDate) {
      const modifier = requestedDate === "today" ? "-1 day" : requestedDate === "7d" ? "-7 days" : "-30 days";
      conditions.push("g.created_at >= datetime('now', ?)");
      bindings.push(modifier);
    }

    const where = conditions.join(" AND ");
    try {
      const totalRow = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM generations g LEFT JOIN voice_display_names vdn ON vdn.generation_id=g.id AND vdn.user_id=g.user_id WHERE " + where
      ).bind(...bindings).first();
      const total = Number(totalRow?.total || 0);
      const rows = await env.DB.prepare(`
        SELECT g.id, g.voice_id, g.voice_name, g.script, g.character_count,
          g.speed, g.stability, g.style, g.format, g.mime_type, g.status,
          g.r2_key, g.size_bytes, g.credits_charged, g.is_free_take,
          g.take_number, g.parent_generation_id, g.folder_id, lf.name AS folder_name,
          g.created_at, g.completed_at, g.expires_at, vdn.display_name
        FROM generations g
        LEFT JOIN library_folders lf ON lf.id=g.folder_id AND lf.user_id=g.user_id
        LEFT JOIN voice_display_names vdn ON vdn.generation_id=g.id AND vdn.user_id=g.user_id
        WHERE ${where}
        ORDER BY g.created_at DESC, g.id DESC
        LIMIT ? OFFSET ?
      `).bind(...bindings, limit, offset).all();

      const generations = (rows.results || []).map(row => {
        const storageFilename = String(row.r2_key || "").split("/").pop();
        const extension = String(row.format || "mp3").toLowerCase();
        const displayName = String(row.display_name || storageFilename.replace(/\.[^.]+$/, ""));
        const filename = displayName + "." + extension;
        const hasAudio = row.status === "ready" && Boolean(row.r2_key) &&
          String(row.r2_key).startsWith("users/" + userId + "/generations/");
        const assetUrl = hasAudio && storageFilename
          ? "/api/generations/media?filename=" + encodeURIComponent(storageFilename)
          : null;
        return {
          id: String(row.id),
          voiceId: String(row.voice_id || ""),
          voiceName: String(row.voice_name || "Voice"),
          script: String(row.script || ""),
          characterCount: Number(row.character_count) || 0,
          speed: Number(row.speed) || 1,
          stability: Number(row.stability) || 0,
          style: String(row.style || ""),
          format: extension.toUpperCase(),
          mimeType: String(row.mime_type || ""),
          filename,
          storageFilename,
          status: String(row.status || "failed"),
          sizeBytes: Number(row.size_bytes) || 0,
          creditsCharged: Number(row.credits_charged) || 0,
          isFreeTake: Number(row.is_free_take) === 1,
          takeNumber: Number(row.take_number) || 1,
          parentGenerationId: row.parent_generation_id || null,
          folderId: row.folder_id || null,
          folderName: row.folder_name || null,
          createdAt: row.created_at || null,
          completedAt: row.completed_at || null,
          expiresAt: row.expires_at || null,
          assetUrl,
          downloadUrl: assetUrl ? assetUrl + "&download=1" : null
        };
      });
      const pageCount = total ? Math.ceil(total / limit) : 0;
      return json({
        generations, count: generations.length, total, limit, page, pageCount,
        hasNext: page < pageCount,
        hasPrevious: page > 1 && pageCount > 0,
        filters: {
          status: requestedStatus || null, format: requestedFormat || null,
          date: requestedDate || null, folderId: requestedFolder || null,
          voiceId: requestedVoice || null, search: requestedSearch || null
        }
      });
    } catch (error) {
      console.error("voice_history_list_error", error);
      return json({ error: "Could not load Voice History." }, 500);
    }
  }

  if (url.pathname === "/api/voice/generations/rename" && request.method === "POST") {
    const userId = await authenticatedUserId(request, env);
    if (!userId) return json({ error: "Authentication required." }, 401);
    if (!env.DB) return json({ error: "Voice History storage is not configured." }, 503);
    try {
      const body = await request.json().catch(() => ({}));
      const generationId = String(body?.generationId || "").trim();
      if (!generationId) return json({ error: "Voice generation ID is required." }, 400);
      const displayName = cleanDisplayName(body?.displayName);
      const row = await env.DB.prepare(
        "SELECT id,format FROM generations WHERE id=? AND user_id=? LIMIT 1"
      ).bind(generationId, userId).first();
      if (!row) return json({ error: "Voice generation not found." }, 404);
      await env.DB.prepare(`
        INSERT INTO voice_display_names (generation_id,user_id,display_name,updated_at)
        VALUES (?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        ON CONFLICT(generation_id,user_id) DO UPDATE SET
          display_name=excluded.display_name, updated_at=excluded.updated_at
      `).bind(generationId, userId, displayName).run();
      return json({
        success: true, generationId, displayName,
        filename: displayName + "." + String(row.format || "mp3").toLowerCase()
      });
    } catch (error) {
      if (String(error?.message || "").includes("Enter a name") || String(error?.message || "").includes("Use a name")) {
        return json({ error: error.message }, 400);
      }
      console.error("voice_history_rename_error", error);
      return json({ error: "Could not rename Voice generation." }, 500);
    }
  }

  if (url.pathname === "/api/voice/generations/delete" && request.method === "POST") {
    const userId = await authenticatedUserId(request, env);
    if (!userId) return json({ error: "Authentication required." }, 401);
    if (!env.DB) return json({ error: "Voice History storage is not configured." }, 503);
    try {
      const body = await request.json().catch(() => ({}));
      const generationId = String(body?.generationId || "").trim();
      if (!generationId) return json({ error: "Voice generation ID is required." }, 400);
      const row = await env.DB.prepare(
        "SELECT id,r2_key FROM generations WHERE id=? AND user_id=? LIMIT 1"
      ).bind(generationId, userId).first();
      if (!row) return json({ error: "Voice generation not found." }, 404);
      const r2Key = String(row.r2_key || "");
      if (r2Key && !r2Key.startsWith("users/" + userId + "/generations/")) {
        return json({ error: "Voice asset ownership could not be verified." }, 403);
      }
      if (r2Key && env.GENERATED_AUDIO) await env.GENERATED_AUDIO.delete(r2Key);
      await env.DB.prepare("DELETE FROM voice_display_names WHERE generation_id=? AND user_id=?").bind(generationId, userId).run();
      const deleted = await env.DB.prepare("DELETE FROM generations WHERE id=? AND user_id=?").bind(generationId, userId).run();
      if (!deleted.meta?.changes) return json({ error: "Voice generation not found." }, 404);
      return json({ success: true, generationId });
    } catch (error) {
      console.error("voice_history_delete_error", error);
      return json({ error: "Could not delete Voice generation." }, 500);
    }
  }

  return originalAppFetch(request, env, ctx);
};

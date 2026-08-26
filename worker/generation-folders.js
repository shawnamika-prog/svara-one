import app from "./index.js";

const SESSION_COOKIE = "svara_session";

function sessionToken(request) {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === SESSION_COOKIE) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return "";
}

async function authenticatedUserId(request, env) {
  if (!env.DB) return null;
  const token = sessionToken(request);
  if (!token) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const row = await env.DB.prepare(`SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND u.status='active' LIMIT 1`).bind(tokenHash).first();
  return row?.id || null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function cleanFolderName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name) throw new Error("A folder name is required.");
  if (name.length > 80) throw new Error("Folder name is too long.");
  if (name === "." || name === "..") throw new Error("That folder name is not allowed.");
  return name;
}

const originalAppFetch = app.fetch.bind(app);
app.fetch = async (request, env, ctx) => {
  const url = new URL(request.url);

  if (url.pathname === "/api/generations/folders") {
    const userId = await authenticatedUserId(request, env);
    if (!userId) return json({ error: "Authentication required." }, 401);
    if (!env.DB) return json({ error: "Library storage is not configured." }, 503);

    if (request.method === "GET") {
      try {
        const rows = await env.DB.prepare(`SELECT f.id,f.name,f.created_at,COUNT(g.id) AS item_count FROM library_folders f LEFT JOIN generations g ON g.folder_id=f.id AND g.user_id=f.user_id WHERE f.user_id=? GROUP BY f.id,f.name,f.created_at ORDER BY f.created_at ASC`).bind(userId).all();
        return json({ folders: (rows.results || []).map(row => ({ id: String(row.id), name: String(row.name), createdAt: row.created_at || null, itemCount: Number(row.item_count) || 0 })) });
      } catch (error) {
        console.error("library_folder_list_error", error);
        return json({ error: "Could not load your folders." }, 500);
      }
    }

    if (request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        const name = cleanFolderName(body?.name);
        const id = crypto.randomUUID();
        const result = await env.DB.prepare("INSERT INTO library_folders (id,user_id,name) VALUES (?,?,?)").bind(id, userId, name).run();
        if (!result.meta?.changes) return json({ error: "Folder could not be created." }, 500);
        return json({ success: true, folder: { id, name } }, 201);
      } catch (error) {
        if (String(error?.message || "").toLowerCase().includes("unique")) return json({ error: "A folder with that name already exists." }, 409);
        console.error("library_folder_create_error", error);
        return json({ error: error?.message || "Could not create folder." }, 400);
      }
    }
  }

  if (request.method === "POST" && url.pathname === "/api/generations/move") {
    const userId = await authenticatedUserId(request, env);
    if (!userId) return json({ error: "Authentication required." }, 401);
    if (!env.DB) return json({ error: "Library storage is not configured." }, 503);
    try {
      const body = await request.json().catch(() => ({}));
      const filename = String(body?.filename || "").trim().replace(/[\\/]/g, "");
      const folderId = body?.folderId == null || body?.folderId === "" ? null : String(body.folderId).trim();
      if (!filename || filename === "." || filename === "..") return json({ error: "A valid filename is required." }, 400);

      // Moving a generation between Library folders is a D1 metadata operation only.
      // The R2 object remains at its existing user-scoped generations/<filename> key.
      const generation = await env.DB.prepare("SELECT id,r2_key FROM generations WHERE user_id=? AND r2_key LIKE ? ORDER BY created_at DESC LIMIT 1").bind(userId, `%/${filename}`).first();
      if (!generation?.id) return json({ error: "Generation not found." }, 404);

      if (folderId) {
        const folder = await env.DB.prepare("SELECT id,name FROM library_folders WHERE id=? AND user_id=? LIMIT 1").bind(folderId, userId).first();
        if (!folder) return json({ error: "Folder not found." }, 404);
      }

      const result = await env.DB.prepare("UPDATE generations SET folder_id=? WHERE id=? AND user_id=?").bind(folderId, generation.id, userId).run();
      if (!result.meta?.changes) return json({ error: "Generation could not be moved." }, 404);
      return json({ success: true, filename, folderId, folderName: folderId ? (await env.DB.prepare("SELECT name FROM library_folders WHERE id=? AND user_id=?").bind(folderId, userId).first())?.name || null : null });
    } catch (error) {
      console.error("generation_move_error", error);
      return json({ error: error?.message || "Could not move generation." }, 500);
    }
  }

  return originalAppFetch(request, env, ctx);
};

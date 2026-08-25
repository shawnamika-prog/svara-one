const RETENTION_DAYS = 90;

export function mimeTypeForFormat(format) {
  switch (String(format || '').toLowerCase()) {
    case 'wav': return 'audio/wav';
    case 'pcm': return 'audio/l16;rate=24000';
    default: return 'audio/mpeg';
  }
}

export function extensionForFormat(format) {
  const value = String(format || 'mp3').toLowerCase();
  return ['mp3', 'wav', 'pcm'].includes(value) ? value : 'mp3';
}

function safeVoiceName(value) {
  const cleaned = String(value || 'voice')
    .replace(/@@SVARA1:\d{8}_\d{6}$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'voice';
}

function filenameStamp(value) {
  const supplied = String(value || '').trim();
  if (/^\d{8}_\d{6}$/.test(supplied)) return supplied;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

export function generationFilename(voiceName, format, suppliedStamp = '') {
  const extension = extensionForFormat(format);
  return `svara1_${safeVoiceName(voiceName)}_${filenameStamp(suppliedStamp)}.${extension}`;
}

export function generationExpiryDate(from = new Date()) {
  const date = new Date(from);
  date.setUTCDate(date.getUTCDate() + RETENTION_DAYS);
  return date.toISOString();
}

export async function createGeneration(env, {
  id,
  userId,
  voiceId,
  providerVoiceId,
  voiceName,
  script,
  speed,
  stability,
  style,
  format,
  creditsCharged,
  creditReferenceId,
  parentGenerationId = null,
  takeNumber = 1,
  isFreeTake = false
}) {
  if (!env.DB) throw new Error('D1 generation storage is not configured.');

  const extension = extensionForFormat(format);
  const cleanVoiceName = String(voiceName || 'voice').replace(/@@SVARA1:\d{8}_\d{6}$/, '').trim() || 'voice';
  const suppliedStamp = String(voiceName || '').match(/@@SVARA1:(\d{8}_\d{6})$/)?.[1] || '';
  const filename = generationFilename(cleanVoiceName, extension, suppliedStamp);
  const r2Key = `users/${userId}/generations/${filename}`;
  const expiresAt = generationExpiryDate();

  await env.DB.prepare(`
    INSERT INTO generations (
      id, user_id, parent_generation_id, take_number,
      voice_id, provider_voice_id, voice_name,
      script, character_count, speed, stability, style,
      format, mime_type,
      credits_charged, credit_reference_id, is_free_take,
      status, r2_key, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generating', ?, ?)
  `).bind(
    id,
    userId,
    parentGenerationId,
    takeNumber,
    String(voiceId || ''),
    String(providerVoiceId || ''),
    cleanVoiceName,
    String(script || ''),
    String(script || '').length,
    Number.isFinite(Number(speed)) ? Number(speed) : 1,
    Number.isFinite(Number(stability)) ? Number(stability) : 50,
    String(style || ''),
    extension,
    mimeTypeForFormat(extension),
    Math.max(0, Number(creditsCharged) || 0),
    creditReferenceId || null,
    isFreeTake ? 1 : 0,
    r2Key,
    expiresAt
  ).run();

  return { id, r2Key, expiresAt, filename };
}

export async function markGenerationReady(env, id, r2Object) {
  await env.DB.prepare(`
    UPDATE generations
    SET status = 'ready',
        r2_etag = ?,
        size_bytes = ?,
        completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).bind(
    r2Object?.etag || null,
    Number.isFinite(Number(r2Object?.size)) ? Number(r2Object.size) : null,
    id
  ).run();
}

export async function markGenerationFailed(env, id, status = 'failed') {
  const safeStatus = status === 'storage_failed' ? 'storage_failed' : 'failed';
  await env.DB.prepare(`
    UPDATE generations
    SET status = ?, completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).bind(safeStatus, id).run();
}

export async function deleteGenerationAudio(env, r2Key) {
  if (!env.GENERATED_AUDIO || !r2Key) return;
  await env.GENERATED_AUDIO.delete(r2Key);
}

export async function deleteUserGenerationAudio(env, userId) {
  if (!env.DB || !env.GENERATED_AUDIO) return;

  const rows = await env.DB.prepare(
    "SELECT r2_key FROM generations WHERE user_id = ? AND r2_key IS NOT NULL"
  ).bind(userId).all();

  const keys = (rows.results || [])
    .map(row => String(row.r2_key || ''))
    .filter(Boolean);

  if (keys.length) await env.GENERATED_AUDIO.delete(keys);
}

export async function cleanupExpiredGenerations(env, limit = 100) {
  if (!env.DB || !env.GENERATED_AUDIO) return { checked: 0, deleted: 0 };

  const rows = await env.DB.prepare(`
    SELECT id, r2_key
    FROM generations
    WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now')
    ORDER BY expires_at ASC
    LIMIT ?
  `).bind(Math.max(1, Math.min(1000, Number(limit) || 100))).all();

  let deleted = 0;
  for (const row of rows.results || []) {
    const key = String(row.r2_key || '');
    try {
      if (key) await env.GENERATED_AUDIO.delete(key);
      await env.DB.prepare('DELETE FROM generations WHERE id = ?').bind(row.id).run();
      deleted += 1;
    } catch (error) {
      console.error('generation_cleanup_error', row.id, error);
    }
  }

  return { checked: (rows.results || []).length, deleted };
}

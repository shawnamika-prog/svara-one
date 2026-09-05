function configuredRate(env) {
  const rate = Number(env.SVARAONE_SOUND_CREDITS_PER_SECOND);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

export function soundCreditCost(env, durationSeconds) {
  const duration = Number(durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) return null;

  const rate = configuredRate(env);
  if (rate === null) return null;

  return Math.max(1, Math.ceil(duration * rate));
}

export async function reserveSoundCredits(userId, cost, env, referenceId = crypto.randomUUID()) {
  const credits = Number(cost);
  if (!Number.isInteger(credits) || credits <= 0) throw new Error("Sound credit cost must be a positive integer");

  const result = await env.DB.prepare(`
    INSERT INTO credit_ledger
      (id, user_id, amount, balance_after, reason, reference_id, period_key)
    SELECT ?, ?, ?, balance_after - ?, 'generation', ?, 'generation'
    FROM credit_ledger
    WHERE user_id = ?
      AND balance_after >= ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(
    crypto.randomUUID(), userId, -credits, credits, referenceId, userId, credits
  ).run();

  if (!result.meta?.changes) return null;

  const row = await env.DB.prepare(
    "SELECT balance_after FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(userId).first();

  return {
    referenceId,
    cost: credits,
    balance: Number(row?.balance_after || 0)
  };
}

export async function refundSoundCredits(userId, cost, referenceId, env) {
  const credits = Number(cost);
  if (!Number.isInteger(credits) || credits <= 0) throw new Error("Sound credit refund must be a positive integer");
  if (!String(referenceId || "").trim()) throw new Error("Sound credit reference ID is required");

  await env.DB.prepare(`
    INSERT INTO credit_ledger
      (id, user_id, amount, balance_after, reason, reference_id, period_key)
    SELECT ?, ?, ?, balance_after + ?, 'generation_refund', ?, 'generation'
    FROM credit_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(
    crypto.randomUUID(), userId, credits, credits, referenceId, userId
  ).run();
}

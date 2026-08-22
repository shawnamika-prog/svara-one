const PLAN_ORDER = ["starter", "creator", "pro", "studio"];
const PLAN_NAMES = { starter: "Starter", creator: "Creator", pro: "Pro", studio: "Studio" };
const PLAN_FEATURES = {
  starter: ["10 voices", "MP3 download", "Commercial use"],
  creator: ["20 voices", "MP3 download", "Commercial use", "Premium voice collection"],
  pro: ["Full voice library", "MP3 download", "Commercial use", "Priority generation"],
  studio: ["Full voice library", "MP3 download", "Commercial use", "Built for high-volume creation"]
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[char]));
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function currentPlanKey(user) {
  return String(user?.subscription?.plan || "free").toLowerCase();
}

function currentPlanPrice(user, pricing) {
  const key = currentPlanKey(user);
  return key === "free" ? 0 : Number(pricing.plans?.[key]?.price || 0);
}

function showStatus(message, type = "pending") {
  const el = document.querySelector("#status");
  if (!el) return;
  el.textContent = message;
  el.className = `status show ${type}`;
}

function showAccount(user) {
  const meta = document.querySelector("#accountMeta");
  const badge = document.querySelector("#currentPlanBadge");
  if (!meta) return;
  const subscription = user.subscription;
  const plan = currentPlanKey(user);
  if (badge) badge.textContent = PLAN_NAMES[plan] || "Free";
  meta.innerHTML = `
    <div class="row"><span class="label">Email</span><strong>${escapeHtml(user.email)}</strong></div>
    <div class="row"><span class="label">Plan</span><strong>${escapeHtml(PLAN_NAMES[plan] || "Free")}</strong></div>
    <div class="row"><span class="label">Credits</span><strong>${Number(user.credits || 0).toLocaleString()}</strong></div>
    <div class="row"><span class="label">Voices</span><strong>${Array.isArray(user.voices) ? user.voices.length : 0}</strong></div>
    ${subscription?.period_end ? `<div class="row"><span class="label">Plan period ends</span><strong>${new Date(subscription.period_end).toLocaleDateString()}</strong></div>` : ""}`;
}

function renderPlans(user, pricing) {
  const grid = document.querySelector("#planGrid");
  const note = document.querySelector("#upgradeNote");
  if (!grid) return;

  const current = currentPlanKey(user);
  const currentIndex = current === "free" ? -1 : PLAN_ORDER.indexOf(current);
  const currentPrice = currentPlanPrice(user, pricing);
  const plans = PLAN_ORDER.filter(plan => PLAN_ORDER.indexOf(plan) > currentIndex);

  if (!plans.length) {
    grid.innerHTML = `<div class="muted">You're already on the highest available plan.</div>`;
    if (note) note.textContent = "";
    return;
  }

  grid.innerHTML = plans.map(plan => {
    const config = pricing.plans?.[plan];
    if (!config) return "";
    const difference = Math.max(0, Number(config.price) - currentPrice);
    const features = PLAN_FEATURES[plan] || [];
    const popular = plan === "creator" ? `<div class="tag">MOST POPULAR</div>` : "";
    const differenceCopy = current === "free"
      ? `<p class="upgrade-difference">Annual price: <strong>$${money(difference)}</strong></p>`
      : `<p class="upgrade-difference">Upgrade difference: <strong>$${money(difference)}</strong></p>`;
    return `
      <article class="plan-option${plan === "creator" ? " popular" : ""}">
        ${popular}
        <h3>${escapeHtml(PLAN_NAMES[plan])}</h3>
        <div class="plan-price">$${money(config.price)} <span>/ year</span></div>
        <b class="plan-credit">${Number(config.credits).toLocaleString()} <span class="brand-svara">SvaraONE</span> Credits / month</b>
        <ul class="plan-features">${features.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
        ${differenceCopy}
        <button class="plan-button" type="button" data-plan="${plan}">${current === "free" ? "Choose" : "Upgrade to"} ${escapeHtml(PLAN_NAMES[plan])}</button>
      </article>`;
  }).join("");

  grid.querySelectorAll("[data-plan]").forEach(button => button.addEventListener("click", () => beginUpgrade(button.dataset.plan)));
  if (note) note.textContent = current === "free"
    ? "You're on the Free plan. Choosing a paid plan starts a new annual subscription."
    : "Upgrades are charged only for the difference between your current annual plan and the selected plan.";
}

async function beginUpgrade(plan) {
  const button = document.querySelector(`[data-plan="${CSS.escape(plan)}"]`);
  const buttons = [...document.querySelectorAll("[data-plan]")];
  buttons.forEach(item => { item.disabled = true; });
  showStatus(`Preparing your ${PLAN_NAMES[plan] || "plan"} upgrade…`, "pending");

  try {
    const response = await api("/api/payments/payfast/checkout", {
      method: "POST",
      body: JSON.stringify({ plan })
    });
    const form = document.createElement("form");
    form.method = "POST";
    form.action = response.action;
    form.style.display = "none";
    Object.entries(response.fields || {}).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  } catch (error) {
    showStatus(error.message, "error");
    buttons.forEach(item => { item.disabled = false; });
    if (button) button.focus();
  }
}

async function handlePaymentReturn(user, pricing) {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const plan = (params.get("plan") || "").toLowerCase();
  if (status === "cancelled") {
    showStatus("Payment was cancelled. Your current plan was not changed.", "pending");
    return;
  }
  if (status !== "success") return;

  showStatus(`Payment submitted for ${PLAN_NAMES[plan] || "your selected plan"}. Confirming activation…`, "pending");
  try {
    const fresh = await api("/api/auth/me", { method: "GET" });
    if (fresh.authenticated && fresh.user) {
      showAccount(fresh.user);
      renderPlans(fresh.user, pricing);
      if (currentPlanKey(fresh.user) === plan) showStatus(`${PLAN_NAMES[plan] || "Plan"} is active. Upgrade complete.`, "success");
      else showStatus("Payment was submitted. PayFast activation is still being confirmed; refresh this page in a moment.", "pending");
    }
  } catch (error) {
    showStatus("Payment was submitted. Refresh this page after PayFast confirms the payment.", "pending");
  }
}

async function init() {
  const meta = document.querySelector("#accountMeta");
  const form = document.querySelector("#deleteForm");
  const button = document.querySelector("#deleteButton");
  const error = document.querySelector("#deleteError");

  try {
    const [me, pricing] = await Promise.all([
      api("/api/auth/me", { method: "GET" }),
      api("/api/pricing", { method: "GET" })
    ]);
    if (!me.authenticated || !me.user) {
      window.location.replace("/login.html?next=/account.html");
      return;
    }
    showAccount(me.user);
    renderPlans(me.user, pricing);
    await handlePaymentReturn(me.user, pricing);
  } catch (err) {
    if (meta) meta.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    return;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    error.textContent = "";
    button.disabled = true;
    button.textContent = "Deleting account…";

    try {
      await api("/api/auth/delete", {
        method: "POST",
        body: JSON.stringify({
          password: document.querySelector("#password").value,
          confirmation: document.querySelector("#confirmation").value
        })
      });
      window.location.replace("/?account_deleted=1");
    } catch (err) {
      error.textContent = err.message;
      button.disabled = false;
      button.textContent = "Delete my account";
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

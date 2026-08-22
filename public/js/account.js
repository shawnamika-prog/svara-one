const PLAN_ORDER = ["free", "starter", "creator", "pro", "studio"];
const PLAN_NAMES = { free: "Free", starter: "Starter", creator: "Creator", pro: "Pro", studio: "Studio" };
const PLAN_FEATURES = {
  free: ["3 voices", "MP3 download", "Try the full workflow"],
  starter: ["10 voices", "MP3 download", "Commercial use"],
  creator: ["20 voices", "MP3 download", "Commercial use", "Premium voice collection"],
  pro: ["Full voice library", "MP3 download", "Commercial use", "Priority generation"],
  studio: ["Full voice library", "MP3 download", "Commercial use", "Built for high-volume creation"]
};
const FREE_PLAN = { price: 0, period: "once-off", credits: 5000 };

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

function planConfig(plan, pricing) {
  if (plan === "free") return FREE_PLAN;
  return pricing.plans?.[plan] || null;
}

function renderBrand() {
  return `<span class="brand-svara">Svara</span><span class="brand-one">ONE</span>`;
}

function renderPlans(user, pricing) {
  const grid = document.querySelector("#planGrid");
  const note = document.querySelector("#upgradeNote");
  if (!grid) return;

  const current = currentPlanKey(user);
  const currentIndex = PLAN_ORDER.indexOf(current);
  const currentPrice = currentPlanPrice(user, pricing);

  grid.innerHTML = PLAN_ORDER.map(plan => {
    const config = planConfig(plan, pricing);
    if (!config) return "";

    const planIndex = PLAN_ORDER.indexOf(plan);
    const isCurrent = plan === current;
    const isUpgrade = planIndex > currentIndex;
    const isFree = plan === "free";
    const popular = plan === "creator" ? `<div class="tag">MOST POPULAR</div>` : "";
    const features = PLAN_FEATURES[plan] || [];
    const creditText = `${Number(config.credits).toLocaleString()} ${renderBrand()} Credits / ${isFree ? "once-off" : "month"}`;

    let action;
    if (isCurrent) {
      action = `<button class="ghost button full current-plan" type="button" disabled>Current plan</button>`;
    } else if (isFree) {
      action = `<a class="ghost button full" href="/signup.html">Get started</a>`;
    } else if (isUpgrade) {
      action = `<button class="${plan === "creator" ? "button" : "ghost button"} full" type="button" data-plan="${plan}">Choose ${escapeHtml(PLAN_NAMES[plan])}</button>`;
    } else {
      action = `<button class="ghost button full current-plan" type="button" disabled>Unavailable</button>`;
    }

    return `
      <article${plan === "creator" ? ` class="popular"` : ""}>
        ${popular}
        <h3>${escapeHtml(PLAN_NAMES[plan])}</h3>
        <div class="price">$${money(config.price)} <small>/ ${escapeHtml(config.period || (isFree ? "once-off" : "year"))}</small></div>
        <b>${creditText}</b>
        <ul>${features.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
        ${action}
      </article>`;
  }).join("");

  grid.querySelectorAll("[data-plan]").forEach(button => {
    button.addEventListener("click", () => beginUpgrade(button.dataset.plan));
  });

  if (note) {
    note.textContent = current === "free"
      ? "You're on the Free plan. Choosing a paid plan starts a new annual subscription."
      : "Upgrades are charged only for the difference between your current annual plan and the selected plan.";
  }
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

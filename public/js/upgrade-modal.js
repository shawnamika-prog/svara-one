(() => {
  let modal = null;

  const PLAN_NAMES = { free: "Free", starter: "Starter", creator: "Creator", pro: "Pro", studio: "Studio" };
  const PLAN_ORDER = ["free", "starter", "creator", "pro", "studio"];

  function money(value) {
    return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[char]));
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      if (modal && !modal.classList.contains("show")) {
        modal.remove();
        modal = null;
      }
    }, 160);
  }

  function buildModal(currentPlan, targetPlan, currentPrice, targetPrice, difference, targetCredits) {
    const currentName = PLAN_NAMES[currentPlan] || currentPlan;
    const targetName = PLAN_NAMES[targetPlan] || targetPlan;
    const isFree = currentPlan === "free";

    modal = document.createElement("div");
    modal.className = "upgrade-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "upgradeModalTitle");
    modal.innerHTML = `
      <div class="upgrade-modal-backdrop" data-modal-close></div>
      <section class="upgrade-modal-card">
        <button class="upgrade-modal-close" type="button" aria-label="Close" data-modal-close>×</button>
        <div class="eyebrow">PLAN UPGRADE</div>
        <h2 id="upgradeModalTitle">Upgrade to ${escapeHtml(targetName)}</h2>
        <p class="upgrade-modal-lead">Review your plan change before continuing to PayFast.</p>

        <div class="upgrade-modal-plans">
          <div class="upgrade-modal-plan">
            <span>Current plan</span>
            <strong>${escapeHtml(currentName)}</strong>
            <small>${isFree ? "$0 / once-off" : `$${money(currentPrice)} / year`}</small>
          </div>
          <div class="upgrade-modal-arrow">→</div>
          <div class="upgrade-modal-plan selected">
            <span>New plan</span>
            <strong>${escapeHtml(targetName)}</strong>
            <small>$${money(targetPrice)} / year</small>
          </div>
        </div>

        <div class="upgrade-modal-total">
          <div>
            <span>${isFree ? "Annual subscription" : "Upgrade difference"}</span>
            <strong>$${money(difference)} / year</strong>
          </div>
          <p>${Number(targetCredits).toLocaleString("en-US")} SvaraONE Credits / month</p>
        </div>

        <p class="upgrade-modal-note">You will be taken to PayFast to complete the payment. Your plan changes only after PayFast confirms the payment.</p>

        <div class="upgrade-modal-actions">
          <button class="ghost button" type="button" data-modal-close>Cancel</button>
          <button class="button" type="button" id="upgradeModalContinue">Continue to PayFast</button>
        </div>
      </section>`;

    document.body.appendChild(modal);
    document.body.classList.add("modal-open");

    modal.querySelectorAll("[data-modal-close]").forEach(button => button.addEventListener("click", closeModal));
    modal.querySelector("#upgradeModalContinue").addEventListener("click", () => {
      const continueButton = modal.querySelector("#upgradeModalContinue");
      continueButton.disabled = true;
      continueButton.textContent = "Opening PayFast…";
      closeModal();
      if (typeof window.beginUpgrade === "function") window.beginUpgrade(targetPlan);
    });

    requestAnimationFrame(() => {
      modal.classList.add("show");
      modal.querySelector("#upgradeModalContinue")?.focus();
    });
  }

  async function openModal(targetPlan) {
    try {
      const [meResponse, pricingResponse] = await Promise.all([
        fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/pricing", { cache: "no-store" })
      ]);
      const me = await meResponse.json();
      const pricing = await pricingResponse.json();
      if (!me.authenticated || !me.user) {
        window.location.replace(`/login.html?next=${encodeURIComponent("/account.html")}`);
        return;
      }

      const currentPlan = String(me.user?.subscription?.plan || "free").toLowerCase();
      const currentPrice = currentPlan === "free" ? 0 : Number(pricing.plans?.[currentPlan]?.price || 0);
      const target = pricing.plans?.[targetPlan];
      if (!target) throw new Error("Plan pricing is unavailable.");
      const targetPrice = Number(target.price || 0);
      const difference = Math.max(0, targetPrice - currentPrice);

      if (PLAN_ORDER.indexOf(targetPlan) <= PLAN_ORDER.indexOf(currentPlan)) {
        return;
      }

      buildModal(currentPlan, targetPlan, currentPrice, targetPrice, difference, Number(target.credits || 0));
    } catch (error) {
      const status = document.querySelector("#status");
      if (status) {
        status.textContent = error.message || "Unable to load upgrade details.";
        status.className = "status show error";
      }
    }
  }

  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-plan]");
    if (!button || button.closest(".upgrade-modal")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openModal(String(button.dataset.plan || "").toLowerCase());
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal) closeModal();
  });
})();

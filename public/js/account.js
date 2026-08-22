async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function showAccount(user) {
  const meta = document.querySelector("#accountMeta");
  if (!meta) return;
  const subscription = user.subscription;
  meta.innerHTML = `
    <div class="row"><span class="label">Email</span><strong>${escapeHtml(user.email)}</strong></div>
    <div class="row"><span class="label">Plan</span><strong>${escapeHtml(subscription?.plan || "Free")}</strong></div>
    <div class="row"><span class="label">Credits</span><strong>${Number(user.credits || 0).toLocaleString()}</strong></div>
    <div class="row"><span class="label">Voices</span><strong>${Array.isArray(user.voices) ? user.voices.length : 0}</strong></div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[char]));
}

async function init() {
  const meta = document.querySelector("#accountMeta");
  const form = document.querySelector("#deleteForm");
  const button = document.querySelector("#deleteButton");
  const error = document.querySelector("#deleteError");

  try {
    const data = await api("/api/auth/me", { method: "GET" });
    if (!data.authenticated || !data.user) {
      window.location.replace("/login.html?next=/account.html");
      return;
    }
    showAccount(data.user);
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

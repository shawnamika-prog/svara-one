(() => {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const isStudio = path.endsWith('/studio') || path.endsWith('/studio.html');
  const isAccount = path.endsWith('/account.html');

  const footer = document.createElement('footer');
  footer.className = isStudio || isAccount ? 'svara-footer svara-footer-app' : 'svara-footer';

  if (isStudio || isAccount) {
    footer.innerHTML = `
      <div class="svara-footer-inner">
        <span>© <span data-footer-year></span> SVARA ONE (Pty) Ltd</span>
        <nav aria-label="Footer">
          <a href="/">Home</a>
          <a href="/studio">Studio</a>
          <a href="/account.html">Account</a>
          <a href="/billing.html">Billing</a>
          <span class="svara-footer-separator" aria-hidden="true">·</span>
          <span class="svara-footer-muted">Company · Support · Legal</span>
        </nav>
      </div>`;
  } else {
    footer.innerHTML = `
      <div class="svara-footer-main">
        <div class="svara-footer-brand">
          <strong>Svara<span>ONE</span></strong>
          <p>Engineered Intelligence. Human Orchestration.</p>
        </div>
        <div class="svara-footer-links">
          <div><h3>PRODUCT</h3><a href="/studio">Voice Studio</a><a href="/studio#voices">Voice Library</a><a href="/#workflow">How it works</a><a href="/#pricing">Pricing</a></div>
          <div><h3>ACCOUNT</h3><a href="/login.html">Sign in</a><a href="/signup.html">Get started</a><a href="/account.html">Account</a><a href="/billing.html">Billing</a></div>
          <div><h3>COMPANY</h3><span>About SvaraONE</span><span>Vision</span><span>Mission</span><span>Philosophy</span></div>
          <div><h3>SUPPORT &amp; LEGAL</h3><span>Help Centre</span><span>Contact Support</span><span>Terms of Use</span><span>Privacy Policy</span></div>
        </div>
      </div>
      <div class="svara-footer-bottom">
        <span>© <span data-footer-year></span> SVARA ONE (Pty) Ltd. All rights reserved.</span>
      </div>`;
  }

  footer.querySelector('[data-footer-year]').textContent = new Date().getFullYear();
  document.body.appendChild(footer);
})();

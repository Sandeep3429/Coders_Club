/**
 * Failure Page Controller for fail.html
 * Handles error reason parsing and retry navigation per GetPay doc.
 */
(function () {
  if (window.top !== window.self) {
    window.top.location = window.self.location.href;
    return;
  }

  const params = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, "?"));
  let reason = params.get("reason") || params.get("message") || params.get("error");
  const token = params.get("token") || params.get("tokenInfo");

  if (token) {
    try {
      const payload = JSON.parse(atob(token));
      reason = payload.remarks || payload.message || payload.status || reason;
    } catch (e) {
      console.warn("Could not decode failure token:", e);
    }
  }

  if (!reason) {
    reason = "Transaction was declined or cancelled.";
  }

  const reasonEl = document.getElementById("failReason");
  if (reasonEl) {
    reasonEl.innerText = "Reason: " + reason;
  }
})();

/**
 * AFT Fail Controller — js/aft-fail.js
 * Populates the AFT fail block in fail.html when ?flow=aft is detected.
 */
(function () {
  if (window.top !== window.self) {
    window.top.location = window.self.location.href;
    return;
  }

  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = 'Transfer Failed – GetPay AFT';

  var params     = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, '?'));
  var rawReason  = params.get('reason') || params.get('message') || params.get('error') || '';
  var token      = params.get('token')  || params.get('tokenInfo');

  if (token) {
    try {
      var payload = JSON.parse(atob(token));
      rawReason = payload.remarks || payload.message || payload.status || rawReason;
    } catch (e) {}
  }

  var REASON_MAP = {
    'amount_mismatch':    'The verified amount did not match the requested transfer amount.',
    'amount':             'The verified amount did not match the expected amount.',
    'verification_error': 'We could not verify your transaction with the payment server.',
    'verification':       'We could not verify your transaction with the payment server.',
    'cancelled':          'The transfer was cancelled before it was completed.',
    'declined':           'The transfer was declined by the issuing institution.'
  };

  var friendlyReason = REASON_MAP[rawReason.toLowerCase()]
    || (rawReason ? decodeURIComponent(rawReason) : null)
    || 'The account fund transfer could not be completed.';

  var el = document.getElementById('aft-failReason');
  if (el) el.innerText = 'Reason: ' + friendlyReason;

  // Clean up leftover session data
  sessionStorage.removeItem('aft_ctx');
  sessionStorage.removeItem('aft_txid');
})();

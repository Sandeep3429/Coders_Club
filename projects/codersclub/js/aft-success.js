/**
 * AFT Success Controller — js/aft-success.js
 * Populates the AFT receipt block in success.html when ?flow=aft is detected.
 * Reads context from sessionStorage (written by aft.html) and URL params.
 * Clears sensitive session data after display.
 */
(function () {
  if (window.top !== window.self) {
    window.top.location = window.self.location.href;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const verified = params.get('verified') === 'true';

  if (!verified) {
    window.location.href = 'aft.html';
    return;
  }

  // Update page title
  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = 'Transfer Successful – GetPay AFT';

  // Recover context from sessionStorage
  var ctx = {};
  try { ctx = JSON.parse(sessionStorage.getItem('aft_ctx') || '{}'); } catch (e) {}

  var txid        = params.get('txid') || sessionStorage.getItem('aft_txid') || 'N/A';
  var amt         = ctx.amount   || parseFloat(params.get('amt'))  || 0;
  var cur         = ctx.currency || params.get('cur') || 'USD';
  var senderName  = ctx.senderName    || '—';
  var senderAcct  = ctx.senderAcct    ? ('•••• ' + String(ctx.senderAcct).slice(-4))    : '—';
  var recipName   = ctx.recipientName || '—';
  var recipAcct   = ctx.recipientAcct ? ('•••• ' + String(ctx.recipientAcct).slice(-4)) : '—';
  var displayAmt  = ctx.displayAmount || (cur + '\u00a0' + Number(amt).toLocaleString('en-US', { minimumFractionDigits: 2 }));
  var dateStr     = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  function set(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
  }

  set('aft-receipt-txid',          txid);
  set('aft-receipt-date',          dateStr);
  set('aft-receipt-sender',        senderName);
  set('aft-receipt-sender-acct',   senderAcct);
  set('aft-receipt-recipient',     recipName);
  set('aft-receipt-recipient-acct', recipAcct);
  set('aft-receipt-total',         displayAmt);
  set('aft-status-badge',          'Transfer Verified \u2022 SUCCESS');

  // Record to local ledger
  try {
    var stored = localStorage.getItem('transactions');
    var txns   = stored ? JSON.parse(stored) : [];
    var exists = txns.some(function (t) { return t.id === txid; });
    if (!exists) {
      txns.unshift({
        date:   new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        id:     txid,
        amount: Number(amt),
        type:   'AFT',
        status: 'Completed'
      });
      localStorage.setItem('transactions', JSON.stringify(txns));
    }
  } catch (e) {}

  // Clear sensitive session data
  sessionStorage.removeItem('aft_ctx');
  sessionStorage.removeItem('aft_txid');
})();

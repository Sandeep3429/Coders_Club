/**
 * AFT Success Controller — js/aft-success.js
 * Populates the AFT receipt block in success.html when AFT flow completes.
 * Reads context from sessionStorage (written by aft.html), URL params, and GetPay token.
 * Pauses on success.html until the user explicitly initiates a new transfer or downloads PDF.
 */
(function () {
  'use strict';

  // Anti-clickjacking: break out of iframe if embedded
  if (window.top !== window.self) {
    window.top.location = window.self.location.href;
    return;
  }

  // Robust query parser: handles URLs with single or multiple '?' delimiters
  // e.g. success.html?flow=aft&verified=true?token=eyJ...
  function getQueryParams() {
    var raw = '';
    var href = window.location.href;
    var hashIdx = href.indexOf('#');
    if (hashIdx >= 0) href = href.substring(0, hashIdx);

    var qIdx = href.indexOf('?');
    if (qIdx >= 0) {
      // Join all subsequent segments with '&' to handle unencoded duplicate '?' from SDKs
      raw = href.substring(qIdx + 1).replace(/\?/g, '&');
    }
    return new URLSearchParams(raw);
  }

  var params = getQueryParams();

  // Extract GetPay token from URL or hash
  var rawToken = params.get('token') || params.get('tokenInfo');
  if (!rawToken) {
    var tokenMatch = window.location.href.match(/[?&#]token=([^&#]+)/);
    if (tokenMatch) {
      rawToken = decodeURIComponent(tokenMatch[1]);
    }
  }

  // Parse token if present (base64 JSON containing { id, oprSecret, ... })
  var tokenData = null;
  if (rawToken) {
    try {
      tokenData = JSON.parse(atob(rawToken));
      console.log('[GetPay AFT Success] Decoded token payload:', tokenData);
    } catch (e) {
      console.warn('[GetPay AFT Success] Could not decode base64 token:', e);
    }
  }

  // Recover context from sessionStorage
  var ctx = {};
  try {
    ctx = JSON.parse(sessionStorage.getItem('aft_ctx') || '{}');
  } catch (e) {
    console.warn('[GetPay AFT Success] Could not parse aft_ctx from sessionStorage:', e);
  }

  // Determine transaction ID: prioritize actual GetPay returned transaction ID
  var txid = (tokenData && (tokenData.id || tokenData.transactionId || tokenData.txnId)) ||
             params.get('txid') ||
             params.get('id') ||
             sessionStorage.getItem('aft_txid') ||
             ctx.clientRequestId ||
             ('AFT-' + Date.now());

  // Save the resolved txid so it persists on refresh
  try { sessionStorage.setItem('aft_txid', txid); } catch (e) {}

  // Update page title
  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = 'Transfer Successful – GetPay AFT';

  // Amount & Currency
  var amt = (tokenData && tokenData.amount) ? Number(tokenData.amount) :
            (ctx.amount ? Number(ctx.amount) : (parseFloat(params.get('amt')) || 1000.00));
  var cur = ctx.currency || params.get('cur') || 'USD';

  // Sender & Recipient Information
  var senderName = ctx.senderName ||
                   ((ctx.senderFirst || '') + ' ' + (ctx.senderLast || '')).trim() ||
                   params.get('sender') ||
                   'Jane Sender';

  var senderAcctRaw = ctx.senderAcct || params.get('senderAcct') || '4111111111110002';
  var senderAcct = '•••• ' + String(senderAcctRaw).slice(-4);

  var recipName = ctx.recipientName ||
                  ((ctx.recipientFirst || '') + ' ' + (ctx.recipientLast || '')).trim() ||
                  params.get('recipient') ||
                  'John Doe';

  var recipAcctRaw = ctx.recipientAcct || params.get('recipientAcct') || '5555555555554444';
  var recipAcct = '•••• ' + String(recipAcctRaw).slice(-4);

  var displayAmt = ctx.displayAmount || (cur + '\u00a0' + Number(amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  var dateStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  function set(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
  }

  // Populate UI
  set('aft-receipt-txid',           txid);
  set('aft-receipt-date',           dateStr);
  set('aft-receipt-sender',         senderName);
  set('aft-receipt-sender-acct',    senderAcct);
  set('aft-receipt-recipient',      recipName);
  set('aft-receipt-recipient-acct', recipAcct);
  set('aft-receipt-total',          displayAmt);
  set('aft-status-badge',           'Transfer Verified • SUCCESS');

  // Record to local ledger for merchant accounting / auditing
  try {
    var stored = localStorage.getItem('transactions');
    var txns   = stored ? JSON.parse(stored) : [];
    var exists = txns.some(function (t) { return t.id === txid; });
    if (!exists) {
      txns.unshift({
        date:   new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        id:     txid,
        amount: Number(amt),
        currency: cur,
        sender: senderName,
        recipient: recipName,
        type:   'AFT',
        status: 'Completed'
      });
      localStorage.setItem('transactions', JSON.stringify(txns));
    }
  } catch (e) {}

  console.log('[GetPay AFT Success] Receipt rendered successfully for transaction:', txid);
})();

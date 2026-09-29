/**
 * AFT Payment Controller — js/aft-payment.js
 * Handles the payment.html?flow=aft branch.
 * Reads AFT session context from sessionStorage (written by aft.html).
 * Uses GetPayAftConfig from getpay-config.js.
 *
 * Security:
 *  - Sender/recipient data travels only via sessionStorage (tab-scoped, never in URL).
 *  - sessionStorage key 'aft_ctx' is cleared after success.html renders.
 *  - papInfo is NOT a secret — it is an opaque merchant reference.
 */
(function () {
  if (window.top !== window.self) {
    window.top.location = window.self.location.href;
    return;
  }

  const aftCfg = window.GetPayAftConfig;
  if (!aftCfg) {
    console.error('[AFT] GetPayAftConfig not found. Ensure getpay-config.js is loaded first.');
    return;
  }

  // Recover AFT context set by aft.html before redirect
  let ctx = {};
  try { ctx = JSON.parse(sessionStorage.getItem('aft_ctx') || '{}'); } catch (e) {}

  if (!ctx.amount || !ctx.currency) {
    const errBox = document.getElementById('error-box');
    if (errBox) {
      errBox.textContent = 'AFT session expired or missing. Please go back and retry the transfer.';
      errBox.style.display = 'block';
    }
    const loader = document.getElementById('checkout-loader');
    if (loader) loader.style.display = 'none';
    console.error('[AFT] aft_ctx missing from sessionStorage.');
    return;
  }

  function removeLoader() {
    const loader = document.getElementById('checkout-loader');
    if (loader) loader.style.display = 'none';
  }

  function waitForGetPay(cb, attempts) {
    attempts = attempts || 0;
    if (typeof window.GetPay !== 'undefined') { cb(); return; }
    if (attempts > 30) {
      removeLoader();
      const errBox = document.getElementById('error-box');
      if (errBox) { errBox.textContent = 'GetPay SDK did not load. Check network / AdBlock.'; errBox.style.display = 'block'; }
      return;
    }
    setTimeout(function () { waitForGetPay(cb, attempts + 1); }, 400);
  }

  window.addEventListener('load', function () {
    waitForGetPay(function () {
      const callbacks = aftCfg.getCallbackUrls();

      const options = {
        clientRequestId: ctx.clientRequestId || ('AFT-' + Date.now()),
        papInfo:         aftCfg.PAP_INFO,
        oprKey:          aftCfg.OPR_KEY,
        insKey:          aftCfg.INS_KEY,
        price:           ctx.amount,
        currency:        ctx.currency,
        businessName:    'GetPay AFT',
        imageUrl:        (window.GetPayConfig && window.GetPayConfig.getImageUrl('img/java.png')) || '',
        baseUrl:         aftCfg.BASE_URL,
        websiteDomain:   window.location.origin,
        callbackUrl: {
          successUrl: callbacks.successUrl,
          failUrl:    callbacks.failUrl
        },
        userInfo: {
          name:    ctx.senderName    || '',
          email:   '',
          state:   ctx.senderAdminArea || '',
          country: ctx.senderCountry  || 'NP',
          zipcode: ctx.senderPostal   || '',
          city:    ctx.senderCity     || '',
          address: ctx.senderAddress  || ''
        },
        prefill: { name: false, email: false, state: false, city: false, address: false },

        // AFT-specific flags
        aft:         true,
        paymentType: 'ACCOUNT_FUND_TRANSFER',
        BAI:         [ctx.bai || aftCfg.BAI],

        senderInformation: {
          account: {
            number:      ctx.senderAcct || '',
            fundsSource: aftCfg.FUNDS_SOURCE  // passed silently in background
          },
          firstName:            ctx.senderFirst     || '',
          lastName:             ctx.senderLast      || '',
          postalCode:           ctx.senderPostal    || '',
          phoneNumber:          ctx.senderPhone     || '',
          address1:             ctx.senderAddress   || '',
          locality:             ctx.senderCity      || '',
          countryCode:          ctx.senderCountry   || 'NP',
          identificationNumber: '',
          personalIdType:       '',
          administrativeArea:   ctx.senderAdminArea || '',
          type:                 'individual',
          name:                 ctx.senderName      || '',
          referenceNumber:      'SENDER-REF-' + Date.now()
        },

        recipientInformation: {
          accountId:   ctx.recipientAcct    || '',
          accountType: aftCfg.ACCOUNT_TYPE,         // passed silently in background
          firstName:   ctx.recipientFirst   || '',
          lastName:    ctx.recipientLast    || '',
          locality:    ctx.recipientCity    || '',
          country:     ctx.recipientCountry || 'NP',
          postalCode:  ctx.recipientPostal  || ''
        },

        orderInformationUI: ctx.orderInfoHtml || '',
        orderInformation: {
          orderId:     ctx.clientRequestId || ('AFT-' + Date.now()),
          orderDate:   new Date().toISOString().split('T')[0],
          orderStatus: ''
        },
        themeColor: '#1a56db',

        onSuccess: function (res) {
          console.log('[AFT] SDK onSuccess:', res);
          removeLoader();
          const tid = (res && (res.transactionId || res.id || res.txnId)) || '';
          // Store txid so success.html can display it
          try { sessionStorage.setItem('aft_txid', tid); } catch (e) {}
          const base = callbacks.successUrl;
          window.location.href = tid ? (base + '&txid=' + encodeURIComponent(tid)) : base;
        },
        onError: function (err) {
          console.error('[AFT] SDK onError:', err);
          removeLoader();
          const errBox = document.getElementById('error-box');
          if (errBox) {
            errBox.textContent = 'Transfer failed: ' + (err && err.message ? err.message : String(err));
            errBox.style.display = 'block';
          }
        }
      };

      console.log('[AFT aft-payment.js] options:', options);

      try {
        const gp = new window.GetPay(options);
        if (typeof gp.initialize === 'function') {
          gp.initialize();
        } else if (typeof gp.init === 'function') {
          gp.init();
        }
        setTimeout(removeLoader, 1500);
      } catch (e) {
        console.error('[AFT] Init exception:', e);
        removeLoader();
        const errBox = document.getElementById('error-box');
        if (errBox) { errBox.textContent = 'AFT init failed: ' + e.message; errBox.style.display = 'block'; }
      }
    });
  });
})();

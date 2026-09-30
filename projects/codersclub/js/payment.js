/**
 * Payment Checkout Controller for payment.html
 * Integrates with NCHL GetPay per https://getpay.global/web-integration/
 */
(function () {
  // Break out of iframe if loaded inside a frame
  if (window.top !== window.self) {
    window.top.location = window.self.location.href;
    return;
  }

  // If a bank token is detected in URL, redirect directly to success.html
  const urlParams = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, "?"));
  const token = urlParams.get("token") || urlParams.get("tokenInfo");
  if (token) {
    window.location.href = "success.html" + window.location.search + (window.location.hash || "");
    return;
  }

  const config = window.GetPayConfig;
  if (!config) {
    console.error("GetPayConfig is missing.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("courseId") || "oracle-plsql";
  const courseData = config.getCourseData(courseId);
  // Total amount paid by the user (inclusive of 3.5% fee, e.g. 6500.00)
  const totalAmount = parseFloat(params.get("amount")) || courseData.price;
  const feeRate = 0.035;
  const feeAmount = parseFloat((totalAmount * feeRate).toFixed(2)); // 227.50
  const netAmount = parseFloat((totalAmount - feeAmount).toFixed(2)); // 6272.50 (sum = 6500.00)

  // Persist expected course & amount breakdown for receipts
  localStorage.setItem("getpay_expected_course", courseId);
  localStorage.setItem("getpay_base_amount", netAmount);
  localStorage.setItem("getpay_fee_amount", feeAmount.toFixed(2));
  localStorage.setItem("getpay_expected_amount", totalAmount);

  // Persist email & cardholder if present in URL
  const userEmail = params.get("email") || localStorage.getItem("getpay_user_email") || "";
  const userName = params.get("name") || params.get("cardHolderName") || localStorage.getItem("getpay_card_holder") || "";
  if (userEmail) localStorage.setItem("getpay_user_email", userEmail);
  if (userName) localStorage.setItem("getpay_card_holder", userName);

  function removeLoader() {
    const loader = document.getElementById("checkout-loader");
    if (loader && !loader.classList.contains("hidden")) {
      loader.classList.add("hidden");
      setTimeout(() => {
        if (loader) loader.style.display = "none";
      }, 220);
    }
  }

  function start() {
    const checkoutContainer = document.getElementById("checkout");
    if (checkoutContainer) {
      // Capture cardholder inputs dynamically
      checkoutContainer.addEventListener("input", (e) => {
        const target = e.target;
        if (!target) return;
        const attr = (target.name || target.id || target.placeholder || "").toLowerCase();
        if (attr.includes("name") || attr.includes("holder")) {
          if (target.value && target.value.trim().length > 1) {
            localStorage.setItem("getpay_card_holder", target.value.trim());
          }
        } else if (attr.includes("email") || target.type === "email") {
          if (target.value && target.value.includes("@")) {
            localStorage.setItem("getpay_user_email", target.value.trim());
          }
        }
      });

      // Observer to dismiss loader the microsecond Svelte/CyberSource elements mount
      const observer = new MutationObserver(() => {
        if (checkoutContainer.children.length > 0) {
          requestAnimationFrame(removeLoader);
        }
      });
      observer.observe(checkoutContainer, { childList: true, subtree: true });
    }

    let attempts = 0;
    const pollIntervalMs = 20; // 20ms polling interval for zero-friction readiness detection
    const maxAttempts = 400;   // 400 x 20ms = 8 seconds max wait
    let hasInitialized = false;

    // Payment initialization comment / surcharge disclosure
    const paymentComment = "Added 3.5% surcharge and Powered by Laxmi Sunrise Bank Limited";

    // Freshly generate orderInformationUI with itemized 3.5% convenience fee breakdown (summing to 6500.00)
    const orderInformationUI = config.createOrderInformationUI(courseData, totalAmount, paymentComment);
    localStorage.setItem("getpay_order_ui", orderInformationUI);

    const callbacks = config.getCallbackUrls();
    const verifiedImageUrl = config.getImageUrl(courseData.imageUrl);

    // Compute dynamic 3.5% fee identifier (safe string format, e.g. ORD-1727712345678-F35_227_50)
    const feeTag = feeAmount.toFixed(2).replace(".", "_");
    const clientRequestId = `ORD-${Date.now()}-F35_${feeTag}`;

    // Persist identifier and calculated fee for receipts and downstream verification
    localStorage.setItem("getpay_client_request_id", clientRequestId);
    localStorage.setItem("getpay_payment_comment", paymentComment);

    const options = {
      userInfo: {
        name: userName,
        email: userEmail,
        state: "",
        country: "",
        zipcode: "",
        city: "",
        address: ""
      },
      clientRequestId: clientRequestId,
      clientRemarks: paymentComment,
      papInfo: config.PAP_INFO,
      oprKey: config.OPR_KEY,
      insKey: config.INS_KEY,
      websiteDomain: config.WEBSITE_DOMAIN,
      allowBillingAddressFields: true,
      price: Number(totalAmount),
      businessName: courseData.name,
      imageUrl: verifiedImageUrl,
      orderInformationUI: orderInformationUI,
      currency: "NPR",
      prefill: {
        name: true,
        email: true,
        state: true,
        city: true,
        address: true,
        zipcode: true,
        country: true
      },
      disableFields: {
        address: false,
        state: false
      },
      themeColor: "#5662FF",
      baseUrl: config.BASE_URL,
      callbackUrl: {
        successUrl: callbacks.successUrl,
        failUrl: callbacks.failUrl
      },
      onSuccess: function (res) {
        console.log("GetPay checkout ready in payment.html:", res);
        removeLoader();
      },
      onError: function (err) {
        console.error("GetPay checkout initialization error:", err);
        removeLoader();
        const errBox = document.getElementById("error-box");
        if (errBox) {
          let msg = "Payment checkout failed to load. Please check credentials or network.";
          if (typeof err === "string") msg += " (" + err + ")";
          else if (err && err.message) msg += " (" + err.message + ")";
          errBox.textContent = msg;
          errBox.style.display = "block";
        }
      }
    };

    function launchDirectInitialization() {
      if (hasInitialized) return;
      hasInitialized = true;

      options.baseUrl = config.BASE_URL;
      options.onSuccess = function (res) {
        console.log("GetPay direct session initialization success:", res);
        const mountEl = document.getElementById("checkout");
        if (!mountEl || mountEl.children.length === 0) {
          // One seamless reload to let Svelte App mount with the freshly created session
          window.location.replace(window.location.href);
        } else {
          removeLoader();
        }
      };

      try {
        if (typeof window.GetPay === "function") {
          const gp = new window.GetPay(options, config.BASE_URL);
          if (typeof gp.initialize === "function") {
            gp.initialize();
          } else if (typeof gp.init === "function") {
            gp.init();
          }
        } else if (window.getpay && typeof window.getpay.initialize === "function") {
          window.getpay.initialize(options, config.BASE_URL);
        }

        setTimeout(removeLoader, 3000);
      } catch (e) {
        console.error("Direct payment initialization exception:", e);
        removeLoader();
      }
    }

    function monitorAndInit() {
      if (hasInitialized) return;

      const checkoutEl = document.getElementById("checkout");
      const hasSdk = typeof window.GetPay === "function" || (window.getpay && typeof window.getpay.initialize === "function");

      // Path 1 (Official flow from getpay.html):
      // If Svelte's App bundle mounted elements into #checkout using the session from Page 1
      if (checkoutEl && checkoutEl.children.length > 0) {
        console.log("GetPay card checkout form active from pre-initialized session.");
        hasInitialized = true;
        removeLoader();
        return;
      }

      attempts++;

      // Give Svelte bundle up to 300ms (15 attempts x 20ms) to mount from existing session
      if (attempts < 15) {
        setTimeout(monitorAndInit, pollIntervalMs);
        return;
      }

      // Path 2 (Direct arrival without Page 1 session):
      // If checkout is still empty after 300ms and SDK is ready, initialize directly
      if (hasSdk) {
        launchDirectInitialization();
        return;
      }

      // If SDK is still downloading over slow connection, keep polling
      if (attempts < maxAttempts) {
        setTimeout(monitorAndInit, pollIntervalMs);
      } else {
        console.error("GetPay SDK bundle failed to load.");
        removeLoader();
        const errBox = document.getElementById("error-box");
        if (errBox) {
          errBox.textContent = "GetPay Checkout SDK could not be loaded. Please check your internet connection or disable AdBlock.";
          errBox.style.display = "block";
        }
      }
    }

    monitorAndInit();
  }

  // Ensure immediate execution whether DOM is already loaded or still loading
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
    window.addEventListener("load", start);
  } else {
    start();
  }
})();

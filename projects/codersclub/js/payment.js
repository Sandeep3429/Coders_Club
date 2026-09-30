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
  const amount = parseFloat(params.get("amount")) || courseData.price;

  // Persist expected course & amount
  localStorage.setItem("getpay_expected_course", courseId);
  localStorage.setItem("getpay_expected_amount", amount);

  // Persist email & cardholder if present in URL
  const userEmail = params.get("email") || localStorage.getItem("getpay_user_email") || "";
  const userName = params.get("name") || params.get("cardHolderName") || localStorage.getItem("getpay_card_holder") || "";
  if (userEmail) localStorage.setItem("getpay_user_email", userEmail);
  if (userName) localStorage.setItem("getpay_card_holder", userName);

  function removeLoader() {
    const loader = document.getElementById("checkout-loader");
    if (loader) {
      loader.style.display = "none";
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
    }

    let attempts = 0;
    const maxAttempts = 150; // up to 15 seconds (150 x 100ms)

    function initGetPay() {
      attempts++;
      if (typeof window.GetPay === "undefined" && typeof window.getpay === "undefined") {
        if (attempts < maxAttempts) {
          setTimeout(initGetPay, 100);
        } else {
          console.error("GetPay SDK bundle failed to load.");
          removeLoader();
          const errBox = document.getElementById("error-box");
          if (errBox) {
            errBox.textContent = "GetPay Checkout SDK could not be loaded. Please check your internet connection or disable AdBlock.";
            errBox.style.display = "block";
          }
        }
        return;
      }

      // Check if GetPay checkout already mounted
      if (checkoutContainer && checkoutContainer.querySelectorAll("iframe, form, div.checkout-root").length > 0) {
        console.log("GetPay checkout already rendered automatically by bundle.");
        removeLoader();
        return;
      }

      // Payment initialization comment / surcharge disclosure
      const paymentComment = "Added 3.5% surcharge and Powered by Laxmi Sunrise Bank Limited";

      // Freshly generate orderInformationUI matching the exact course, amount, and surcharge notice
      const orderInformationUI = config.createOrderInformationUI(courseData, amount, paymentComment);
      localStorage.setItem("getpay_order_ui", orderInformationUI);

      const callbacks = config.getCallbackUrls();
      const verifiedImageUrl = config.getImageUrl(courseData.imageUrl);

      // Compute dynamic 3.5% fee identifier (safe string format, e.g. ORD-1727712345678-F35_227_50)
      const feeRate = 0.035;
      const feeAmount = (amount * feeRate).toFixed(2);
      const feeTag = feeAmount.replace(".", "_");
      const clientRequestId = `ORD-${Date.now()}-F35_${feeTag}`;

      // Persist identifier and calculated fee for receipts and downstream verification
      localStorage.setItem("getpay_client_request_id", clientRequestId);
      localStorage.setItem("getpay_fee_amount", feeAmount);
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
        price: Number(amount),
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

      try {
        options.baseUrl = config.BASE_URL;
        if (typeof window.GetPay === "function") {
          const gp = new window.GetPay(options);
          if (typeof gp.initialize === "function") {
            gp.initialize();
          } else if (typeof gp.init === "function") {
            gp.init();
          }
        } else if (window.getpay && typeof window.getpay.initialize === "function") {
          window.getpay.initialize(options);
        }
        // Fallback: Remove loader after 2s if mount succeeded
        setTimeout(removeLoader, 2000);
      } catch (e) {
        console.error("Payment initialization exception:", e);
        removeLoader();
      }
    }

    initGetPay();
  }

  // Ensure execution on first attempt whether DOM is already loaded or still loading
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
    window.addEventListener("load", start);
  } else {
    // Already loaded or interactive: trigger immediately!
    start();
  }
})();

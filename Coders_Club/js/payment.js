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
  const courseId = params.get("courseId") || localStorage.getItem("getpay_expected_course") || "oracle-plsql";
  const courseData = config.getCourseData(courseId);
  const amount = parseFloat(params.get("amount")) || parseFloat(localStorage.getItem("getpay_expected_amount")) || courseData.price;
  const userEmail = params.get("email") || localStorage.getItem("getpay_user_email") || "zhasandeep7@gmail.com";

  window.addEventListener("load", () => {
    function initGetPay() {
      if (typeof window.GetPay === "undefined" && typeof window.getpay === "undefined") {
        setTimeout(initGetPay, 300);
        return;
      }

      const checkoutContainer = document.getElementById("checkout");
      // Check if GetPay bundle already mounted into container automatically
      if (checkoutContainer && checkoutContainer.querySelectorAll("iframe, form, div.checkout-root").length > 0) {
        console.log("GetPay checkout already rendered automatically by bundle.");
        removeLoader();
        return;
      }

      const orderInformationUI = localStorage.getItem("getpay_order_ui") || config.createOrderInformationUI(courseData, amount);
      const callbacks = config.getCallbackUrls();

      const options = {
        userInfo: {
          name: "Sandeep Kumar Jha",
          email: userEmail,
          state: "Bagmati",
          country: "Nepal",
          zipcode: "44600",
          city: "Kathmandu",
          address: "Maitidevi"
        },
        clientRequestId: "ORD-" + Date.now(),
        papInfo: config.PAP_INFO,
        oprKey: config.OPR_KEY,
        insKey: config.INS_KEY,
        websiteDomain: config.WEBSITE_DOMAIN,
        allowBillingAddressFields: true,
        price: Number(amount),
        businessName: courseData.name,
        imageUrl: courseData.imageUrl.startsWith("http")
          ? courseData.imageUrl
          : config.WEBSITE_DOMAIN + (config.WEBSITE_DOMAIN.endsWith("/") ? "" : "/") + courseData.imageUrl.replace(/^\//, ""),
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
          address: true,
          state: true
        },
        themeColor: "#5662FF",
        baseUrl: config.BASE_URL,
        callbackUrl: {
          successUrl: callbacks.successUrl,
          failUrl: callbacks.failUrl
        },
        // onSuccess in payment.html serves as the form-ready confirmation
        onSuccess: function (res) {
          console.log("GetPay checkout ready in payment.html:", res);
          removeLoader();
        },
        onError: function (err) {
          console.error("GetPay checkout initialization error:", err);
          removeLoader();
          const errBox = document.getElementById("error-box");
          if (errBox) {
            errBox.textContent = "Payment checkout failed to load. Please check credentials or network.";
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
        // Fallback: Remove loader after 1.5s if mount succeeded
        setTimeout(removeLoader, 1500);
      } catch (e) {
        console.error("Payment initialization exception:", e);
        removeLoader();
      }
    }

    function removeLoader() {
      const loader = document.getElementById("checkout-loader");
      if (loader) {
        loader.style.display = "none";
      }
    }

    initGetPay();
  });
})();

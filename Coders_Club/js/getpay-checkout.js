/**
 * Checkout logic for getpay.html
 * Integrates with NCHL GetPay per https://getpay.global/web-integration/
 */
(function () {
  const config = window.GetPayConfig;
  if (!config) {
    console.error("GetPayConfig not loaded.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("courseId") || localStorage.getItem("getpay_expected_course") || "java-mastery";
  const userEmail = params.get("email") || localStorage.getItem("getpay_user_email") || "";
  const selectedCourse = config.getCourseData(courseId);

  const statusEl = document.getElementById("integration-status");
  const btn = document.getElementById("checkout-btn");
  const btnText = document.getElementById("btn-text");

  function setStatus(text, cls = "") {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = cls;
    }
  }

  // Populate dynamic course elements
  function updateUI() {
    const titleEl = document.getElementById("header-title");
    const subtitleEl = document.getElementById("header-subtitle");
    const nameEl = document.getElementById("course-name");
    const priceEl = document.getElementById("course-price");
    const imgEl = document.getElementById("course-img");

    if (titleEl) titleEl.textContent = selectedCourse.name;
    if (subtitleEl) subtitleEl.textContent = selectedCourse.subtitle;
    if (nameEl) nameEl.textContent = selectedCourse.name;
    if (priceEl) priceEl.textContent = "Rs " + selectedCourse.price.toLocaleString("en-US", { minimumFractionDigits: 2 });
    if (imgEl) {
      imgEl.src = selectedCourse.imageUrl;
      imgEl.alt = selectedCourse.name;
    }
  }

  // Verify SDK loaded on window ready
  window.addEventListener("load", () => {
    updateUI();
    setTimeout(() => {
      if (typeof window.GetPay === "undefined" && typeof window.getpay === "undefined") {
        setStatus("GetPay bundle loading… Check internet connection if delayed.", "warn");
      } else {
        setStatus("Payment gateway connected and ready.");
      }
    }, 400);
  });

  // Handle Checkout click
  if (btn) {
    btn.onclick = function (e) {
      e.preventDefault();

      if (typeof window.GetPay === "undefined" && typeof window.getpay === "undefined") {
        alert("GetPay SDK is still initializing or blocked by an ad-blocker. Please check connection.");
        return;
      }

      btn.disabled = true;
      if (btnText) btnText.innerText = "Initializing Checkout…";

      // Persist user selection
      localStorage.setItem("getpay_expected_amount", selectedCourse.price);
      localStorage.setItem("getpay_expected_course", courseId);
      if (userEmail) localStorage.setItem("getpay_user_email", userEmail);

      const orderInformationUI = config.createOrderInformationUI(selectedCourse, selectedCourse.price);
      localStorage.setItem("getpay_order_ui", orderInformationUI);

      const callbacks = config.getCallbackUrls();
      const verifiedImageUrl = config.getImageUrl(selectedCourse.imageUrl);

      // Full GetPay Options per official specification
      const options = {
        userInfo: {
          name: "",
          email: userEmail,
          state: "",
          country: "",
          zipcode: "",
          city: "",
          address: ""
        },
        clientRequestId: "ORD-" + Date.now(),
        papInfo: config.PAP_INFO,
        oprKey: config.OPR_KEY,
        insKey: config.INS_KEY,
        websiteDomain: config.WEBSITE_DOMAIN,
        allowBillingAddressFields: true,
        price: Number(selectedCourse.price),
        businessName: selectedCourse.name,
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
        // Per GetPay documentation: onSuccess fires when internal validation succeeds -> navigate to payment page
        onSuccess: function (response) {
          console.log("GetPay validation succeeded:", response);
          setStatus("Redirecting to secure payment checkout…");
          const targetUrl = "payment.html?courseId=" + encodeURIComponent(courseId) + "&amount=" + encodeURIComponent(selectedCourse.price);
          window.location.href = targetUrl;
        },
        onError: function (error) {
          console.error("GetPay initialization error:", error);
          btn.disabled = false;
          if (btnText) btnText.innerText = "Proceed to Pay Securely";
          setStatus("Initialization failed: " + (error?.message || "Check network/credentials"), "err");
          alert("Payment initialization error. Please verify network connectivity.");
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
        } else {
          throw new Error("GetPay SDK is not available.");
        }
        setStatus("Connecting to GetPay gateway…");
      } catch (err) {
        console.error("SDK Execution Exception:", err);
        btn.disabled = false;
        if (btnText) btnText.innerText = "Proceed to Pay Securely";
        setStatus("Failed: " + err.message, "err");
        alert("Payment initialization failed: " + err.message);
      }
    };
  }
})();

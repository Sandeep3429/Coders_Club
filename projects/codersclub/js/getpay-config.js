/**
 * Centralized GetPay Integration Configuration & Helpers
 * Adheres strictly to https://getpay.global/web-integration/
 */
(function (global) {
  const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('sandeepkumarjha.com.np');

  const config = {
    // Official Credentials provided by Bank/NCHL
    PAP_INFO: "eyJpbnN0aXR1dGlvbklkIjoiMTIyIiwibWlkIjoiMTIzMTIzNDUxNzcwOTg2IiwidGlkIjoiMTIzNTg3NjIifQ==",
    OPR_KEY: "4fa4c6b9-3f91-43e5-9b4f-319f68187ba5",
    INS_KEY: "",

    // Gateways & API Endpoints
    BASE_URL: "https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions",
    STATUS_API: "https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions/merchant-status",
    STATEMENT_API: "https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions/transaction-statement",
    BUNDLE_URL: "https://minio-getpay.nchl.com.np/getpay-cdn/webcheckout/v5/bundle.js",

    // Website Domain - must match callbackUrl host per GetPay documentation
    WEBSITE_DOMAIN: isProduction ? "https://sandeepkumarjha.com.np" : (typeof window !== 'undefined' ? window.location.origin : "https://sandeepkumarjha.com.np"),

    // Resolves accurate absolute image URL for GetPay header and order summary
    getImageUrl: function (relativeImgPath) {
      if (!relativeImgPath) return "";
      if (relativeImgPath.startsWith("http://") || relativeImgPath.startsWith("https://")) {
        return relativeImgPath;
      }
      const clean = relativeImgPath.replace(/^\//, "");
      if (typeof window !== "undefined") {
        const origin = window.location.origin.includes("sandeepkumarjha.com.np")
          ? "https://sandeepkumarjha.com.np"
          : window.location.origin;
        const pathname = window.location.pathname;
        const dir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
        return origin + dir + clean;
      }
      return this.WEBSITE_DOMAIN + "/projects/codersclub/" + clean;
    },

    // Dynamically generate callback URLs matching current directory context
    getCallbackUrls: function () {
      const origin = this.WEBSITE_DOMAIN;
      let pathPrefix = '/';
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.includes('/projects/codersclub/')) {
          pathPrefix = '/projects/codersclub/';
        } else if (path.includes('/Coders_Club/')) {
          pathPrefix = '/Coders_Club/';
        }
      }
      return {
        successUrl: origin + pathPrefix + 'success.html',
        failUrl: origin + pathPrefix + 'fail.html'
      };
    },

    // Course Catalog with names, prices, and assets
    COURSES: {
      "oracle-plsql": {
        id: "oracle-plsql",
        name: "Mastering Oracle PL/SQL for Financial Systems",
        subtitle: "Learn secure, scalable, and audit-compliant PL/SQL package optimization",
        price: 6500.00,
        imageUrl: "img/python.jpg",
        btnText: "Start Learning Oracle PL/SQL"
      },
      "banking-etl": {
        id: "banking-etl",
        name: "Banking Data Reconciliation Pipelines",
        subtitle: "Blueprint to build robust daily transaction matching networks and ETL design",
        price: 10500.00,
        imageUrl: "img/feature.jpg",
        btnText: "Start Learning Banking ETL"
      },
      "java-mastery": {
        id: "java-mastery",
        name: "Java Mastery Course",
        subtitle: "Learn Java from scratch to advanced level",
        price: 4500.55,
        imageUrl: "img/java.png",
        btnText: "Start Learning Java"
      }
    },

    // Get selected course from URL parameter or localStorage fallback
    getCourseData: function (courseId) {
      return this.COURSES[courseId] || this.COURSES["oracle-plsql"];
    },

    // Generates 100% responsive orderInformationUI HTML string with itemized breakdown for GetPay SDK
    createOrderInformationUI: function (course, amount, customNote) {
      const baseVal = Number(amount || course.price);
      const feeRate = 0.035;
      const feeVal = Number((baseVal * feeRate).toFixed(2));
      const totalVal = Number((baseVal + feeVal).toFixed(2));

      const formattedBase = baseVal.toLocaleString('en-US', { minimumFractionDigits: 2 });
      const formattedFee = feeVal.toLocaleString('en-US', { minimumFractionDigits: 2 });
      const formattedTotal = totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 });
      const imgPath = this.getImageUrl(course.imageUrl);
      const bankNote = customNote || "Powered by Laxmi Sunrise Bank Limited";

      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 12px 14px; box-sizing: border-box; width: 100%; max-width: 100%;">
          <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0;">Order Summary</h3>
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-sizing: border-box; width: 100%; margin-bottom: 12px;">
            <img src="${imgPath}" alt="${course.name}" style="width: 48px; height: 48px; min-width: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0;" />
            <div style="min-width: 0; flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.35; margin-bottom: 2px; word-break: break-word;">${course.name}</div>
              <div style="font-size: 12px; color: #64748b;">Course Enrollment</div>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-size: 13px; color: #334155; box-sizing: border-box; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #64748b;">Course Fee</span>
              <span style="font-weight: 600; color: #0f172a;">NPR ${formattedBase}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #64748b;">Convenience Fee (3.5%)**</span>
              <span style="font-weight: 600; color: #0f172a;">NPR ${formattedFee}</span>
            </div>
            <div style="border-top: 1px dashed #cbd5e1; margin: 8px 0;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
              <span style="font-weight: 700; color: #0f172a;">Total Payable</span>
              <span style="font-weight: 700; color: #2563eb; font-size: 15px;">NPR ${formattedTotal}</span>
            </div>
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #64748b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
              <span>** 3.5% Gateway Convenience Fee</span>
              <span style="color: #0f172a; font-weight: 500;">${bankNote}</span>
            </div>
          </div>
        </div>
      `.trim();
    }
  };

  // Securely freeze ECOM configuration to prevent tampering
  Object.freeze(config);
  Object.freeze(config.COURSES);

  // ─── AFT (Account Fund Transfer) Configuration ───────────────────────────
  // Separate config block for AFT flow — distinct papInfo + v3 bundle.
  // fundsSource and accountType are passed silently; never exposed in the UI.
  const aftConfig = {
    PAP_INFO: 'eyJpbnN0aXR1dGlvbklkIjoiMTIyIiwibWlkIjoiNzcxMjMyNTYzNDIzMTIzIiwidGlkIjoiMTIzNTY3MTIifQ==',
    OPR_KEY: '4fa4c6b9-3f91-43e5-9b4f-319f68187ba5',
    INS_KEY: '',
    BASE_URL: 'https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions',
    STATUS_API: 'https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions/merchant-status',
    BUNDLE_URL: 'https://getpay.finpos.global/v3/ecom-merchant/bundle-v1.js',
    BAI: 'WT',          // Business Application ID — defaulted to WT (Wallet Transfer)
    FUNDS_SOURCE: '05',          // Sender funds source (hidden from UI)
    ACCOUNT_TYPE: '01',          // Recipient account type (hidden from UI)

    // Generate AFT-aware callback URLs (appends ?flow=aft)
    getCallbackUrls: function () {
      const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('sandeepkumarjha.com.np');
      const origin = isProduction ? 'https://sandeepkumarjha.com.np' : (typeof window !== 'undefined' ? window.location.origin : 'https://sandeepkumarjha.com.np');
      let pathPrefix = '/';
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.includes('/projects/codersclub/')) pathPrefix = '/projects/codersclub/';
        else if (path.includes('/Coders_Club/')) pathPrefix = '/Coders_Club/';
      }
      return {
        successUrl: origin + pathPrefix + 'success.html?flow=aft&verified=true',
        failUrl: origin + pathPrefix + 'fail.html?flow=aft'
      };
    }
  };

  Object.freeze(aftConfig);

  // Attach globally
  global.GetPayConfig = config;
  global.GetPayAftConfig = aftConfig;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GetPayConfig: config, GetPayAftConfig: aftConfig };
  }
})(typeof window !== 'undefined' ? window : this);

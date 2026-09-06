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
    BUNDLE_URL: "https://minio-getpay.nchl.com.np/getpay-cdn/webcheckout/v5/bundle.js",

    // Website Domain - must match callbackUrl host per GetPay documentation
    WEBSITE_DOMAIN: isProduction ? "https://sandeepkumarjha.com.np" : (typeof window !== 'undefined' ? window.location.origin : "https://sandeepkumarjha.com.np"),

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

    // Generates 100% responsive orderInformationUI HTML string for GetPay SDK
    createOrderInformationUI: function (course, amount) {
      const priceVal = amount || course.price;
      const formattedPrice = Number(priceVal).toLocaleString('en-US', { minimumFractionDigits: 2 });
      
      // Calculate image URL
      let imgPath = course.imageUrl;
      if (!imgPath.startsWith('http')) {
        let baseFolder = '';
        if (typeof window !== 'undefined') {
          if (window.location.pathname.includes('/projects/codersclub/')) {
            baseFolder = '/projects/codersclub/';
          } else if (window.location.pathname.includes('/Coders_Club/')) {
            baseFolder = '/Coders_Club/';
          } else {
            baseFolder = '/';
          }
        }
        imgPath = this.WEBSITE_DOMAIN + baseFolder + imgPath.replace(/^\//, '');
      }

      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 12px 14px; box-sizing: border-box; width: 100%; max-width: 100%;">
          <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0;">Order Information</h3>
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; box-sizing: border-box; width: 100%;">
            <img src="${imgPath}" alt="${course.name}" style="width: 48px; height: 48px; min-width: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0;" />
            <div style="min-width: 0; flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.35; margin-bottom: 4px; word-break: break-word;">${course.name}</div>
              <div style="font-size: 15px; font-weight: 700; color: #2563eb;">NPR ${formattedPrice}</div>
            </div>
          </div>
        </div>
      `.trim();
    }
  };

  // Securely freeze configuration to prevent tampering
  Object.freeze(config);
  Object.freeze(config.COURSES);

  // Attach globally and support ES modules
  global.GetPayConfig = config;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
  }
})(typeof window !== 'undefined' ? window : this);

// Configuration for NCHL GetPay integration
// Replace these with your actual test/production keys

export const GetPayConfig = {
    // Demo credentials - Update these with actual keys provided by NCHL/Bank
    PAP_INFO: "eyJpbnN0aXR1dGlvbklkIjoiMTIyIiwibWlkIjoiMTIzMTIzNDUxNzcwOTg2IiwidGlkIjoiMTIzNTg3NjIifQ==",
    OPR_KEY: "4fa4c6b9-3f91-43e5-9b4f-319f68187ba5",
    INS_KEY: "", // If applicable

    // URLs
    BASE_URL: "https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions",
    VERIFY_API: "https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions/merchant-status",
    
    // Website Domain
    WEBSITE_DOMAIN: window.location.origin // Automatically detects current domain,e.g: "https://sandeepkumarjha.com.np"
};

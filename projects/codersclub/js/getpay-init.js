import { GetPayConfig } from './getpay-config.js';

export function initializeGetPay(amount, businessName = "Demo Payment") {
    console.log("Pay button clicked, initializing GetPay...");

    const options = {
        userInfo: {
            name: "John Doe", email: "john@example.com", state: "Bagmati",
            country: "Nepal", zipcode: "44600", city: "Kathmandu", address: "Nepal"
        },
        clientRequestId: "TXN-" + Date.now(),
        papInfo: GetPayConfig.PAP_INFO,
        oprKey: GetPayConfig.OPR_KEY,
        insKey: GetPayConfig.INS_KEY,
        websiteDomain: GetPayConfig.WEBSITE_DOMAIN,
        price: parseFloat(amount),
        businessName: businessName,
        imageUrl: GetPayConfig.WEBSITE_DOMAIN + "/img/logo.png", // Assuming logo in /img
        currency: "NPR",
        prefill: { name: true, email: true, state: true, city: true, address: true, zipcode: true, country: true },
        disableFields: { state: true, address: true },
        callbackUrl: {
            successUrl: GetPayConfig.WEBSITE_DOMAIN + "/payment.html",
            failUrl: GetPayConfig.WEBSITE_DOMAIN + "/fail.html",
        },
        themeColor: "#5662FF",
        baseUrl: GetPayConfig.BASE_URL,
        onSuccess: (options) => {
            console.log("GetPay Init Success", options);
            window.location.href = GetPayConfig.WEBSITE_DOMAIN + "/payment.html";
        },
        onError: (error) => {
            console.error("GetPay Init Error:", error);
            
            // Handle the 401 Silent Cybersource error more gracefully by alerting user
            let errorMessage = "An error occurred while initializing the payment gateway. Please try again later.";
            if (error && typeof error === 'object' && error.message) {
                 errorMessage += "\n\nDetails: " + error.message;
            } else if (error && typeof error === 'string') {
                 errorMessage += "\n\nDetails: " + error;
            } else {
                 errorMessage += "\n\nThis is commonly caused by invalid credentials or a blocked domain. Please check your config.";
            }
            alert(errorMessage);
            
            // Redirect to fail page or stay on current to let user try again
             window.location.href = GetPayConfig.WEBSITE_DOMAIN + "/fail.html";
        }
    };

    console.log("Payload being sent to GetPay:", options);
    
    if (window.getpay && window.getpay.initialize) {
        try {
            window.getpay.initialize(options);
        } catch (error) {
            console.error("Error during GetPay initialization:", error);
            alert("A critical error occurred initializing GetPay. Check console for details.");
        }
    } else {
        console.error("GetPay SDK not loaded. Ensure the script URL is correct and accessible.");
        alert("Payment gateway SDK is not loaded correctly. Check documentation or network.");
    }
}

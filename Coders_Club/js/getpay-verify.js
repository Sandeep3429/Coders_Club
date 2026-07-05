import { GetPayConfig } from './getpay-config.js';

export async function verifyTransaction(debugCallback = null) {
    function logDebug(msg, data) {
        console.log(msg, data);
        if (debugCallback && typeof debugCallback === 'function') {
            debugCallback(msg, data);
        }
    }

    try {
        // a) Extract token from URL hash or query params
        const url = window.location.hash || window.location.search;
        const urlParams = new URLSearchParams(url.replace(/^#|^\?/, ""));
        const token = urlParams.get("token");
        logDebug("Extracted Token", token);

        if (!token) {
            return { success: false, message: "Error: Invalid return URL. Token is missing." };
        }

        // b) Decode Base64 token -> get "id"
        let decoded = null;
        try {
            decoded = JSON.parse(atob(token));
            logDebug("Decoded Token Data", decoded);
        } catch (e) {
            logDebug("Token decode error", e.message);
        }

        const txnId = decoded?.id || decoded?.transactionId || decoded?.txnId;
        if (!txnId) {
            return { success: false, message: "Error: Invalid token payload. Transaction ID missing." };
        }

        // c) POST to merchant-status API
        const payload = { id: txnId, papInfo: GetPayConfig.PAP_INFO };
        logDebug("Request Payload to Status API", payload);

        const response = await fetch(GetPayConfig.VERIFY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        logDebug("Status API Response", data);

        // d) Parse response
        const status = (data.status || data.transactionStatus || "").toUpperCase();

        if (status === "SUCCESS" || status === "APPROVED") {
            window.location.href = GetPayConfig.WEBSITE_DOMAIN + "/success.html?verified=true&txid=" + txnId;
            return { success: true, status: status, txnId: txnId }; // Might not reach here due to redirect
        } else if (status === "FAILED" || status === "DECLINED") {
            window.location.href = GetPayConfig.WEBSITE_DOMAIN + "/fail.html?verified=true&txid=" + txnId;
            return { success: false, status: status, txnId: txnId }; // Might not reach here
        } else {
            return { success: false, message: `Payment Pending / Unknown Status.<br><br>Status: ${status}<br>Transaction ID: ${txnId}` };
        }

    } catch (error) {
        logDebug("Network/Processing Error", error.message);
        return { success: false, message: "Unable to verify payment due to a network error." };
    }
}

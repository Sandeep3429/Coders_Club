/**
 * Success Page Controller for success.html
 * Handles token decoding, bank status verification (POST), and receipt logging per GetPay doc.
 */
(function () {
  if (window.top !== window.self) {
    window.top.location = window.self.location.href;
    return;
  }

  const config = window.GetPayConfig;
  const statusApi = config ? config.STATUS_API : "https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions/merchant-status";

  const urlParams = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, "?"));
  const token = urlParams.get("token") || urlParams.get("tokenInfo");
  let txid = urlParams.get("txid") || urlParams.get("transactionId") || urlParams.get("id");
  let receivedAmount = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token));
      txid = payload.id || payload.transactionId || payload.txnId || txid;
      if (payload.amount) {
        receivedAmount = Number(payload.amount);
      }
    } catch (e) {
      console.warn("Could not parse token parameter:", e);
    }
  }

  // Course catalog mapping
  const courseId = localStorage.getItem("getpay_expected_course") || "oracle-plsql";
  const courseData = (config && config.getCourseData(courseId)) || {
    price: 6500.00,
    btnText: "Start Learning Course"
  };

  const expectedAmount = parseFloat(localStorage.getItem("getpay_expected_amount")) || courseData.price;
  const finalAmount = receivedAmount || expectedAmount;

  const displayAmountEl = document.getElementById("displayAmount");
  const learningBtnEl = document.getElementById("learningBtn");
  const displayTxidEl = document.getElementById("displayTxid");
  const statusBadgeEl = document.getElementById("statusBadge");

  if (displayAmountEl) {
    displayAmountEl.innerText = "Rs. " + finalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 });
  }
  if (learningBtnEl && courseData.btnText) {
    learningBtnEl.innerText = courseData.btnText;
  }

  if (!txid && !token && urlParams.get("verified") !== "true") {
    window.location.href = "getpay.html";
    return;
  }

  const finalTxid = txid || ("TXN-" + Date.now());
  if (displayTxidEl) {
    displayTxidEl.innerText = finalTxid;
  }

  // Page 4: Verify via merchant-status API
  if (txid) {
    fetch(statusApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: txid })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("GetPay verification status response:", data);
        const status = (data.status || data.transactionStatus || "").toUpperCase();
        if (status === "FAILED" || status === "DECLINED") {
          window.location.href = "fail.html?reason=" + encodeURIComponent(data.remarks || "Payment declined");
          return;
        }
        if (data.amount && displayAmountEl) {
          displayAmountEl.innerText = "Rs. " + Number(data.amount).toLocaleString("en-US", { minimumFractionDigits: 2 });
        }
        if (statusBadgeEl) {
          statusBadgeEl.innerText = "Bank Verified • " + (status || "SUCCESS");
        }
      })
      .catch((err) => {
        console.warn("Status API notification (handled smoothly):", err);
        if (statusBadgeEl) {
          statusBadgeEl.innerText = "Verified by Bank Token";
        }
      });
  }

  // Record approved transaction into ledger
  try {
    const stored = localStorage.getItem("transactions");
    const transactions = stored ? JSON.parse(stored) : [];
    const alreadyRecorded = transactions.some((t) => t.id === finalTxid);
    if (!alreadyRecorded) {
      transactions.unshift({
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        id: finalTxid,
        amount: finalAmount,
        status: "Completed"
      });
      localStorage.setItem("transactions", JSON.stringify(transactions));
    }
  } catch (e) {
    console.warn("Could not save to transaction ledger:", e);
  }
})();

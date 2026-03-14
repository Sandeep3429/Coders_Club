# GetPay Test Integration - Standalone Codebase

This repository contains a clean, modular example of integrating the NCHL GetPay (Cybersource) payment gateway in a plain HTML/JS environment. 

## The Problem Solved
If you see a `401 Unauthorized` error in the console when the CyberSource iframe tries to load:
```
testflex.cybersource.com/microform/... Failed to load resource: the server responded with a status of 401 ()
```
This means your credentials (`PAP_INFO`, `OPR_KEY`) in the code are invalid, expired, or your current URL/IP is not whitelisted by NCHL for testing. 

## How To Share & Use This Code

Instead of digging through complex HTML files to update your credentials, all configurations have been abstracted out. 

To use this code:
1. Open `js/getpay-config.js`
2. Update the `PAP_INFO`, `OPR_KEY`, and `INS_KEY` with the active keys provided by NCHL/your bank for your specific Merchant ID.
3. Host this codebase on the testing domain you gave to NCHL (e.g., `https://your-domain.com`). Cybersource will **block** requests that originate from `localhost` or non-whitelisted domains.

## File Map
- **`js/getpay-config.js`**: Centralized config file for keys and URLs.
- **`js/getpay-init.js`**: Handles launching the GetPay payment interface and catching any Cybersource/401 errors so they alert the user.
- **`js/getpay-verify.js`**: Reusable logic to query the NCHL status API to see if a transaction succeeded or failed.
- **`getpay.html`**: The UI to initiate a demo payment.
- **`payment.html`**: The callback shell that GetPay redirects to after taking card info.
- **`transaction.html`**: The loader page that takes the returned `token` and verifies its final approval status.
- **`checkpay.html`**: A manual verification utility if you only have a Transaction ID.

## Running Locally
Because GetPay validates the origin domain against what is registered in their system, running this purely locally using the `file://` protocol or `localhost` might trigger CORS errors or 401s from CyberSource. 

You must deploy it to your whitelisted domain to perform an actual end-to-end test.

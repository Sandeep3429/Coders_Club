import urllib.request
import json

print("Testing local pages...")
try:
    # 1. Test getpay.html is served
    req = urllib.request.Request("http://localhost:8080/getpay.html")
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        if "window.GetPay" in html:
            print("getpay.html is updated correctly and served.")
        else:
            print("ERROR: getpay.html not updated - window.GetPay not found.")

    # 2. Test payment.html logic (Can't execute JS, but checking content)
    req2 = urllib.request.Request("http://localhost:8080/payment.html")
    with urllib.request.urlopen(req2) as response:
        html2 = response.read().decode('utf-8')
        if "https://uat-bank-getpay.nchl.com.np/ecom-web-checkout/v1/secure-merchant/transactions/status" in html2:
            print("payment.html verification logic is present.")
        else:
            print("ERROR: payment logic missing.")
            
    # 3. Test transactions.html
    req3 = urllib.request.Request("http://localhost:8080/transactions.html")
    with urllib.request.urlopen(req3) as response:
        html3 = response.read().decode('utf-8')
        if "transaction-list" in html3:
            print("transactions.html is served and ready.")
            
    print("All pages served correctly.")

except Exception as e:
    print(f"Error: {e}")

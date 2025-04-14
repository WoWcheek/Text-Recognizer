import { useEffect } from "react";

const PaymentSuccess = () => {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: "subscriptionPaid" }, "*");
    }
    window.close();
  }, []);

  return <p>Оплата успішна, вікно закриється...</p>;
};

export default PaymentSuccess;

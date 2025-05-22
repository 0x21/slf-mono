import Script from "next/script";

const TelegramScript = () => {
  return (
    <Script
      id="telegram"
      type="text/javascript"
      src="https://telegram.org/js/telegram-widget.js"
    ></Script>
  );
};

export default TelegramScript;

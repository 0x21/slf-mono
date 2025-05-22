import { useEffect, useState } from "react";

const VIEWPORT_COOKIE_NAME = "viewport:state";
const VIEWPORT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const useIsMobile = (initialValue?: boolean): boolean | undefined => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(initialValue);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (isMobile === undefined) {
      return;
    }
    const viewport = isMobile ? "mobile" : "desktop";
    document.cookie = `${VIEWPORT_COOKIE_NAME}=${viewport}; path=/; max-age=${VIEWPORT_COOKIE_MAX_AGE}`;
  }, [isMobile]);

  return isMobile;
};

export { useIsMobile };

export default useIsMobile;

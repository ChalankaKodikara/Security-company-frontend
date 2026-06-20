import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const SSOLogin = () => {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState("");
  useEffect(() => {
    const handleSSO = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const data = params.get("data");

        //  SAFETY CHECK
        if (!data || data === "null" || data === "undefined") {
          navigate("/loading", { replace: true });
          return;
        }

        let parsed;

        try {
          parsed = JSON.parse(decodeURIComponent(data));
        } catch {
          navigate("/loading", { replace: true });
          return;
        }

        if (!parsed || !parsed.accessToken) {
          navigate("/loading", { replace: true });
          return;
        }

        //  SET COOKIES SAFELY
        Cookies.set("accessToken", parsed.accessToken, { expires: 7 });
        Cookies.set("refreshToken", parsed.refreshToken, { expires: 7 });
        Cookies.set("username", parsed.username || parsed.email, {
          expires: 7,
        });
        Cookies.set("email", parsed.email || "", { expires: 7 });
        Cookies.set("tenent_role", parsed.tenantRole || "", { expires: 7 });

        // Clean URL
        window.history.replaceState({}, document.title, "/loading");

        //  GO TO LOADING PAGE
        navigate("/loading", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    };

    handleSSO();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">{debugInfo || "Processing SSO..."}</p>
    </div>
  );
};

export default SSOLogin;

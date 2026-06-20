/** @format */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Login_Anim from "../../../assets/com-logo.png";

const LoadingPage = () => {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState("");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const startTime = Date.now();

    const waitMinimumTime = async () => {
      const elapsed = Date.now() - startTime;
      const remaining = 4000 - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
    };

    const handleSSOAndLoad = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        /* =====================================
           1️⃣ READ URL PARAMETERS
        ===================================== */

        const ssoData = params.get("data");

        const roleFromURL =
          params.get("tenant_role") ||
          params.get("tenet_role") ||
          params.get("tenantRole") ||
          params.get("tenetRole") ||
          "";

        const systemIdFromURL = params.get("system_id") || "";

        /* =====================================
           2️⃣ PROCESS SSO DATA
        ===================================== */

        if (ssoData) {
          try {
            const decoded = decodeURIComponent(ssoData);
            const parsed = JSON.parse(decoded);

            if (parsed.accessToken) {
              Cookies.set("accessToken", parsed.accessToken, {
                expires: 7,
                secure: true,
                sameSite: "Lax",
              });
            }

            if (parsed.refreshToken) {
              Cookies.set("refreshToken", parsed.refreshToken, {
                expires: 7,
                secure: true,
                sameSite: "Lax",
              });
            }

            const username = parsed.username || parsed.email || "";

            Cookies.set("username", username, {
              expires: 7,
              secure: true,
              sameSite: "Lax",
            });

            Cookies.set("email", parsed.email || "", {
              expires: 7,
              secure: true,
              sameSite: "Lax",
            });

            const role =
              parsed.tenant_role ||
              parsed.tenet_role ||
              parsed.tenantRole ||
              parsed.tenetRole ||
              roleFromURL;

            if (role) {
              Cookies.set("tenant_role", role, {
                expires: 7,
                secure: true,
                sameSite: "Lax",
              });
            }

            if (parsed.system_id || systemIdFromURL) {
              Cookies.set("system_id", parsed.system_id || systemIdFromURL, {
                expires: 7,
                secure: true,
                sameSite: "Lax",
              });
            }

            /* Clean URL */
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          } catch (error) {
            console.error("Invalid SSO payload", error);
          }
        }

        /* =====================================
           3️⃣ GET AUTH COOKIES
        ===================================== */

        const username = Cookies.get("username");
        const tenantRole = Cookies.get("tenant_role") || roleFromURL;
        const accessToken = Cookies.get("accessToken");

        if (!username || !accessToken) {
          setDebugInfo("Authentication missing...");
          await waitMinimumTime();
          navigate("/loading", { replace: true });
          return;
        }

        console.log("Auth context", {
          username,
          tenantRole,
        });

        /* =====================================
           4️⃣ CALL USER PERMISSIONS API
        ===================================== */

        const endpoint = `${API_URL}/v1/hris/user/getUserByIDORName?username=${encodeURIComponent(
          username
        )}&tenant_role=${encodeURIComponent(tenantRole)}`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        const data = await response.json();

        if (data?.success && data?.data) {
          const { user, permissions } = data.data;

          if (user?.employee_no) {
            Cookies.set("username", user.employee_no, {
              expires: 7,
              secure: true,
              sameSite: "Lax",
            });
          }

          Cookies.set("permissions", JSON.stringify(permissions || []), {
            expires: 7,
            secure: true,
            sameSite: "Lax",
          });

          Cookies.set("user", JSON.stringify(user || {}), {
            expires: 7,
            secure: true,
            sameSite: "Lax",
          });

          setDebugInfo("Success! Redirecting...");
          await waitMinimumTime();

          navigate("/emp-dashboard", { replace: true });
        } else {
          throw new Error("Invalid response");
        }
      } catch (error) {
        console.error(error);
        setDebugInfo("Session expired...");
        await waitMinimumTime();
        navigate("/loading", { replace: true });
      }
    };

    handleSSOAndLoad();
  }, [navigate, API_URL]);

  return (
    <>
      <style>
        {`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }
      `}
      </style>

      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-10">

          <img
            src={Login_Anim}
            alt="Loading..."
            className="w-[300px] object-contain"
          />

          <div className="flex flex-col items-center space-y-4">

            <div className="w-14 h-14 border-4 border-gray-200 border-t-[#001F3F] rounded-full spinner"></div>

            <h3 className="text-lg font-semibold text-gray-700">
              Loading...
            </h3>

            {debugInfo && (
              <p className="text-xs text-gray-500">
                {debugInfo}
              </p>
            )}

          </div>

        </div>
      </div>
    </>
  );
};

export default LoadingPage;
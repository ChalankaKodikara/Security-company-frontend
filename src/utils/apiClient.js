import Cookies from "js-cookie";

const MASTER_API = "https://back-master-admin.talentfort.live";
const LOGOUT_REDIRECT = "https://talexaone.talentfort.live/dashboard";

let isRefreshing = false;
let refreshPromise = null;

// ======================================================
// 🔐 FORCE LOGOUT
// ======================================================
const forceLogout = () => {
  // Remove only auth-related cookies
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
  Cookies.remove("username");
  Cookies.remove("email");
  Cookies.remove("tenant_role");
  Cookies.remove("permissions");
  Cookies.remove("user");

  // Optional: clear only auth-related storage keys if needed
  localStorage.removeItem("authData");
  sessionStorage.removeItem("authData");

  window.location.href = LOGOUT_REDIRECT;
};

// ======================================================
// 🔄 REFRESH ACCESS TOKEN
// ======================================================
const refreshAccessToken = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = Cookies.get("refreshToken");

      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const response = await fetch(
        `${MASTER_API}/api/auth/tenant/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        },
      );

      if (!response.ok) {
        throw new Error("Refresh request failed");
      }

      const data = await response.json();

      if (data?.success && data.accessToken) {
        // Save new access token
        Cookies.set("accessToken", data.accessToken, {
          expires: 1, // Short expiry recommended
          secure: true,
          sameSite: "Lax",
        });

        // Rotate refresh token if backend sends new one
        if (data.refreshToken) {
          Cookies.set("refreshToken", data.refreshToken, {
            expires: 7,
            secure: true,
            sameSite: "Lax",
          });
        }

        return data.accessToken;
      }

      throw new Error("Invalid refresh response");
    } catch (error) {
      console.error("Token refresh failed:", error);
      forceLogout();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ======================================================
// 🌍 GLOBAL API FETCH WRAPPER
// ======================================================
export const apiFetch = async (url, options = {}) => {
  const makeRequest = async (token) => {
    const isFormData = options.body instanceof FormData;

    return fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };

  let accessToken = Cookies.get("accessToken");

  let response = await makeRequest(accessToken);

  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) return response;

    response = await makeRequest(newToken);
  }

  return response;
};
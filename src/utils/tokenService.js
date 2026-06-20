import Cookies from "js-cookie";

const API_URL = process.env.REACT_APP_API_URL;
const LOGOUT_REDIRECT = "/login";

export const refreshAccessToken = async () => {
  try {
    const refreshToken = Cookies.get("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const response = await fetch(`${API_URL}/v1/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh request failed");
    }

    const data = await response.json();

    if (data?.success && data.accessToken) {
      // Update access token (short expiry recommended)
      Cookies.set("accessToken", data.accessToken, {
        expires: 1, // 1 day or shorter depending on backend
        secure: true,
        sameSite: "Lax",
      });

      // Rotate refresh token if provided
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
    console.error("Refresh token failed:", error);

    // Clear only auth cookies
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    Cookies.remove("username");
    Cookies.remove("email");
    Cookies.remove("tenant_role");
    Cookies.remove("permissions");
    Cookies.remove("user");

    window.location.href = LOGOUT_REDIRECT;

    return null;
  }
};

/** @format */

import sidebarData from "../components/sidebar/sidebar_data";

export const decodePermissions = (permissionString) => {
  try {
    if (!permissionString) return [];

    if (Array.isArray(permissionString)) {
      return permissionString
        .map((id) => (id === null || id === undefined ? "" : String(id).trim()))
        .filter(Boolean);
    }

    let decoded = String(permissionString);
    try {
      decoded = decodeURIComponent(decoded);
    } catch (e) {
      // ignore malformed encoding
    }

    const trimmed = decoded.trim();

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((id) =>
              id === null || id === undefined ? "" : String(id).trim()
            )
            .map((id) => id.replace(/^['"[\]\s]+|['"[\]\s]+$/g, ""))
            .filter(Boolean);
        }
      } catch (e) {
        // fallback below
      }
    }

    return trimmed
      .split(",")
      .map((id) =>
        (id === null || id === undefined ? "" : String(id))
          .replace(/^['"[\]\s]+|['"[\]\s]+$/g, "")
          .trim()
      )
      .filter(Boolean);
  } catch (error) {
    console.error("Error decoding permissions:", error);
    return [];
  }
};

export const getUserPermissions = () => {
  try {
    const permissionCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("permissions="))
      ?.split("=")[1];

    if (permissionCookie) {
      return decodePermissions(permissionCookie);
    }

    const stored = localStorage.getItem("permissions");
    if (stored) {
      return decodePermissions(stored);
    }

    return [];
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
};

export const hasPermissionForFeature = (
  userPermissions,
  requiredPermissions
) => {
  if (!Array.isArray(userPermissions) || !Array.isArray(requiredPermissions)) {
    return false;
  }

  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission.toString())
  );
};

export const getFirstAccessibleRoute = (userPermissions = null) => {
  try {
    const permissions = userPermissions || getUserPermissions();

    if (!Array.isArray(permissions) || permissions.length === 0) {
      console.warn("No permissions found, redirecting to default route");
      return "/emp-dashboard";
    }

    console.log("User permissions:", permissions);

    const sortedSidebarData = [...sidebarData].sort((a, b) => {
      const idA = parseInt(a._id, 10) || 0;
      const idB = parseInt(b._id, 10) || 0;
      return idA - idB;
    });

    for (const module of sortedSidebarData) {
      const hasMainPermission = hasPermissionForFeature(
        permissions,
        module.requiredPermissionsformainfeatures || []
      );

      if (hasMainPermission) {
        console.log(`Found accessible module: ${module.name} (${module._id})`);

        if (
          module.subModules &&
          Array.isArray(module.subModules) &&
          module.subModules.length > 0
        ) {
          for (const subModule of module.subModules) {
            const hasSubPermission = hasPermissionForFeature(
              permissions,
              subModule.requiredPermissionsforsubfeatures || []
            );

            if (hasSubPermission) {
              const fullUrl = module.url
                ? `${module.url}${subModule.url}`
                : subModule.url;

              console.log(
                `Redirecting to submodule: ${subModule.name} -> ${fullUrl}`
              );

              return fullUrl;
            }
          }

          if (module.url) {
            console.log(
              `No accessible submodules, redirecting to main module: ${module.url}`
            );
            return module.url;
          }
        } else if (module.url) {
          console.log(`Redirecting to main module: ${module.url}`);
          return module.url;
        }
      }
    }

    console.warn("No accessible routes found, using default");
    return "/emp-dashboard";
  } catch (error) {
    console.error("Error determining accessible route:", error);
    return "/emp-dashboard";
  }
};

export const redirectToFirstAccessibleRoute = (
  navigate,
  userPermissions = null,
  delay = 0
) => {
  try {
    const targetRoute = getFirstAccessibleRoute(userPermissions);

    if (delay > 0) {
      setTimeout(() => {
        navigate(targetRoute);
      }, delay);
    } else {
      navigate(targetRoute);
    }

    console.log(
      `Redirecting to: ${targetRoute}${delay > 0 ? ` (after ${delay}ms)` : ""}`
    );
  } catch (error) {
    console.error("Error during redirect:", error);

    if (delay > 0) {
      setTimeout(() => {
        navigate("/emp-dashboard");
      }, delay);
    } else {
      navigate("/emp-dashboard");
    }
  }
};

const permissionRedirectUtils = {
  decodePermissions,
  getUserPermissions,
  hasPermissionForFeature,
  getFirstAccessibleRoute,
  redirectToFirstAccessibleRoute,
};

export default permissionRedirectUtils;
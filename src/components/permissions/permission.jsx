/** @format */

import { useEffect, useState } from "react";
import { decodePermissions } from "../../utils/permissionRedirect";

const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      let raw = null;

      // 1. Try to get from cookie
      const permissionCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("permissions="))
        ?.split("=")[1];

      if (permissionCookie) {
        try {
          raw = decodePermissions(permissionCookie);
        } catch (err) {
          console.error("Failed to decode permissions from cookie:", err);
        }
      }

      // 2. If cookie not set or empty, try from localStorage/sessionStorage
      if (!raw || (Array.isArray(raw) && raw.length === 0)) {
        const stored = localStorage.getItem("permissions");
        if (stored) raw = decodePermissions(stored);
      }

      // 3. Normalize: ensure array of strings
      let normalized = Array.isArray(raw)
        ? raw.map((id) => (id === null || id === undefined ? "" : String(id).trim())).filter(Boolean)
        : [];

      // 4. Deduplicate
      normalized = [...new Set(normalized)];

      setPermissions(normalized || []);
    } catch (error) {
      console.error("Error loading permissions:", error);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasPermission = (required) => {
    if (!required || isLoading) return false;
    try {
      const list = Array.isArray(required) ? required : [required];
      return list.some(
        (perm) => permissions && permissions.includes(perm?.toString())
      );
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  const hasAnyFeaturePermission = (features, key) => {
    if (!Array.isArray(features) || isLoading) return false;
    try {
      return features.some(
        (feature) =>
          hasPermission(feature?.[key]) ||
          (Array.isArray(feature?.subFeatures) &&
            hasAnyFeaturePermission(feature.subFeatures, key))
      );
    } catch (error) {
      console.error("Error checking feature permission:", error);
      return false;
    }
  };

  return {
    permissions: permissions || [],
    hasPermission,
    hasAnyFeaturePermission,
    isLoading,
  };
};

export default usePermissions;

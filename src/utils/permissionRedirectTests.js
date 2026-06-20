/** @format */

import {
  decodePermissions,
  getFirstAccessibleRoute,
  hasPermissionForFeature,
} from "../utils/permissionRedirect";

/**
 * Test function to verify permission-based redirect logic
 */
export const testPermissionRedirect = () => {
  console.log("=== Testing Permission-Based Redirect Logic ===");

  // Test with your example permissions: "1018%2C6%2C10008"
  const testPermissionString = "1018%2C6%2C10008";
  const decodedPermissions = decodePermissions(testPermissionString);

  console.log("Original permission string:", testPermissionString);
  console.log("Decoded permissions:", decodedPermissions);

  // Test the redirect logic
  const targetRoute = getFirstAccessibleRoute(decodedPermissions);
  console.log("Target redirect route:", targetRoute);

  // Test individual permission checks
  console.log("\n=== Permission Check Details ===");
  console.log(
    'Has permission "6":',
    hasPermissionForFeature(decodedPermissions, ["6"])
  );
  console.log(
    'Has permission "1":',
    hasPermissionForFeature(decodedPermissions, ["1"])
  );
  console.log(
    'Has permission "1018":',
    hasPermissionForFeature(decodedPermissions, ["1018"])
  );

  return {
    originalString: testPermissionString,
    decodedPermissions,
    targetRoute,
  };
};

/**
 * Test with different permission combinations
 */
export const testMultiplePermissionScenarios = () => {
  console.log("\n=== Testing Multiple Permission Scenarios ===");

  const scenarios = [
    { name: "User with Reports access", permissions: ["6"] },
    { name: "User with Dashboard access", permissions: ["1"] },
    { name: "User with Multiple access", permissions: ["1", "6", "8"] },
    { name: "User with Settings access only", permissions: ["9"] },
    {
      name: "User with Leave Management (no main URL)",
      permissions: ["4", "110"],
    },
    {
      name: "User with Leave Management multiple sub-permissions",
      permissions: ["4", "110", "120", "130"],
    },
    {
      name: "User with only submodule permissions",
      permissions: ["110", "120"],
    },
  ];

  scenarios.forEach((scenario) => {
    const route = getFirstAccessibleRoute(scenario.permissions);
    console.log(
      `${scenario.name} (${scenario.permissions.join(", ")}) -> ${route}`
    );
  });
};

// Auto-run tests in development
if (process.env.NODE_ENV === "development") {
  console.log(
    "Permission redirect tests available. Run testPermissionRedirect() or testMultiplePermissionScenarios() in console."
  );
}

export default {
  testPermissionRedirect,
  testMultiplePermissionScenarios,
};

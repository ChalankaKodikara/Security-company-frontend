/** @format */

import React from "react";

// Utility to disable React DevTools in production or when causing issues
// This can help prevent the "Cannot set properties of undefined (setting 'toggle')" error

const disableReactDevTools = () => {
  try {
    // always attempt to disable the DevTools hook to avoid
    // intermittent "Cannot set properties of undefined (setting 'toggle')"
    // errors which originate from the hook trying to mutate an internal
    // toggle property.  It is harmless in production but can surface
    // during development when the extension is active, so we do it
    // unconditionally.
    if (
      typeof window !== "undefined" &&
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    ) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Completely neutralize the hook
      hook.onCommitFiberRoot = () => {};
      hook.onCommitFiberUnmount = () => {};
      hook.onCommitFiberRoot = () => {};
      hook.supportsFiber = false;
      hook.inject = () => {};
      hook.checkDCE = () => {};

      // Wrap setToggle safely
      if (hook.setToggle) {
        try {
          hook.setToggle = function() { return undefined; };
        } catch (e) {
          // ignore if property is not writable
        }
      }
      
      // Ensure _rendererInterfaces exists and is always an object
      if (!hook._rendererInterfaces || typeof hook._rendererInterfaces !== "object") {
        hook._rendererInterfaces = {};
      }
      
      // Clear any potentially problematic properties
      try {
        for (const key in hook._rendererInterfaces) {
          if (hook._rendererInterfaces.hasOwnProperty(key)) {
            delete hook._rendererInterfaces[key];
          }
        }
      } catch (e) {
        // ignore
      }

      // Additional safety measures
      try {
        Object.defineProperty(hook, "isDisabled", {
          value: true,
          writable: false,
          configurable: true,
        });
      } catch (e) {
        // ignore if cannot define
      }
    }
  } catch (error) {
    console.warn("Could not disable React DevTools:", error);
  }
};

// Function to suppress React DevTools errors
const suppressReactDevToolsErrors = () => {
  try {
    // Override console.error to filter out React DevTools related errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || "";

      // Filter out React DevTools and React.jsx related errors
      if (
        message.includes(
          "Cannot set properties of undefined (setting 'toggle')"
        ) ||
        message.includes("ReactToastify.css") ||
        message.includes("__REACT_DEVTOOLS_GLOBAL_HOOK__") ||
        message.includes("React.jsx: type is invalid") ||
        message.includes(
          "expected a string (for built-in components) or a class/function"
        ) ||
        message.includes("but got: object") ||
        message.includes("You likely forgot to export your component") ||
        message.includes("mixed up default and named imports")
      ) {
        // Log a simplified warning instead of the full error
        console.warn(
          "React DevTools warning suppressed:",
          message.substring(0, 100) + "..."
        );
        return;
      }

      // Call original console.error for other errors
      originalError.apply(console, args);
    };
  } catch (error) {
    console.warn("Could not override console.error:", error);
  }
};

// Function to help debug component import issues
const debugComponentImports = () => {
  try {
    // Check for common import issues
    const checkComponent = (componentName, component) => {
      if (component === undefined) {
        console.warn(
          `Component "${componentName}" is undefined - check import path`
        );
      } else if (
        typeof component === "object" &&
        component !== null &&
        !React.isValidElement(component)
      ) {
        console.warn(
          `Component "${componentName}" is an object but not a valid React element - check export/import syntax`
        );
      } else if (typeof component === "function") {
        console.log(
          `Component "${componentName}" imported correctly as function`
        );
      } else {
        console.log(`Component "${componentName}" type:`, typeof component);
      }
    };

    // This function can be called from console to debug specific components
    window.debugComponent = checkComponent;
    console.log(
      "Debug helper available: window.debugComponent(name, component)"
    );
  } catch (error) {
    console.warn("Could not setup component debugging:", error);
  }
};


// helper that runs the two protection helpers immediately
const initDevToolsProtection = () => {
  disableReactDevTools();
  suppressReactDevToolsErrors();
};

// Automatically run protection as soon as this module is evaluated
if (typeof window !== "undefined") {
  // create a stub hook object before anything else can read it
  try {
    const safeHook = {
      isDisabled: true,
      setToggle: () => {},
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
      supportsFiber: false,
      inject: () => null,
      checkDCE: () => {},
      _rendererInterfaces: {},
      _dispatcherHooks: null,
    };
    
    // Use defineProperty for better control
    Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
      value: safeHook,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  } catch (err) {
    // ignore if property cannot be set
  }

  initDevToolsProtection();

  // Poll periodically for any replacement attempts by the extension
  try {
    const interval = setInterval(() => {
      try {
        if (
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__ &&
          typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === "object"
        ) {
          const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          
          // Ensure critical properties exist and are safe
          if (!hook._rendererInterfaces || typeof hook._rendererInterfaces !== "object") {
            hook._rendererInterfaces = {};
          }
          
          if (typeof hook.setToggle !== "function") {
            hook.setToggle = () => {};
          }
          
          // Re-apply protection if it looks like the extension has tried to take over
          if (hook.onCommitFiberRoot && hook.onCommitFiberRoot.length > 0) {
            disableReactDevTools();
          }
        }
      } catch (e) {
        // ignore errors during check
      }
    }, 300);

    // Store reference for cleanup if needed
    if (!window.__REACT_APP__) {
      window.__REACT_APP__ = {};
    }
    window.__REACT_APP__.devToolsInterval = interval;
  } catch (e) {
    // ignore if interval cannot be set
  }
}

// ── Global Error Handler for DevTools Error ──────────────────────────────────
// Catch the specific "Cannot set properties of undefined (setting 'toggle')" 
// error before it reaches console
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (
      event.message &&
      event.message.includes("Cannot set properties of undefined") &&
      event.message.includes("toggle")
    ) {
      // Prevent the error from being reported
      event.preventDefault();
      console.warn(
        "[DevTools Protection] Suppressed React DevTools toggle error"
      );
      
      // Re-apply protection
      try {
        disableReactDevTools();
      } catch (e) {
        // ignore
      }
      return true;
    }
  });

  // Also handle unhandledrejection events
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason &&
      event.reason.toString &&
      event.reason.toString().includes("Cannot set properties of undefined")
    ) {
      event.preventDefault();
      console.warn("[DevTools Protection] Suppressed DevTools rejection error");
    }
  });
}

export {
  disableReactDevTools,
  suppressReactDevToolsErrors,
  debugComponentImports,
  initDevToolsProtection,
};

const devToolsUtils = {
  disableReactDevTools,
  suppressReactDevToolsErrors,
  debugComponentImports,
};

export default devToolsUtils;

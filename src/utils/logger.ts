const isDebugEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG_LOGS === "true";

export const debugLog = (...args: unknown[]) => {
  if (!isDebugEnabled) return;
  console.log(...args);
};

export const debugWarn = (...args: unknown[]) => {
  if (!isDebugEnabled) return;
  console.warn(...args);
};

export const debugError = (...args: unknown[]) => {
  if (!isDebugEnabled) return;
  console.error(...args);
};

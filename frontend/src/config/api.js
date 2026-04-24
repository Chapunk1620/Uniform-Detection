const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const hasApiBaseUrl = Boolean(rawApiBaseUrl);

if (!hasApiBaseUrl) {
  console.error('Missing VITE_API_BASE_URL. Set it in frontend/.env.');
}

export const API_BASE_URL = hasApiBaseUrl ? rawApiBaseUrl.replace(/\/$/, "") : "";

const isNgrokBaseUrl = API_BASE_URL.includes("ngrok-free.app");

function mergeHeaders(existingHeaders, extraHeaders) {
  if (!existingHeaders) {
    return { ...extraHeaders };
  }

  if (existingHeaders instanceof Headers) {
    const merged = new Headers(existingHeaders);
    Object.entries(extraHeaders).forEach(([key, value]) => {
      merged.set(key, value);
    });
    return merged;
  }

  return { ...existingHeaders, ...extraHeaders };
}

export function apiUrl(path) {
  if (!hasApiBaseUrl) {
    throw new Error('API base URL is not configured.');
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path, options = {}) {
  const requestOptions = { ...options };

  if (isNgrokBaseUrl) {
    requestOptions.headers = mergeHeaders(requestOptions.headers, {
      "ngrok-skip-browser-warning": "true",
    });
  }

  return fetch(apiUrl(path), requestOptions);
}

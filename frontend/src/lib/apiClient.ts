/**
 * apiClient.ts
 *
 * Lightweight fetch wrapper for calling Flask REST API endpoints.
 * All requests go to /api/... — in development Vite proxies these
 * to Flask on port 5000; in production Flask serves everything.
 *
 * Usage:
 *   import { apiClient } from "@/lib/apiClient";
 *   const clients = await apiClient.get("/api/clients/");
 *   await apiClient.post("/api/clients/", { first_name: "Jan", ... });
 */

const BASE_URL = "";  // Same origin — works both in dev (proxy) and production

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",  // Include cookies for Flask-Login sessions
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new ApiError(res.status, `API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
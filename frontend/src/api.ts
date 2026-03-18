export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://testenexusbackend-production.up.railway.app";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string | null;
};

export type ApiErrorPayload = {
  statusCode?: number;
  error?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  statusCode?: number;
  details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message ?? "Request failed");
    this.name = "ApiError";
    this.statusCode = payload.statusCode;
    this.details = payload.details;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json"
  });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new ApiError((data as ApiErrorPayload | null) ?? { message: "Request failed" });
  }

  return data as T;
}

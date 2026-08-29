/**
 * Thin fetch wrapper over the BiteSet API.
 *
 * Mirrors the mobile client's contract: bearer access token, single-flight refresh on a
 * 401, and a hard sign-out when the refresh itself fails.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  ''
);

const PREFIX = '/v1';

const ACCESS_KEY = 'roots.admin.access';
const REFRESH_KEY = 'roots.admin.refresh';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const tokens = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const parse = async (response: Response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toError = (response: Response, body: unknown) => {
  const envelope = (body as { error?: { message?: string; code?: string } })?.error;
  return new ApiError(
    response.status,
    envelope?.message ?? `Request failed (${response.status})`,
    envelope?.code ?? 'ERROR'
  );
};

/** Shared so concurrent 401s trigger exactly one refresh. */
let renewal: Promise<boolean> | null = null;

const renew = async (): Promise<boolean> => {
  const refreshToken = tokens.refresh();
  if (!refreshToken) return false;

  const response = await fetch(`${API_URL}${PREFIX}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return false;
  const body = await parse(response);
  const pair = (body as { tokens?: { access?: { token: string }; refresh?: { token: string } } })
    ?.tokens;
  if (!pair?.access?.token || !pair?.refresh?.token) return false;

  tokens.set(pair.access.token, pair.refresh.token);
  return true;
};

const renewOnce = () => {
  if (!renewal) {
    renewal = renew().finally(() => {
      renewal = null;
    });
  }
  return renewal;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, unknown>;
  anonymous?: boolean;
};

const buildUrl = (path: string, query?: Record<string, unknown>) => {
  const url = new URL(`${API_URL}${PREFIX}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
};

const send = async (path: string, options: RequestOptions, token: string | null) => {
  /**
   * A file upload must go as multipart, and the browser has to write that
   * header itself because only it knows the boundary string. Setting
   * content-type by hand here produced a body the server could not parse.
   */
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body === undefined || isForm ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
  });

  return { response, body: await parse(response) };
};

export const request = async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
  const first = await send(path, options, options.anonymous ? null : tokens.access());

  if (first.response.ok) return first.body as T;
  if (options.anonymous || first.response.status !== 401) {
    throw toError(first.response, first.body);
  }

  const renewed = await renewOnce();
  if (!renewed) {
    tokens.clear();
    throw toError(first.response, first.body);
  }

  const second = await send(path, options, tokens.access());
  if (second.response.ok) return second.body as T;
  if (second.response.status === 401) tokens.clear();
  throw toError(second.response, second.body);
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

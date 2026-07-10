/**
 * Cliente de acesso à API do Biblia.ao (apps/api).
 *
 * Nota: não usar um caminho começado por "/api/" para chamadas do browser —
 * a Azure Static Web Apps reserva esse prefixo para as suas próprias Azure
 * Functions e devolve 404 antes mesmo de chegar ao Next.js. Por isso o
 * browser chama a Container App diretamente (autorizado via CORS_ORIGINS).
 */
const PRODUCTION_API_URL =
  'https://biblia-production-api.victoriousplant-a5611e3c.westeurope.azurecontainerapps.io/api/v1';

const BASE_URL =
  typeof window === 'undefined'
    ? process.env.API_URL ?? 'http://localhost:4000/api/v1'
    : process.env.NEXT_PUBLIC_API_URL ?? PRODUCTION_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('biblia_access_token') : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: options.cache ?? 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Erro ${res.status} ao contactar a API.`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

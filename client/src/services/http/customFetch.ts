export async function customFetch(
  endpoint: string,
  options: {
    method: string;
    body?: any;
    headers?: HeadersInit;
  }
): Promise<any> {
  const { method, body, headers } = options;

  const URL = `${import.meta.env.VITE_API_URL}`;

  const isJson = !(body instanceof FormData);

  const response = await fetch(`${URL}${endpoint}`, {
    method,
    body: body && isJson ? JSON.stringify(body) : body ? body : null,
    headers: headers ? headers : undefined,
    credentials: "include",
  });

  return await response.json();
}

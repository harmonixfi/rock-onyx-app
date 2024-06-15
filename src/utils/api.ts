const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const apiFetch = async <T>(url: string, options?: RequestInit) => {
  const res = await fetch(`${baseUrl}${url}`, { ...options, cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  const data: T = await res.json();

  return data;
};

export default apiFetch;

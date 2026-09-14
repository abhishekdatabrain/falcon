const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const fetchApi = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Attach token from localStorage if present in browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // If FormData, let browser handle Content-Type boundary
  if (options.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Automatically sends HTTP-only cookies
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'An error occurred during API request');
    }

    return data;
  } catch (err) {
    throw err;
  }
};

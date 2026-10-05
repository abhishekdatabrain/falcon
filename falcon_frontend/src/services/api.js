const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

/**
 * Resolves media URLs (e.g. /uploads/file-123.jpg) dynamically based on API_BASE domain.
 * Supports relative paths, full http/https URLs, and data URLs.
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = API_BASE.replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
};

export const fetchApi = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

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
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `Server error (${res.status})`);
      }
      data = { success: true, message: text };
    }

    if (!res.ok) {
      throw new Error(data.message || 'An error occurred during API request');
    }

    return data;
  } catch (err) {
    throw err;
  }
};

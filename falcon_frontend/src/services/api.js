const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

/**
 * Resolves media URLs (e.g. /uploads/file-123.jpg) dynamically based on API_BASE domain.
 * Supports relative paths, full http/https URLs, and data URLs.
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const backendBase = API_BASE.replace(/\/api\/v1\/?$/, '');
  const targetUrl = url.trim();

  // If stored as absolute localhost/127.0.0.1 or staging domain URL in database,
  // rewrite to current backend domain if backendBase is configured
  if (
    targetUrl.startsWith('http://localhost') ||
    targetUrl.startsWith('https://localhost') ||
    targetUrl.startsWith('https://falcon.databrainit.com') ||
    targetUrl.startsWith('http://falcon.databrainit.com')
  ) {
    try {
      if (!backendBase.includes('localhost') && !backendBase.includes('127.0.0.1')) {
        const parsed = new URL(targetUrl);
        return `${backendBase}${parsed.pathname}${parsed.search}`;
      }
    } catch (e) {
      // fallback
    }
  }

  // Mixed Content Fix: Upgrade HTTP to HTTPS if backendBase is HTTPS
  if (targetUrl.startsWith('http://') && backendBase.startsWith('https://')) {
    try {
      const parsed = new URL(targetUrl);
      const backendUrl = new URL(backendBase);
      if (parsed.hostname === backendUrl.hostname) {
        return `${backendBase}${parsed.pathname}${parsed.search}`;
      }
      return targetUrl.replace(/^http:\/\//i, 'https://');
    } catch (e) {
      return targetUrl.replace(/^http:\/\//i, 'https://');
    }
  }

  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('data:')) {
    return targetUrl;
  }

  const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
  return `${backendBase}${cleanPath}`;
};

export const fetchApi = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin')) {
      defaultHeaders['x-auth-role'] = 'ADMIN';
    } else if (pathname.startsWith('/driver')) {
      defaultHeaders['x-auth-role'] = 'DRIVER';
    } else {
      defaultHeaders['x-auth-role'] = 'CUSTOMER';
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

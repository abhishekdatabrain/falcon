const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

/**
 * Resolves media URLs (e.g. /uploads/file-123.jpg) dynamically based on API_BASE domain.
 * Supports relative paths, full http/https URLs, and data URLs.
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'object') {
    url = url.image_url || url.url || url.path || url.src || '';
  }
  if (!url || typeof url !== 'string') return '';
  const targetUrl = url.trim();
  if (!targetUrl) return '';

  // 1. Data URLs (base64) and Blob URLs (local file preview)
  if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) return targetUrl;

  const cleanApiBase = API_BASE.replace(/\/$/, '');
  const backendBase = API_BASE.replace(/\/api\/v1\/?$/, '');

  // 2. Extract uploaded filename if path contains /uploads/
  if (targetUrl.includes('/uploads/')) {
    const filename = targetUrl.split('/uploads/')[1];
    if (filename) {
      // Always route through API_BASE/uploads (e.g. /api/v1/uploads/file-123.jpg)
      // Works consistently across Nginx reverse proxy, production staging, and local dev
      return `${cleanApiBase}/uploads/${filename}`;
    }
  }

  // 3. Route preset subcategories images directly from frontend public assets
  if (targetUrl.startsWith('/subcategories/') || targetUrl.startsWith('subcategories/')) {
    const filename = targetUrl.replace(/^\/?subcategories\//, '');
    return `/subcategories/${filename}`;
  }

  // 4. Route preset banners images directly from frontend public assets
  if (targetUrl.startsWith('/banners/') || targetUrl.startsWith('banners/')) {
    const filename = targetUrl.replace(/^\/?banners\//, '');
    return `/banners/${filename}`;
  }

  // 5. Absolute HTTP/HTTPS URLs (external CDNs, Unsplash)
  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    return targetUrl;
  }

  // 4. Relative paths starting with slash
  const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
  return `${backendBase}${cleanPath}`;
};

let inMemoryCsrfToken = '';

export const setCsrfToken = (token) => {
  inMemoryCsrfToken = token || '';
};

export const getCsrfTokenFromCookie = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)customer_csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
};

export const getCsrfToken = () => {
  return inMemoryCsrfToken || getCsrfTokenFromCookie();
};

export const fetchApi = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  let reqRole = 'CUSTOMER';
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin')) {
      reqRole = 'ADMIN';
      defaultHeaders['x-auth-role'] = 'ADMIN';
    } else if (pathname.startsWith('/driver')) {
      reqRole = 'DRIVER';
      defaultHeaders['x-auth-role'] = 'DRIVER';
    } else {
      defaultHeaders['x-auth-role'] = 'CUSTOMER';
    }
  }

  // Attach CSRF token on state-changing customer requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      defaultHeaders['x-csrf-token'] = csrfToken;
    }
  }

  // If FormData, let browser handle Content-Type boundary
  if (options.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  let requestBody = options.body;
  if (requestBody && typeof requestBody === 'object' && !(requestBody instanceof FormData)) {
    requestBody = JSON.stringify(requestBody);
  }

  const config = {
    ...options,
    body: requestBody,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Automatically sends HTTP-only session cookies
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

    if (data?.data?.csrfToken) {
      setCsrfToken(data.data.csrfToken);
    } else if (data?.csrfToken) {
      setCsrfToken(data.csrfToken);
    }

    if (!res.ok) {
      const err = new Error(data.message || 'An error occurred during API request');
      err.status = res.status;
      err.data = data;
      err.fieldErrors = data.fieldErrors || {};
      err.errors = data.errors || [];

      // Handle expired sessions by redirecting customers to login when authentication is required
      if (res.status === 401 && typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const isProtectedCustomerRoute =
          pathname.startsWith('/orders') ||
          pathname.startsWith('/profile') ||
          pathname.startsWith('/addresses') ||
          pathname.startsWith('/saved-addresses') ||
          pathname.startsWith('/checkout');

        if (
          isProtectedCustomerRoute &&
          !pathname.startsWith('/login') &&
          !pathname.startsWith('/admin') &&
          !pathname.startsWith('/driver')
        ) {
          window.location.href = `/login?redirect=${encodeURIComponent(pathname + window.location.search)}`;
        }
      }

      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
};

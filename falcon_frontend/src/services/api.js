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
      const err = new Error(data.message || 'An error occurred during API request');
      err.data = data;
      err.fieldErrors = data.fieldErrors || {};
      err.errors = data.errors || [];
      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
};

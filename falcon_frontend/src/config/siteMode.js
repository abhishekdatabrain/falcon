/**
 * Toggle this flag to enable or disable public Under Construction mode.
 * Admin, Driver, Auth, API, and static routes remain accessible.
 */
export const UNDER_CONSTRUCTION_MODE = true;

const MAINTENANCE_ALLOWED_PREFIXES = [
  '/admin',
  '/driver',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api',
  '/uploads',
  '/privacy-policy',
  '/privacy',
  '/delete-account',
  '/_next',
];

const STATIC_EXT_REGEX = /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf|eot|json|txt|xml)$/i;

export function isAllowedDuringMaintenance(pathname = '/') {
  if (!pathname) return false;
  if (pathname === '/favicon.ico' || STATIC_EXT_REGEX.test(pathname)) {
    return true;
  }
  return MAINTENANCE_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

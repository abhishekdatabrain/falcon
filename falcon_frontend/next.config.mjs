/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    let backendOrigin = apiUrl.replace(/\/api\/v1\/?$/, '');

    const destinationHost =
      process.env.BACKEND_INTERNAL_URL ||
      (backendOrigin.includes('localhost') || backendOrigin.includes('127.0.0.1')
        ? backendOrigin
        : 'http://localhost:5001');

    return [
      {
        source: '/uploads/:path*',
        destination: `${destinationHost}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

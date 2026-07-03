const path = require('path');

module.exports = {
  eslint: {
    // TODO: 修完存量 lint 错误后移除（npx next lint 查看）
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  // 旧路由重定向：/phase2-demo 在 refactor 中更名
  async redirects() {
    return [
      { source: '/phase2-demo', destination: '/phase-demo', permanent: true },
    ];
  },
  // 浏览器端 API 走相对路径：生产由 Nginx 代理到后端，
  // 本地 dev / npm start 由这里的 rewrites 代理到 Flask (5004)
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET || 'http://localhost:5004').replace(/\/$/, '');
    return [
      { source: '/api/:path*', destination: `${target}/api/:path*` },
      { source: '/word/:id', destination: `${target}/word/:id` },
      { source: '/words', destination: `${target}/words` },
      { source: '/exercise/:path*', destination: `${target}/exercise/:path*` },
    ];
  },
};
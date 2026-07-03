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
};
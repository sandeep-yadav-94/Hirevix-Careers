import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  
  allowedDevOrigins: ['10.87.138.126'],
};

export default nextConfig;

module.exports = {
  allowedDevOrigins: ['172.26.162.126'],
}
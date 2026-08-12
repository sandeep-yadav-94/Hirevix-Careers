import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  
  
   allowedDevOrigins: ['10.61.206.126'],
};

export default nextConfig;

module.exports = {
  allowedDevOrigins: ['10.61.206.126'],
}
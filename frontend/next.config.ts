import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  
  
   
};

export default nextConfig;

module.exports = {
  allowedDevOrigins: ['10.61.206.126'],
}
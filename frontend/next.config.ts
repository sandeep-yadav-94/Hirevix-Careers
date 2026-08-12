/// <reference types="node" />
// Minimal local NextConfig type to avoid needing external Next declarations
type NextConfig = {
  turbopack?: {
    root?: string;
  };
  allowedDevOrigins?: string[];
};

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['10.61.206.126'],
};

export default nextConfig;

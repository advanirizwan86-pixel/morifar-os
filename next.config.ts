import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  experimental: {serverActions: {bodySizeLimit: "9mb"}},
  async headers() {return [{source:"/:path*",headers:[
    {key:"X-Content-Type-Options",value:"nosniff"},
    {key:"X-Frame-Options",value:"DENY"},
    {key:"Referrer-Policy",value:"same-origin"},
    {key:"Cache-Control",value:"private, no-store"},
    {key:"Permissions-Policy",value:"camera=(self), microphone=(), geolocation=()"},
    {key:"Strict-Transport-Security",value:"max-age=31536000"}
  ]}]},
  outputFileTracingIncludes: {
    "/*": ["./server/db/schema.sql"],
  },
};

export default nextConfig;

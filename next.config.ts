import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./server/db/schema.sql"],
  },
};

export default nextConfig;

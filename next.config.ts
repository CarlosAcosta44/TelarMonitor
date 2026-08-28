import type { NextConfig } from "next";
import dns from "node:dns";

// Fix for Node 18+ undici fetch timeouts (forces IPv4 first)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

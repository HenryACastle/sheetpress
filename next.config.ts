import type { NextConfig } from "next";
// read-excel-file's node build pulls in unzipper, which has optional cloud-storage deps
// Turbopack cannot resolve. Keep both external (resolved by Node at runtime).
const nextConfig: NextConfig = { serverExternalPackages: ["read-excel-file", "unzipper"] };
export default nextConfig;

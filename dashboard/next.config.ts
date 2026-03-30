import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Monorepo: `next` is hoisted to ../node_modules (lightbulb root). Pin Turbopack root
// there so Next resolves the framework and lockfiles correctly. Parent dirs may have
// their own lockfile (e.g. pnpm). See:
// https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
const dashboardDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dashboardDir, "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: workspaceRoot
  }
};

export default nextConfig;

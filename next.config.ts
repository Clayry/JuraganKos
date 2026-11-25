import type { NextConfig } from 'next';
const nextConfig:NextConfig={experimental:{cpus:1,useTypeScriptCli:false,agentUpgrade:'security'},poweredByHeader:false,serverExternalPackages:['@libsql/client','libsql']};
export default nextConfig;

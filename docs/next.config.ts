import { createMDX } from 'fumadocs-mdx/next';
import { resolve } from 'path';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const withMDX = createMDX({
  // mdxOptions: {
  //   remarkImageOptions: {
  //     onError: "ignore", // or "hide"
  //   },
  // },
});

type MDXNextConfig = NonNullable<Parameters<typeof withMDX>[0]>;

export const config = {
  serverExternalPackages: ['typescript', 'fumadocs-typescript'],
  // output: 'export',
  // distDir: './dist',
  outputFileTracingRoot: resolve(import.meta.dirname, '..'),
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/docs/llms.mdx/docs/:path*',
      },
    ];
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
    unoptimized: true,
  },
} satisfies MDXNextConfig;
export default withMDX(config);

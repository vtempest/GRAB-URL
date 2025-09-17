import { createMDX } from 'fumadocs-mdx/next';

import type { NextConfig } from 'next';

const withMDX = createMDX({
  mdxOptions: {
    remarkImageOptions: {
      onError: "ignore", // or "hide"
    },
  },
});
export const config: NextConfig = {
 
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
    ];
  },
  output: 'export',
  distDir: './dist',
  

  reactStrictMode: false,
  images: {
    domains: ['i.imgur.com'],
    unoptimized: true,
  },
};
export default withMDX(config);

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { title, logo, github } from './customize-docs';
import Image from 'next/image';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="inline-flex items-center gap-2">
        <Image src={logo} alt="Logo" width={32} height={32} />
        {title}
      </span>
    ),
  },
  links: [
    {
      text: 'Docs',
      url: '/docs',
    },
    {
      text: 'GitHub',
      url: github,
      external: true,
    },
  ],
};

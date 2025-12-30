import { loader } from 'fumadocs-core/source';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { docs } from 'fumadocs-mdx:collections/server';
import { openapiPlugin } from 'fumadocs-openapi/server';
import { icons } from 'lucide-react';
import { createElement } from 'react';
import IconContainer from '@/components/icon';

export const source = loader({
  baseUrl: '/docs',
  plugins: [openapiPlugin()],

  source: docs.toFumadocsSource(),

  icon(iconName) {
    if (!iconName) return;

    // Convert kebab-case to PascalCase (e.g., help-circle -> HelpCircle)
    const pascalIconName = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    // Try both the original name and the converted PascalCase name
    const iconKey = (iconName in icons ? iconName : pascalIconName) as keyof typeof icons;

    if (iconKey in icons) {
      return createElement(IconContainer, {
        icon: icons[iconKey],
      });
    }
  },
});

export const openapi = createOpenAPI({
  input: ['./qwksearch-openapi.yml'],
});

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://coupangshuttle.pages.dev/sitemap.xml',
    host: 'https://coupangshuttle.pages.dev',
  };
}

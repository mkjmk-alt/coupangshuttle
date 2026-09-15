import type { MetadataRoute } from 'next';

const SITE_URL = 'https://coupangshuttle.pages.dev';
const LAST_REVIEWED = '2026-09-15';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/stops', '/guide', '/faq', '/contact', '/operations', '/privacy', '/terms'];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: LAST_REVIEWED,
    changeFrequency: route === '/' || route === '/stops' ? 'daily' : 'monthly',
    priority: route === '/' ? 1 : route === '/stops' ? 0.9 : 0.6,
  }));
}

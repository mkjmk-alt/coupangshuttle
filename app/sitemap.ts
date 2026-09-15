import type { MetadataRoute } from 'next';
import { getCenterCodes, readDataMetadata } from '@/utils/centerDirectory';

const SITE_URL = 'https://coupangshuttle.pages.dev';
const FALLBACK_REVIEWED = '2026-09-15';

function getLastModified(): string {
  const raw = readDataMetadata().lastUpdated;
  if (!raw) return FALLBACK_REVIEWED;
  const parsed = new Date(`${raw.replace(' ', 'T')}+09:00`);
  return Number.isNaN(parsed.getTime()) ? FALLBACK_REVIEWED : parsed.toISOString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = getLastModified();
  const routes = ['/', '/stops', '/guide', '/faq', '/contact', '/operations', '/privacy', '/terms', '/centers', '/updates'];
  const centerRoutes = getCenterCodes().map((code) => `/centers/${encodeURIComponent(code)}`);

  return [...routes, ...centerRoutes].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '/' || route === '/stops' ? 'daily' : 'monthly',
    priority: route === '/' ? 1 : route === '/stops' ? 0.9 : route.startsWith('/centers/') ? 0.7 : 0.6,
  }));
}

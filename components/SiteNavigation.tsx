'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: '노선 조회', shortLabel: '조회', icon: 'search' },
  { href: '/operations', label: '운영·데이터 정책', shortLabel: '운영', icon: 'arrow' },
  { href: '/privacy', label: '개인정보처리방침', shortLabel: '개인정보', icon: 'privacy' },
  { href: '/terms', label: '이용약관', shortLabel: '약관', icon: 'terms' },
  { href: '/contact', label: '문의·제보', shortLabel: '문의', icon: 'support' },
];

type NavigationIconName = (typeof navigation)[number]['icon'];

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const paths: Record<NavigationIconName, string> = {
    search: 'M11 4a7 7 0 1 0 4.9 12l4.1 4.1M18 18l2 2',
    arrow: 'M5 19 19 5M9 5h10v10',
    privacy: 'M12 3 19 6v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3Z',
    terms: 'M7 4h10M7 8h10M7 12h6M5 20h14',
    support: 'M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.6-.8L4 20l1.8-3.5A7.4 7.4 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z',
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

export default function SiteNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const visibleNavigation = mobile
    ? navigation.filter((item) => ['/', '/operations', '/contact'].includes(item.href))
    : navigation;

  return (
    <div className={mobile ? 'mobile-nav-links' : 'sidebar-nav'}>
      {visibleNavigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? 'page' : undefined}
          className={`${mobile ? 'mobile-nav-link' : 'sidebar-link'} ${pathname === item.href ? 'is-active' : ''}`}
        >
          <span className={mobile ? 'mobile-nav-icon' : 'sidebar-icon'} aria-hidden="true">
            <NavigationIcon name={item.icon} />
          </span>
          <span>{mobile ? item.shortLabel : item.label}</span>
        </Link>
      ))}
    </div>
  );
}

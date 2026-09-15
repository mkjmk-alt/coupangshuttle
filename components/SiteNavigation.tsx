'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: '지도', shortLabel: '지도', icon: 'search' },
  { href: '/stops', label: '정류장 안내', shortLabel: '정류장', icon: 'pin' },
  { href: '/centers', label: '센터 안내', shortLabel: '센터', icon: 'center' },
  { href: '/updates', label: '데이터 변경 이력', shortLabel: '변경', icon: 'updates' },
  { href: '/guide', label: '셔틀 이용 가이드', shortLabel: '가이드', icon: 'guide' },
  { href: '/faq', label: '자주 묻는 질문', shortLabel: 'FAQ', icon: 'faq' },
  { href: '/privacy', label: '개인정보처리방침', shortLabel: '개인정보', icon: 'privacy' },
  { href: '/terms', label: '이용약관', shortLabel: '약관', icon: 'terms' },
  { href: '/contact', label: '문의·제보', shortLabel: '문의', icon: 'support' },
];

type NavigationIconName = (typeof navigation)[number]['icon'];

const primaryNavigation = navigation.filter((item) => ['/', '/stops', '/contact'].includes(item.href));

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const paths: Record<NavigationIconName, string> = {
    search: 'M11 4a7 7 0 1 0 4.9 12l4.1 4.1M18 18l2 2',
    pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    privacy: 'M12 3 19 6v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3Z',
    terms: 'M7 4h10M7 8h10M7 12h6M5 20h14',
    support: 'M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.6-.8L4 20l1.8-3.5A7.4 7.4 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z',
    guide: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 1 6.5 18H20',
    faq: 'M12 18h.01M9.1 9a3 3 0 1 1 5.1 2.1c-1.3 1.1-2.2 1.6-2.2 3.4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    center: 'M4 5h16v14H4z M8 9h8M8 13h5',
    updates: 'M5 5h14v14H5z M8 9h8M8 13h5',
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

export default function SiteNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const visibleNavigation = primaryNavigation;

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

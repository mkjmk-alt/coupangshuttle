'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CenterDirectoryItem } from '@/utils/centerDirectory';

export default function CenterDirectory({ items }: { items: CenterDirectoryItem[] }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');

  const visibleItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      [item.code, item.name, item.region, item.address]
        .join(' ')
        .toLocaleLowerCase('ko-KR')
        .includes(normalizedQuery),
    );
  }, [items, normalizedQuery]);

  return (
    <section className="center-directory-panel" aria-labelledby="center-directory-list-title">
      <div className="center-directory-tools">
        <label htmlFor="center-directory-search">
          <span>센터 검색</span>
          <input
            id="center-directory-search"
            className="premium-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="센터명·코드·지역으로 검색"
          />
        </label>
        <p aria-live="polite">{visibleItems.length}개 센터 표시</p>
      </div>

      <div className="center-directory-list" id="center-directory-list-title">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <article key={item.code} className="center-directory-item">
              <div>
                <p className="center-directory-code">{item.code} · {item.region}</p>
                <h2>{item.name}</h2>
                <p className="center-directory-address">{item.address || '센터 주소가 등록되지 않았습니다.'}</p>
                <p className="center-directory-stats">
                  근무조 {item.shiftCount}개 · 노선 {item.routeCount}개 · 정류장 {item.stopCount}개
                </p>
              </div>
              <div className="center-directory-actions">
                <Link href={`/centers/${encodeURIComponent(item.code)}`}>센터 정보 보기</Link>
                <Link href={`/stops?center=${encodeURIComponent(item.code)}`}>정류장 조회</Link>
              </div>
            </article>
          ))
        ) : (
          <div className="content-empty-state">
            <strong>검색 결과가 없습니다.</strong>
            <p>센터명이나 코드의 일부를 지우고 다시 검색해 보세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: '검색어는 2자 이상 100자 이하로 입력해 주세요.' },
      { status: 400 },
    );
  }

  const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('format', 'jsonv2');
  searchUrl.searchParams.set('addressdetails', '1');
  searchUrl.searchParams.set('namedetails', '1');
  searchUrl.searchParams.set('countrycodes', 'kr');
  searchUrl.searchParams.set('limit', '6');

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.7',
        'User-Agent': 'CoupangShuttleMap/1.0 (https://coupangshuttle.pages.dev/editor)',
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed with ${response.status}`);
    }

    const data = await response.json() as NominatimResult[];
    const results = data
      .map((result) => {
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }

        const fallbackName = result.display_name.split(',')[0]?.trim() || query;

        return {
          id: String(result.place_id),
          name: result.name?.trim() || fallbackName,
          address: result.display_name,
          latitude,
          longitude,
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null);

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      },
    );
  } catch (error) {
    console.error('Location search failed:', error);
    return NextResponse.json(
      { error: '위치 검색 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 502 },
    );
  }
}

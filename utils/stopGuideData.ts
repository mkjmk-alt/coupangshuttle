export interface GuideStopRecord {
  Name: string;
  Time: string;
  Address: string;
  Latitude?: string | number;
  Longitude?: string | number;
  Remarks?: string;
  Info?: string;
  [key: string]: unknown;
}

export interface GuideCenterCard {
  center?: {
    name?: string;
  };
  shifts?: Record<string, Record<string, GuideStopRecord[]>>;
}

export type GuideShuttleData = Record<string, GuideCenterCard>;

export interface GuideStop extends GuideStopRecord {
  shift: string;
  route: string;
  routeIndex: number;
  fcCode: string;
  fcName: string;
}

export function getGuideStops(
  data: GuideShuttleData | null | undefined,
  selectedFC: string,
  selectedShift: string,
  selectedRoute: string,
): GuideStop[] {
  if (!data || !selectedFC) return [];

  const card = data[selectedFC];
  if (!card?.shifts) return [];

  const stops: GuideStop[] = [];
  const fcName = card.center?.name || selectedFC;

  Object.entries(card.shifts).forEach(([shiftName, routes]) => {
    if (selectedShift && shiftName !== selectedShift) return;

    Object.entries(routes).forEach(([routeName, routeStops]) => {
      if (selectedRoute && routeName !== selectedRoute) return;

      routeStops.forEach((stop, index) => {
        stops.push({
          ...stop,
          shift: shiftName,
          route: routeName,
          routeIndex: index + 1,
          fcCode: selectedFC,
          fcName,
        });
      });
    });
  });

  return stops;
}

export function filterGuideStops(stops: GuideStop[], query: string): GuideStop[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  if (!normalizedQuery) return stops;

  return stops.filter((stop) => {
    const searchableText = [stop.Name, stop.Address, stop.Remarks, stop.Info]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('ko-KR');

    return searchableText.includes(normalizedQuery);
  });
}

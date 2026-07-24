interface ShuttleIndexPayload<T> {
  version: string;
  centers: T;
}

export interface InitialShuttleData<T> {
  data: T;
  version: string;
  usesCenterFiles: boolean;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-cache',
    signal,
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`${url} did not return JSON`);
  }

  return response.json() as Promise<T>;
}

export async function loadInitialShuttleData<T>(): Promise<InitialShuttleData<T>> {
  try {
    const index = await fetchJson<ShuttleIndexPayload<T>>('/data/shuttle_index.json');
    if (!index?.version || !index?.centers) {
      throw new Error('Shuttle index is missing required fields');
    }

    return {
      data: index.centers,
      version: index.version,
      usesCenterFiles: true,
    };
  } catch (indexError) {
    console.warn('Center index unavailable; using the full shuttle data file.', indexError);
    const fullData = await fetchJson<T>('/data/shuttle_data.json');
    return {
      data: fullData,
      version: '',
      usesCenterFiles: false,
    };
  }
}

export function loadShuttleCenter<T>(
  fcCode: string,
  version: string,
  signal?: AbortSignal,
): Promise<T> {
  const safeCode = encodeURIComponent(fcCode);
  const versionQuery = version ? `?v=${encodeURIComponent(version)}` : '';
  return fetchJson<T>(`/data/centers/${safeCode}.json${versionQuery}`, signal);
}

export interface ShuttleStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  time?: string;
  description?: string;
  route?: string;
  index?: number;
  color?: string;
}

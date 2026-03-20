/**
 * List of vibrant, premium colors for shuttle routes.
 */
const ROUTE_COLORS = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald
    '#F43F5E', // Rose
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#84CC16', // Lime
    '#D946EF', // Fuchsia
    '#14B8A6', // Teal
];

/**
 * Returns a consistent color for a given route name or index.
 */
export const getRouteColor = (routeName: string | undefined, index?: number): string => {
    if (typeof index === 'number') {
        return ROUTE_COLORS[index % ROUTE_COLORS.length];
    }
    
    if (!routeName) return ROUTE_COLORS[0];
    
    let hash = 0;
    for (let i = 0; i < routeName.length; i++) {
        hash = routeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use a large prime to spread colors more effectively
    const spreadIndex = Math.abs(hash * 31) % ROUTE_COLORS.length;
    return ROUTE_COLORS[spreadIndex];
};

/**
 * List of vibrant, premium colors for shuttle routes.
 */
const ROUTE_COLORS = [
    '#4338ca', // Indigo
    '#059669', // Emerald
    '#e11d48', // Rose
    '#d97706', // Amber
    '#7c3aed', // Violet
    '#0891b2', // Cyan
    '#ea580c', // Orange
    '#db2777', // Pink
    '#2563eb', // Blue
    '#9333ea', // Purple
    '#16a34a', // Green
    '#ca8a04', // Yellow
    '#be185d', // Deep Pink
    '#4f46e5', // Brand Indigo
];

/**
 * Returns a consistent color for a given route name.
 */
export const getRouteColor = (routeName: string | undefined): string => {
    if (!routeName) return ROUTE_COLORS[0];
    
    let hash = 0;
    for (let i = 0; i < routeName.length; i++) {
        hash = routeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % ROUTE_COLORS.length;
    return ROUTE_COLORS[index];
};

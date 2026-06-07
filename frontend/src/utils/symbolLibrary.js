// Built-in vector symbol libraries (SVG formatted)
// Colors:
// Gold: #FBBF24 (fill), #D97706 (stroke), #78350F (text)
// Silver: #E5E7EB (fill), #9CA3AF (stroke), #374151 (text)
// Bronze: #D97706 (fill), #B45309 (stroke), #FFEDD5 (text)

const goldColor = { fill: '#FBBF24', stroke: '#D97706', text: '#78350F' };
const silverColor = { fill: '#E5E7EB', stroke: '#9CA3AF', text: '#374151' };
const bronzeColor = { fill: '#D97706', stroke: '#B45309', text: '#FFEDD5' };

export const symbolLibrary = {
  // Medal set
  medal_gold: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M16 8L24 32L32 8" stroke="#EF4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 8L40 32L32 8" stroke="#3B82F6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="40" r="18" fill="${goldColor.fill}" stroke="${goldColor.stroke}" stroke-width="4"/>
      <circle cx="32" cy="40" r="13" fill="none" stroke="${goldColor.stroke}" stroke-width="1.5" stroke-dasharray="4 2"/>
      <text x="32" y="45" fill="${goldColor.text}" font-size="16" font-weight="900" text-anchor="middle" font-family="sans-serif">1</text>
    </svg>
  `,
  medal_silver: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M16 8L24 32L32 8" stroke="#EF4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 8L40 32L32 8" stroke="#3B82F6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="40" r="18" fill="${silverColor.fill}" stroke="${silverColor.stroke}" stroke-width="4"/>
      <circle cx="32" cy="40" r="13" fill="none" stroke="${silverColor.stroke}" stroke-width="1.5" stroke-dasharray="4 2"/>
      <text x="32" y="45" fill="${silverColor.text}" font-size="16" font-weight="900" text-anchor="middle" font-family="sans-serif">2</text>
    </svg>
  `,
  medal_bronze: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M16 8L24 32L32 8" stroke="#EF4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 8L40 32L32 8" stroke="#3B82F6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="32" cy="40" r="18" fill="${bronzeColor.fill}" stroke="${bronzeColor.stroke}" stroke-width="4"/>
      <circle cx="32" cy="40" r="13" fill="none" stroke="${bronzeColor.stroke}" stroke-width="1.5" stroke-dasharray="4 2"/>
      <text x="32" y="45" fill="${bronzeColor.text}" font-size="16" font-weight="900" text-anchor="middle" font-family="sans-serif">3</text>
    </svg>
  `,

  // Trophy set
  trophy_gold: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M16 16H48V28C48 36.8 40.8 44 32 44C23.2 44 16 36.8 16 28V16Z" fill="${goldColor.fill}" stroke="${goldColor.stroke}" stroke-width="4"/>
      <path d="M16 22H8V28C8 32.4 11.6 36 16 36" stroke="${goldColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <path d="M48 22H56V28C56 32.4 52.4 36 48 36" stroke="${goldColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <path d="M32 44V52" stroke="${goldColor.stroke}" stroke-width="4"/>
      <path d="M20 56H44" stroke="${goldColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <text x="32" y="32" fill="${goldColor.text}" font-size="14" font-weight="900" text-anchor="middle" font-family="sans-serif">1</text>
    </svg>
  `,
  trophy_silver: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M16 16H48V28C48 36.8 40.8 44 32 44C23.2 44 16 36.8 16 28V16Z" fill="${silverColor.fill}" stroke="${silverColor.stroke}" stroke-width="4"/>
      <path d="M16 22H8V28C8 32.4 11.6 36 16 36" stroke="${silverColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <path d="M48 22H56V28C56 32.4 52.4 36 48 36" stroke="${silverColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <path d="M32 44V52" stroke="${silverColor.stroke}" stroke-width="4"/>
      <path d="M20 56H44" stroke="${silverColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <text x="32" y="32" fill="${silverColor.text}" font-size="14" font-weight="900" text-anchor="middle" font-family="sans-serif">2</text>
    </svg>
  `,
  trophy_bronze: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M16 16H48V28C48 36.8 40.8 44 32 44C23.2 44 16 36.8 16 28V16Z" fill="${bronzeColor.fill}" stroke="${bronzeColor.stroke}" stroke-width="4"/>
      <path d="M16 22H8V28C8 32.4 11.6 36 16 36" stroke="${bronzeColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <path d="M48 22H56V28C56 32.4 52.4 36 48 36" stroke="${bronzeColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <path d="M32 44V52" stroke="${bronzeColor.stroke}" stroke-width="4"/>
      <path d="M20 56H44" stroke="${bronzeColor.stroke}" stroke-width="4" stroke-linecap="round"/>
      <text x="32" y="32" fill="${bronzeColor.text}" font-size="14" font-weight="900" text-anchor="middle" font-family="sans-serif">3</text>
    </svg>
  `,

  // Star set
  star_gold: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M32 6L39.5 21.5L56.5 24L44 36.5L47 53.5L32 45.5L17 53.5L20 36.5L7.5 24L24.5 21.5L32 6Z" fill="${goldColor.fill}" stroke="${goldColor.stroke}" stroke-width="4" stroke-linejoin="round"/>
      <text x="32" y="36" fill="${goldColor.text}" font-size="13" font-weight="900" text-anchor="middle" font-family="sans-serif">1</text>
    </svg>
  `,
  star_silver: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M32 6L39.5 21.5L56.5 24L44 36.5L47 53.5L32 45.5L17 53.5L20 36.5L7.5 24L24.5 21.5L32 6Z" fill="${silverColor.fill}" stroke="${silverColor.stroke}" stroke-width="4" stroke-linejoin="round"/>
      <text x="32" y="36" fill="${silverColor.text}" font-size="13" font-weight="900" text-anchor="middle" font-family="sans-serif">2</text>
    </svg>
  `,
  star_bronze: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M32 6L39.5 21.5L56.5 24L44 36.5L47 53.5L32 45.5L17 53.5L20 36.5L7.5 24L24.5 21.5L32 6Z" fill="${bronzeColor.fill}" stroke="${bronzeColor.stroke}" stroke-width="4" stroke-linejoin="round"/>
      <text x="32" y="36" fill="${bronzeColor.text}" font-size="13" font-weight="900" text-anchor="middle" font-family="sans-serif">3</text>
    </svg>
  `,

  // Circle set
  circle_gold: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <circle cx="32" cy="32" r="24" fill="${goldColor.fill}" stroke="${goldColor.stroke}" stroke-width="4"/>
      <text x="32" y="38" fill="${goldColor.text}" font-size="18" font-weight="900" text-anchor="middle" font-family="sans-serif">1</text>
    </svg>
  `,
  circle_silver: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <circle cx="32" cy="32" r="24" fill="${silverColor.fill}" stroke="${silverColor.stroke}" stroke-width="4"/>
      <text x="32" y="38" fill="${silverColor.text}" font-size="18" font-weight="900" text-anchor="middle" font-family="sans-serif">2</text>
    </svg>
  `,
  circle_bronze: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <circle cx="32" cy="32" r="24" fill="${bronzeColor.fill}" stroke="${bronzeColor.stroke}" stroke-width="4"/>
      <text x="32" y="38" fill="${bronzeColor.text}" font-size="18" font-weight="900" text-anchor="middle" font-family="sans-serif">3</text>
    </svg>
  `,

  // Premium Badge set
  badge_gold: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M32 6L50 14V34C50 44.8 42.4 54.8 32 58C21.6 54.8 14 44.8 14 34V14L32 6Z" fill="${goldColor.fill}" stroke="${goldColor.stroke}" stroke-width="4" stroke-linejoin="round"/>
      <text x="32" y="36" fill="${goldColor.text}" font-size="18" font-weight="900" text-anchor="middle" font-family="sans-serif">1</text>
    </svg>
  `,
  badge_silver: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M32 6L50 14V34C50 44.8 42.4 54.8 32 58C21.6 54.8 14 44.8 14 34V14L32 6Z" fill="${silverColor.fill}" stroke="${silverColor.stroke}" stroke-width="4" stroke-linejoin="round"/>
      <text x="32" y="36" fill="${silverColor.text}" font-size="18" font-weight="900" text-anchor="middle" font-family="sans-serif">2</text>
    </svg>
  `,
  badge_bronze: (size, opacity) => `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
      <path d="M32 6L50 14V34C50 44.8 42.4 54.8 32 58C21.6 54.8 14 44.8 14 34V14L32 6Z" fill="${bronzeColor.fill}" stroke="${bronzeColor.stroke}" stroke-width="4" stroke-linejoin="round"/>
      <text x="32" y="36" fill="${bronzeColor.text}" font-size="18" font-weight="900" text-anchor="middle" font-family="sans-serif">3</text>
    </svg>
  `,
};

// Helper to get SVG string or convert to preloaded Data URL for Canvas drawing
export const getSymbolSVGContent = (key, size = 40, opacity = 1) => {
  const drawFunc = symbolLibrary[key];
  if (drawFunc) {
    return drawFunc(size, opacity);
  }
  return '';
};

// Converts raw SVG string to base64 Data URL
export const getSymbolDataURL = (key, size = 40, opacity = 1) => {
  const svgContent = getSymbolSVGContent(key, size, opacity);
  if (!svgContent) return '';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent.trim());
};

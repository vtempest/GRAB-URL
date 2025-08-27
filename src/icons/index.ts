// Do a Barrel Roll (auto-generated) index of SVG icons as JS exports, tree shaking to only the icons used.

/**
 * Shared utility function for processing SVG icons
 * @param {Object} options - Configuration options
 * @param {boolean} [options.raw] - Whether to return the raw SVG string or an img tag
 * @param {string[]} [options.colors] - Array of hex colors to replace existing colors
 * @param {number|string} [options.width] - Width of the SVG
 * @param {number|string} [options.height] - Height of the SVG
 * @param {number|string} [options.size] - Size for both width and height (overrides width/height)
 * @param {string} svgString - The original SVG content
 * @returns {string} SVG string with applied customizations
 */
function customSVG( options: LoadingOptions, svgString: string) {
    const { colors = [], width, height, size, raw = false } = options;

    const widthMatch = svgString.match(/width="[^"]*"/);
    const heightMatch = svgString.match(/height="[^"]*"/);
    const finalWidth = size || width || widthMatch?.[1] || '100';
    const finalHeight = size || height || heightMatch?.[1] || '100';

    if (width || height || size) {
        svgString = svgString.replace(/width="[^"]*"/, `width="${finalWidth}px"`);
        svgString = svgString.replace(/height="[^"]*"/, `height="${finalHeight}px"`);
    }


    // If colors array is provided, replace hex colors in order of appearance
    if (colors && colors.length > 0) {
        const hexColorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g;
        let colorIndex = 0;
        
        svgString = svgString.replace(hexColorRegex, (match) => {
            if (colorIndex < colors.length) {
                const replacement = colors[colorIndex];
                colorIndex++;
                return replacement?.startsWith('#') ? replacement : `#${replacement}`;
            }
            return match; // Keep original color if no replacement available
        });
    }
    if (!raw) 
        svgString = (width || height || size ? `<img width="${finalWidth}" height="${finalHeight}"` : '<img') + ` alt="icon" src="data:image/svg+xml;utf8,${encodeURIComponent(svgString)}" />`

    return svgString;
}
interface LoadingOptions {
  /** Array of hex colors to replace existing colors, in order of appearance in SVG*/
  colors?: string[];
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Size for both width and height (overrides width/height) */
  size?: number;
  /** Whether to return the raw SVG string or an img tag */
  raw?: boolean;
}

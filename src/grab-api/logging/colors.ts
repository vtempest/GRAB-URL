/**
 * Available color names
 */
export enum ColorName {
    RESET = 'reset',
    BLACK = 'black',
    RED = 'red',
    GREEN = 'green',
    YELLOW = 'yellow',
    BLUE = 'blue',
    MAGENTA = 'magenta',
    CYAN = 'cyan',
    WHITE = 'white',
    GRAY = 'gray',
    BRIGHT_RED = 'brightRed',
    BRIGHT_GREEN = 'brightGreen',
    BRIGHT_YELLOW = 'brightYellow',
    BRIGHT_BLUE = 'brightBlue',
    BRIGHT_MAGENTA = 'brightMagenta',
    BRIGHT_CYAN = 'brightCyan',
    BRIGHT_WHITE = 'brightWhite',
    BG_RED = 'bgRed',
    BG_GREEN = 'bgGreen',
    BG_YELLOW = 'bgYellow',
    BG_BLUE = 'bgBlue',
    BG_MAGENTA = 'bgMagenta',
    BG_CYAN = 'bgCyan',
    BG_WHITE = 'bgWhite',
    BG_GRAY = 'bgGray',
    BG_BLACK = 'bgBlack',
    BG_BRIGHT_RED = 'bgBrightRed',
    BG_BRIGHT_GREEN = 'bgBrightGreen',
    BG_BRIGHT_YELLOW = 'bgBrightYellow',
    BG_BRIGHT_BLUE = 'bgBrightBlue',
    BG_BRIGHT_MAGENTA = 'bgBrightMagenta',
    BG_BRIGHT_CYAN = 'bgBrightCyan',
    BG_BRIGHT_WHITE = 'bgBrightWhite',
}

/**
 * Color mapping with ANSI codes and HTML hex values
 */
const colorMap: Record<ColorName, [number, string]> = {
    [ColorName.RESET]: [0, '000000'],
    [ColorName.BLACK]: [30, '000000'],
    [ColorName.RED]: [31, 'ff0000'],
    [ColorName.GREEN]: [32, '00ff00'],
    [ColorName.YELLOW]: [33, 'ffff00'],
    [ColorName.BLUE]: [34, '0000ff'],
    [ColorName.MAGENTA]: [35, 'ff00ff'],
    [ColorName.CYAN]: [36, '00ffff'],
    [ColorName.WHITE]: [37, 'ffffff'],
    [ColorName.GRAY]: [90, '808080'],
    [ColorName.BRIGHT_RED]: [91, 'ff5555'],
    [ColorName.BRIGHT_GREEN]: [92, '55ff55'],
    [ColorName.BRIGHT_YELLOW]: [93, 'ffff55'],
    [ColorName.BRIGHT_BLUE]: [94, '5555ff'],
    [ColorName.BRIGHT_MAGENTA]: [95, 'ff55ff'],
    [ColorName.BRIGHT_CYAN]: [96, '55ffff'],
    [ColorName.BRIGHT_WHITE]: [97, 'ffffff'],
    [ColorName.BG_BLACK]: [40, '000000'],
    [ColorName.BG_RED]: [41, 'ff0000'],
    [ColorName.BG_GREEN]: [42, '00ff00'],
    [ColorName.BG_YELLOW]: [43, 'ffff00'],
    [ColorName.BG_BLUE]: [44, '0000ff'],
    [ColorName.BG_MAGENTA]: [45, 'ff00ff'],
    [ColorName.BG_CYAN]: [46, '00ffff'],
    [ColorName.BG_WHITE]: [47, 'ffffff'],
    [ColorName.BG_GRAY]: [100, '808080'],
    [ColorName.BG_BRIGHT_RED]: [101, 'ff8888'],
    [ColorName.BG_BRIGHT_GREEN]: [102, '88ff88'],
    [ColorName.BG_BRIGHT_YELLOW]: [103, 'ffff88'],
    [ColorName.BG_BRIGHT_BLUE]: [104, '8888ff'],
    [ColorName.BG_BRIGHT_MAGENTA]: [105, 'ff88ff'],
    [ColorName.BG_BRIGHT_CYAN]: [106, '88ffff'],
    [ColorName.BG_BRIGHT_WHITE]: [107, 'ffffff'],
};

/**
 * @file logging/colors.ts
 * @description Color definitions and mapping for the Grab API logger.
 * Supports both ANSI (terminal) and HTML formats.
 */

/**
 * Returns color codes based on the specified format
 */
export function getColors(format: 'html' | 'ansi' = 'ansi'): Record<ColorName, string> {
    const colors: Record<ColorName, string> = {} as Record<ColorName, string>;
    for (const [name, [ansiCode, hexCode]] of Object.entries(colorMap)) {
        colors[name as ColorName] = format === 'html' ? '#' + hexCode : '\x1b[' + ansiCode + 'm';
    }
    return colors;
}

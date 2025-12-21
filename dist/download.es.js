#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import require$$0 from "readline";
import grab from "./grab-api.es.js";
import { pathToFileURL } from "url";
import require$$4 from "events";
import { log } from "./log.es.js";
const spinners = {
  dots: [
    "⠋",
    "⠙",
    "⠹",
    "⠸",
    "⠼",
    "⠴",
    "⠦",
    "⠧",
    "⠇",
    "⠏"
  ],
  dots2: [
    "⣾",
    "⣽",
    "⣻",
    "⢿",
    "⡿",
    "⣟",
    "⣯",
    "⣷"
  ],
  dots3: [
    "⠋",
    "⠙",
    "⠚",
    "⠞",
    "⠖",
    "⠦",
    "⠴",
    "⠲",
    "⠳",
    "⠓"
  ],
  dots4: [
    "⠄",
    "⠆",
    "⠇",
    "⠋",
    "⠙",
    "⠸",
    "⠰",
    "⠠",
    "⠰",
    "⠸",
    "⠙",
    "⠋",
    "⠇",
    "⠆"
  ],
  dots5: [
    "⠋",
    "⠙",
    "⠚",
    "⠒",
    "⠂",
    "⠂",
    "⠒",
    "⠲",
    "⠴",
    "⠦",
    "⠖",
    "⠒",
    "⠐",
    "⠐",
    "⠒",
    "⠓",
    "⠋"
  ],
  dots6: [
    "⠁",
    "⠉",
    "⠙",
    "⠚",
    "⠒",
    "⠂",
    "⠂",
    "⠒",
    "⠲",
    "⠴",
    "⠤",
    "⠄",
    "⠄",
    "⠤",
    "⠴",
    "⠲",
    "⠒",
    "⠂",
    "⠂",
    "⠒",
    "⠚",
    "⠙",
    "⠉",
    "⠁"
  ],
  dots7: [
    "⠈",
    "⠉",
    "⠋",
    "⠓",
    "⠒",
    "⠐",
    "⠐",
    "⠒",
    "⠖",
    "⠦",
    "⠤",
    "⠠",
    "⠠",
    "⠤",
    "⠦",
    "⠖",
    "⠒",
    "⠐",
    "⠐",
    "⠒",
    "⠓",
    "⠋",
    "⠉",
    "⠈"
  ],
  dots8: [
    "⠁",
    "⠁",
    "⠉",
    "⠙",
    "⠚",
    "⠒",
    "⠂",
    "⠂",
    "⠒",
    "⠲",
    "⠴",
    "⠤",
    "⠄",
    "⠄",
    "⠤",
    "⠠",
    "⠠",
    "⠤",
    "⠦",
    "⠖",
    "⠒",
    "⠐",
    "⠐",
    "⠒",
    "⠓",
    "⠋",
    "⠉",
    "⠈",
    "⠈"
  ],
  dots9: [
    "⢹",
    "⢺",
    "⢼",
    "⣸",
    "⣇",
    "⡧",
    "⡗",
    "⡏"
  ],
  dots10: [
    "⢄",
    "⢂",
    "⢁",
    "⡁",
    "⡈",
    "⡐",
    "⡠"
  ],
  dots11: [
    "⠁",
    "⠂",
    "⠄",
    "⡀",
    "⢀",
    "⠠",
    "⠐",
    "⠈"
  ],
  dots12: [
    "⢀⠀",
    "⡀⠀",
    "⠄⠀",
    "⢂⠀",
    "⡂⠀",
    "⠅⠀",
    "⢃⠀",
    "⡃⠀",
    "⠍⠀",
    "⢋⠀",
    "⡋⠀",
    "⠍⠁",
    "⢋⠁",
    "⡋⠁",
    "⠍⠉",
    "⠋⠉",
    "⠋⠉",
    "⠉⠙",
    "⠉⠙",
    "⠉⠩",
    "⠈⢙",
    "⠈⡙",
    "⢈⠩",
    "⡀⢙",
    "⠄⡙",
    "⢂⠩",
    "⡂⢘",
    "⠅⡘",
    "⢃⠨",
    "⡃⢐",
    "⠍⡐",
    "⢋⠠",
    "⡋⢀",
    "⠍⡁",
    "⢋⠁",
    "⡋⠁",
    "⠍⠉",
    "⠋⠉",
    "⠋⠉",
    "⠉⠙",
    "⠉⠙",
    "⠉⠩",
    "⠈⢙",
    "⠈⡙",
    "⠈⠩",
    "⠀⢙",
    "⠀⡙",
    "⠀⠩",
    "⠀⢘",
    "⠀⡘",
    "⠀⠨",
    "⠀⢐",
    "⠀⡐",
    "⠀⠠",
    "⠀⢀",
    "⠀⡀"
  ],
  dots13: [
    "⣼",
    "⣹",
    "⢻",
    "⠿",
    "⡟",
    "⣏",
    "⣧",
    "⣶"
  ],
  dots14: [
    "⠉⠉",
    "⠈⠙",
    "⠀⠹",
    "⠀⢸",
    "⠀⣰",
    "⢀⣠",
    "⣀⣀",
    "⣄⡀",
    "⣆⠀",
    "⡇⠀",
    "⠏⠀",
    "⠋⠁"
  ],
  dotsCircle: [
    "⢎ ",
    "⠎⠁",
    "⠊⠑",
    "⠈⠱",
    " ⡱",
    "⢀⡰",
    "⢄⡠",
    "⢆⡀"
  ],
  sand: [
    "⠁",
    "⠂",
    "⠄",
    "⡀",
    "⡈",
    "⡐",
    "⡠",
    "⣀",
    "⣁",
    "⣂",
    "⣄",
    "⣌",
    "⣔",
    "⣤",
    "⣥",
    "⣦",
    "⣮",
    "⣶",
    "⣷",
    "⣿",
    "⡿",
    "⠿",
    "⢟",
    "⠟",
    "⡛",
    "⠛",
    "⠫",
    "⢋",
    "⠋",
    "⠍",
    "⡉",
    "⠉",
    "⠑",
    "⠡",
    "⢁"
  ],
  line: [
    "-",
    "\\",
    "|",
    "/"
  ],
  line2: [
    "⠂",
    "-",
    "–",
    "—",
    "–",
    "-"
  ],
  pipe: [
    "┤",
    "┘",
    "┴",
    "└",
    "├",
    "┌",
    "┬",
    "┐"
  ],
  simpleDots: [
    ".  ",
    ".. ",
    "...",
    "   "
  ],
  simpleDotsScrolling: [
    ".  ",
    ".. ",
    "...",
    " ..",
    "  .",
    "   "
  ],
  star: [
    "✶",
    "✸",
    "✹",
    "✺",
    "✹",
    "✷"
  ],
  star2: [
    "+",
    "x",
    "*"
  ],
  flip: [
    "_",
    "_",
    "_",
    "-",
    "`",
    "`",
    "'",
    "´",
    "-",
    "_",
    "_",
    "_"
  ],
  hamburger: [
    "☱",
    "☲",
    "☴"
  ],
  growVertical: [
    "▁",
    "▃",
    "▄",
    "▅",
    "▆",
    "▇",
    "▆",
    "▅",
    "▄",
    "▃"
  ],
  growHorizontal: [
    "▏",
    "▎",
    "▍",
    "▌",
    "▋",
    "▊",
    "▉",
    "▊",
    "▋",
    "▌",
    "▍",
    "▎"
  ],
  balloon: [
    " ",
    ".",
    "o",
    "O",
    "@",
    "*",
    " "
  ],
  balloon2: [
    ".",
    "o",
    "O",
    "°",
    "O",
    "o",
    "."
  ],
  noise: [
    "▓",
    "▒",
    "░"
  ],
  bounce: [
    "⠁",
    "⠂",
    "⠄",
    "⠂"
  ],
  boxBounce: [
    "▖",
    "▘",
    "▝",
    "▗"
  ],
  boxBounce2: [
    "▌",
    "▀",
    "▐",
    "▄"
  ],
  triangle: [
    "◢",
    "◣",
    "◤",
    "◥"
  ],
  binary: [
    "010010",
    "001100",
    "100101",
    "111010",
    "111101",
    "010111",
    "101011",
    "111000",
    "110011",
    "110101"
  ],
  arc: [
    "◜",
    "◠",
    "◝",
    "◞",
    "◡",
    "◟"
  ],
  circle: [
    "◡",
    "⊙",
    "◠"
  ],
  squareCorners: [
    "◰",
    "◳",
    "◲",
    "◱"
  ],
  circleQuarters: [
    "◴",
    "◷",
    "◶",
    "◵"
  ],
  circleHalves: [
    "◐",
    "◓",
    "◑",
    "◒"
  ],
  squish: [
    "╫",
    "╪"
  ],
  toggle: [
    "⊶",
    "⊷"
  ],
  toggle2: [
    "▫",
    "▪"
  ],
  toggle3: [
    "□",
    "■"
  ],
  toggle4: [
    "■",
    "□",
    "▪",
    "▫"
  ],
  toggle5: [
    "▮",
    "▯"
  ],
  toggle6: [
    "ဝ",
    "၀"
  ],
  toggle7: [
    "⦾",
    "⦿"
  ],
  toggle8: [
    "◍",
    "◌"
  ],
  toggle9: [
    "◉",
    "◎"
  ],
  toggle10: [
    "㊂",
    "㊀",
    "㊁"
  ],
  toggle11: [
    "⧇",
    "⧆"
  ],
  toggle12: [
    "☗",
    "☖"
  ],
  toggle13: [
    "=",
    "*",
    "-"
  ],
  arrow: [
    "←",
    "↖",
    "↑",
    "↗",
    "→",
    "↘",
    "↓",
    "↙"
  ],
  arrow2: [
    "⬆️ ",
    "↗️ ",
    "➡️ ",
    "↘️ ",
    "⬇️ ",
    "↙️ ",
    "⬅️ ",
    "↖️ "
  ],
  arrow3: [
    "▹▹▹▹▹",
    "▸▹▹▹▹",
    "▹▸▹▹▹",
    "▹▹▸▹▹",
    "▹▹▹▸▹",
    "▹▹▹▹▸"
  ],
  bouncingBar: [
    "[    ]",
    "[=   ]",
    "[==  ]",
    "[=== ]",
    "[====]",
    "[ ===]",
    "[  ==]",
    "[   =]",
    "[    ]",
    "[   =]",
    "[  ==]",
    "[ ===]",
    "[====]",
    "[=== ]",
    "[==  ]",
    "[=   ]"
  ],
  bouncingBall: [
    "( ●    )",
    "(  ●   )",
    "(   ●  )",
    "(    ● )",
    "(     ●)",
    "(    ● )",
    "(   ●  )",
    "(  ●   )",
    "( ●    )",
    "(●     )"
  ],
  smiley: [
    "😄 ",
    "😝 "
  ],
  monkey: [
    "🙈 ",
    "🙈 ",
    "🙉 ",
    "🙊 "
  ],
  hearts: [
    "💛 ",
    "💙 ",
    "💜 ",
    "💚 ",
    "❤️ "
  ],
  clock: [
    "🕛 ",
    "🕐 ",
    "🕑 ",
    "🕒 ",
    "🕓 ",
    "🕔 ",
    "🕕 ",
    "🕖 ",
    "🕗 ",
    "🕘 ",
    "🕙 ",
    "🕚 "
  ],
  earth: [
    "🌍 ",
    "🌎 ",
    "🌏 "
  ],
  moon: [
    "🌑 ",
    "🌒 ",
    "🌓 ",
    "🌔 ",
    "🌕 ",
    "🌖 ",
    "🌗 ",
    "🌘 "
  ],
  runner: [
    "🚶 ",
    "🏃 "
  ],
  dqpb: [
    "d",
    "q",
    "p",
    "b"
  ],
  weather: [
    "☀️ ",
    "☀️ ",
    "☀️ ",
    "🌤 ",
    "⛅️ ",
    "🌥 ",
    "☁️ ",
    "🌧 ",
    "🌨 ",
    "🌧 ",
    "🌨 ",
    "🌧 ",
    "🌨 ",
    "⛈ ",
    "🌨 ",
    "🌧 ",
    "🌨 ",
    "☁️ ",
    "🌥 ",
    "⛅️ ",
    "🌤 ",
    "☀️ ",
    "☀️ "
  ],
  christmas: [
    "🌲",
    "🎄"
  ],
  grenade: [
    "،  ",
    "′  ",
    " ´ ",
    " ‾ ",
    "  ⸌",
    "  ⸊",
    "  |",
    "  ⁎",
    "  ⁕",
    " ෴ ",
    "  ⁓",
    "   ",
    "   ",
    "   "
  ],
  point: [
    "∙∙∙",
    "●∙∙",
    "∙●∙",
    "∙∙●",
    "∙∙∙"
  ],
  layer: [
    "-",
    "=",
    "≡"
  ],
  betaWave: [
    "ρββββββ",
    "βρβββββ",
    "ββρββββ",
    "βββρβββ",
    "ββββρββ",
    "βββββρβ",
    "ββββββρ"
  ],
  fingerDance: [
    "🤘 ",
    "🤟 ",
    "🖖 ",
    "✋ ",
    "🤚 ",
    "👆 "
  ],
  mindblown: [
    "😐 ",
    "😐 ",
    "😮 ",
    "😮 ",
    "😦 ",
    "😦 ",
    "😧 ",
    "😧 ",
    "🤯 ",
    "💥 ",
    "✨ ",
    "　 ",
    "　 ",
    "　 "
  ],
  speaker: [
    "🔈 ",
    "🔉 ",
    "🔊 ",
    "🔉 "
  ],
  orangePulse: [
    "🔸 ",
    "🔶 ",
    "🟠 ",
    "🟠 ",
    "🔶 "
  ],
  bluePulse: [
    "🔹 ",
    "🔷 ",
    "🔵 ",
    "🔵 ",
    "🔷 "
  ],
  orangeBluePulse: [
    "🔸 ",
    "🔶 ",
    "🟠 ",
    "🟠 ",
    "🔶 ",
    "🔹 ",
    "🔷 ",
    "🔵 ",
    "🔵 ",
    "🔷 "
  ],
  timeTravel: [
    "🕛 ",
    "🕚 ",
    "🕙 ",
    "🕘 ",
    "🕗 ",
    "🕖 ",
    "🕕 ",
    "🕔 ",
    "🕓 ",
    "🕒 ",
    "🕑 ",
    "🕐 "
  ],
  aesthetic: [
    "▰▱▱▱▱▱▱",
    "▰▰▱▱▱▱▱",
    "▰▰▰▱▱▱▱",
    "▰▰▰▰▱▱▱",
    "▰▰▰▰▰▱▱",
    "▰▰▰▰▰▰▱",
    "▰▰▰▰▰▰▰",
    "▰▱▱▱▱▱▱"
  ]
};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var eta;
var hasRequiredEta;
function requireEta() {
  if (hasRequiredEta) return eta;
  hasRequiredEta = 1;
  class ETA {
    constructor(length, initTime, initValue) {
      this.etaBufferLength = length || 100;
      this.valueBuffer = [initValue];
      this.timeBuffer = [initTime];
      this.eta = "0";
    }
    // add new values to calculation buffer
    update(time, value, total) {
      this.valueBuffer.push(value);
      this.timeBuffer.push(time);
      this.calculate(total - value);
    }
    // fetch estimated time
    getTime() {
      return this.eta;
    }
    // eta calculation - request number of remaining events
    calculate(remaining) {
      const currentBufferSize = this.valueBuffer.length;
      const buffer = Math.min(this.etaBufferLength, currentBufferSize);
      const v_diff = this.valueBuffer[currentBufferSize - 1] - this.valueBuffer[currentBufferSize - buffer];
      const t_diff = this.timeBuffer[currentBufferSize - 1] - this.timeBuffer[currentBufferSize - buffer];
      const vt_rate = v_diff / t_diff;
      this.valueBuffer = this.valueBuffer.slice(-this.etaBufferLength);
      this.timeBuffer = this.timeBuffer.slice(-this.etaBufferLength);
      const eta2 = Math.ceil(remaining / vt_rate / 1e3);
      if (isNaN(eta2)) {
        this.eta = "NULL";
      } else if (!isFinite(eta2)) {
        this.eta = "INF";
      } else if (eta2 > 1e7) {
        this.eta = "INF";
      } else if (eta2 < 0) {
        this.eta = 0;
      } else {
        this.eta = eta2;
      }
    }
  }
  eta = ETA;
  return eta;
}
var terminal;
var hasRequiredTerminal;
function requireTerminal() {
  if (hasRequiredTerminal) return terminal;
  hasRequiredTerminal = 1;
  const _readline = require$$0;
  class Terminal {
    constructor(outputStream) {
      this.stream = outputStream;
      this.linewrap = true;
      this.dy = 0;
    }
    // save cursor position + settings
    cursorSave() {
      if (!this.stream.isTTY) {
        return;
      }
      this.stream.write("\x1B7");
    }
    // restore last cursor position + settings
    cursorRestore() {
      if (!this.stream.isTTY) {
        return;
      }
      this.stream.write("\x1B8");
    }
    // show/hide cursor
    cursor(enabled) {
      if (!this.stream.isTTY) {
        return;
      }
      if (enabled) {
        this.stream.write("\x1B[?25h");
      } else {
        this.stream.write("\x1B[?25l");
      }
    }
    // change cursor positionn
    cursorTo(x = null, y = null) {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.cursorTo(this.stream, x, y);
    }
    // change relative cursor position
    cursorRelative(dx = null, dy = null) {
      if (!this.stream.isTTY) {
        return;
      }
      this.dy = this.dy + dy;
      _readline.moveCursor(this.stream, dx, dy);
    }
    // relative reset
    cursorRelativeReset() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.moveCursor(this.stream, 0, -this.dy);
      _readline.cursorTo(this.stream, 0, null);
      this.dy = 0;
    }
    // clear to the right from cursor
    clearRight() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.clearLine(this.stream, 1);
    }
    // clear the full line
    clearLine() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.clearLine(this.stream, 0);
    }
    // clear everyting beyond the current line
    clearBottom() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.clearScreenDown(this.stream);
    }
    // add new line; increment counter
    newline() {
      this.stream.write("\n");
      this.dy++;
    }
    // write content to output stream
    // @TODO use string-width to strip length
    write(s, rawWrite = false) {
      if (this.linewrap === true && rawWrite === false) {
        this.stream.write(s.substr(0, this.getWidth()));
      } else {
        this.stream.write(s);
      }
    }
    // control line wrapping
    lineWrapping(enabled) {
      if (!this.stream.isTTY) {
        return;
      }
      this.linewrap = enabled;
      if (enabled) {
        this.stream.write("\x1B[?7h");
      } else {
        this.stream.write("\x1B[?7l");
      }
    }
    // tty environment ?
    isTTY() {
      return this.stream.isTTY === true;
    }
    // get terminal width
    getWidth() {
      return this.stream.columns || (this.stream.isTTY ? 80 : 200);
    }
  }
  terminal = Terminal;
  return terminal;
}
var stringWidth = { exports: {} };
var ansiRegex;
var hasRequiredAnsiRegex;
function requireAnsiRegex() {
  if (hasRequiredAnsiRegex) return ansiRegex;
  hasRequiredAnsiRegex = 1;
  ansiRegex = ({ onlyFirst = false } = {}) => {
    const pattern = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");
    return new RegExp(pattern, onlyFirst ? void 0 : "g");
  };
  return ansiRegex;
}
var stripAnsi;
var hasRequiredStripAnsi;
function requireStripAnsi() {
  if (hasRequiredStripAnsi) return stripAnsi;
  hasRequiredStripAnsi = 1;
  const ansiRegex2 = requireAnsiRegex();
  stripAnsi = (string) => typeof string === "string" ? string.replace(ansiRegex2(), "") : string;
  return stripAnsi;
}
var isFullwidthCodePoint = { exports: {} };
var hasRequiredIsFullwidthCodePoint;
function requireIsFullwidthCodePoint() {
  if (hasRequiredIsFullwidthCodePoint) return isFullwidthCodePoint.exports;
  hasRequiredIsFullwidthCodePoint = 1;
  const isFullwidthCodePoint$1 = (codePoint) => {
    if (Number.isNaN(codePoint)) {
      return false;
    }
    if (codePoint >= 4352 && (codePoint <= 4447 || // Hangul Jamo
    codePoint === 9001 || // LEFT-POINTING ANGLE BRACKET
    codePoint === 9002 || // RIGHT-POINTING ANGLE BRACKET
    // CJK Radicals Supplement .. Enclosed CJK Letters and Months
    11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
    12880 <= codePoint && codePoint <= 19903 || // CJK Unified Ideographs .. Yi Radicals
    19968 <= codePoint && codePoint <= 42182 || // Hangul Jamo Extended-A
    43360 <= codePoint && codePoint <= 43388 || // Hangul Syllables
    44032 <= codePoint && codePoint <= 55203 || // CJK Compatibility Ideographs
    63744 <= codePoint && codePoint <= 64255 || // Vertical Forms
    65040 <= codePoint && codePoint <= 65049 || // CJK Compatibility Forms .. Small Form Variants
    65072 <= codePoint && codePoint <= 65131 || // Halfwidth and Fullwidth Forms
    65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || // Kana Supplement
    110592 <= codePoint && codePoint <= 110593 || // Enclosed Ideographic Supplement
    127488 <= codePoint && codePoint <= 127569 || // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
    131072 <= codePoint && codePoint <= 262141)) {
      return true;
    }
    return false;
  };
  isFullwidthCodePoint.exports = isFullwidthCodePoint$1;
  isFullwidthCodePoint.exports.default = isFullwidthCodePoint$1;
  return isFullwidthCodePoint.exports;
}
var emojiRegex;
var hasRequiredEmojiRegex;
function requireEmojiRegex() {
  if (hasRequiredEmojiRegex) return emojiRegex;
  hasRequiredEmojiRegex = 1;
  emojiRegex = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
  return emojiRegex;
}
var hasRequiredStringWidth;
function requireStringWidth() {
  if (hasRequiredStringWidth) return stringWidth.exports;
  hasRequiredStringWidth = 1;
  const stripAnsi2 = requireStripAnsi();
  const isFullwidthCodePoint2 = requireIsFullwidthCodePoint();
  const emojiRegex2 = requireEmojiRegex();
  const stringWidth$1 = (string) => {
    if (typeof string !== "string" || string.length === 0) {
      return 0;
    }
    string = stripAnsi2(string);
    if (string.length === 0) {
      return 0;
    }
    string = string.replace(emojiRegex2(), "  ");
    let width = 0;
    for (let i = 0; i < string.length; i++) {
      const code = string.codePointAt(i);
      if (code <= 31 || code >= 127 && code <= 159) {
        continue;
      }
      if (code >= 768 && code <= 879) {
        continue;
      }
      if (code > 65535) {
        i++;
      }
      width += isFullwidthCodePoint2(code) ? 2 : 1;
    }
    return width;
  };
  stringWidth.exports = stringWidth$1;
  stringWidth.exports.default = stringWidth$1;
  return stringWidth.exports;
}
var formatValue;
var hasRequiredFormatValue;
function requireFormatValue() {
  if (hasRequiredFormatValue) return formatValue;
  hasRequiredFormatValue = 1;
  formatValue = function formatValue2(v, options2, type) {
    if (options2.autopadding !== true) {
      return v;
    }
    function autopadding(value, length) {
      return (options2.autopaddingChar + value).slice(-3);
    }
    switch (type) {
      case "percentage":
        return autopadding(v);
      default:
        return v;
    }
  };
  return formatValue;
}
var formatBar;
var hasRequiredFormatBar;
function requireFormatBar() {
  if (hasRequiredFormatBar) return formatBar;
  hasRequiredFormatBar = 1;
  formatBar = function formatBar2(progress, options2) {
    const completeSize = Math.round(progress * options2.barsize);
    const incompleteSize = options2.barsize - completeSize;
    return options2.barCompleteString.substr(0, completeSize) + options2.barGlue + options2.barIncompleteString.substr(0, incompleteSize);
  };
  return formatBar;
}
var formatTime;
var hasRequiredFormatTime;
function requireFormatTime() {
  if (hasRequiredFormatTime) return formatTime;
  hasRequiredFormatTime = 1;
  formatTime = function formatTime2(t, options2, roundToMultipleOf) {
    function round(input) {
      if (roundToMultipleOf) {
        return roundToMultipleOf * Math.round(input / roundToMultipleOf);
      } else {
        return input;
      }
    }
    function autopadding(v) {
      return (options2.autopaddingChar + v).slice(-2);
    }
    if (t > 3600) {
      return autopadding(Math.floor(t / 3600)) + "h" + autopadding(round(t % 3600 / 60)) + "m";
    } else if (t > 60) {
      return autopadding(Math.floor(t / 60)) + "m" + autopadding(round(t % 60)) + "s";
    } else if (t > 10) {
      return autopadding(round(t)) + "s";
    } else {
      return autopadding(t) + "s";
    }
  };
  return formatTime;
}
var formatter;
var hasRequiredFormatter;
function requireFormatter() {
  if (hasRequiredFormatter) return formatter;
  hasRequiredFormatter = 1;
  const _stringWidth = requireStringWidth();
  const _defaultFormatValue = requireFormatValue();
  const _defaultFormatBar = requireFormatBar();
  const _defaultFormatTime = requireFormatTime();
  formatter = function defaultFormatter(options2, params, payload) {
    let s = options2.format;
    const formatTime2 = options2.formatTime || _defaultFormatTime;
    const formatValue2 = options2.formatValue || _defaultFormatValue;
    const formatBar2 = options2.formatBar || _defaultFormatBar;
    const percentage = Math.floor(params.progress * 100) + "";
    const stopTime = params.stopTime || Date.now();
    const elapsedTime = Math.round((stopTime - params.startTime) / 1e3);
    const context = Object.assign({}, payload, {
      bar: formatBar2(params.progress, options2),
      percentage: formatValue2(percentage, options2, "percentage"),
      total: formatValue2(params.total, options2, "total"),
      value: formatValue2(params.value, options2, "value"),
      eta: formatValue2(params.eta, options2, "eta"),
      eta_formatted: formatTime2(params.eta, options2, 5),
      duration: formatValue2(elapsedTime, options2, "duration"),
      duration_formatted: formatTime2(elapsedTime, options2, 1)
    });
    s = s.replace(/\{(\w+)\}/g, function(match, key) {
      if (typeof context[key] !== "undefined") {
        return context[key];
      }
      return match;
    });
    const fullMargin = Math.max(0, params.maxWidth - _stringWidth(s) - 2);
    const halfMargin = Math.floor(fullMargin / 2);
    switch (options2.align) {
      // fill start-of-line with whitespaces
      case "right":
        s = fullMargin > 0 ? " ".repeat(fullMargin) + s : s;
        break;
      // distribute whitespaces to left+right
      case "center":
        s = halfMargin > 0 ? " ".repeat(halfMargin) + s : s;
        break;
    }
    return s;
  };
  return formatter;
}
var options;
var hasRequiredOptions;
function requireOptions() {
  if (hasRequiredOptions) return options;
  hasRequiredOptions = 1;
  function mergeOption(v, defaultValue) {
    if (typeof v === "undefined" || v === null) {
      return defaultValue;
    } else {
      return v;
    }
  }
  options = {
    // set global options
    parse: function parse(rawOptions, preset) {
      const options2 = {};
      const opt = Object.assign({}, preset, rawOptions);
      options2.throttleTime = 1e3 / mergeOption(opt.fps, 10);
      options2.stream = mergeOption(opt.stream, process.stderr);
      options2.terminal = mergeOption(opt.terminal, null);
      options2.clearOnComplete = mergeOption(opt.clearOnComplete, false);
      options2.stopOnComplete = mergeOption(opt.stopOnComplete, false);
      options2.barsize = mergeOption(opt.barsize, 40);
      options2.align = mergeOption(opt.align, "left");
      options2.hideCursor = mergeOption(opt.hideCursor, false);
      options2.linewrap = mergeOption(opt.linewrap, false);
      options2.barGlue = mergeOption(opt.barGlue, "");
      options2.barCompleteChar = mergeOption(opt.barCompleteChar, "=");
      options2.barIncompleteChar = mergeOption(opt.barIncompleteChar, "-");
      options2.format = mergeOption(opt.format, "progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}");
      options2.formatTime = mergeOption(opt.formatTime, null);
      options2.formatValue = mergeOption(opt.formatValue, null);
      options2.formatBar = mergeOption(opt.formatBar, null);
      options2.etaBufferLength = mergeOption(opt.etaBuffer, 10);
      options2.etaAsynchronousUpdate = mergeOption(opt.etaAsynchronousUpdate, false);
      options2.progressCalculationRelative = mergeOption(opt.progressCalculationRelative, false);
      options2.synchronousUpdate = mergeOption(opt.synchronousUpdate, true);
      options2.noTTYOutput = mergeOption(opt.noTTYOutput, false);
      options2.notTTYSchedule = mergeOption(opt.notTTYSchedule, 2e3);
      options2.emptyOnZero = mergeOption(opt.emptyOnZero, false);
      options2.forceRedraw = mergeOption(opt.forceRedraw, false);
      options2.autopadding = mergeOption(opt.autopadding, false);
      options2.gracefulExit = mergeOption(opt.gracefulExit, false);
      return options2;
    },
    // derived options: instance specific, has to be created for every bar element
    assignDerivedOptions: function assignDerivedOptions(options2) {
      options2.barCompleteString = options2.barCompleteChar.repeat(options2.barsize + 1);
      options2.barIncompleteString = options2.barIncompleteChar.repeat(options2.barsize + 1);
      options2.autopaddingChar = options2.autopadding ? mergeOption(options2.autopaddingChar, "   ") : "";
      return options2;
    }
  };
  return options;
}
var genericBar;
var hasRequiredGenericBar;
function requireGenericBar() {
  if (hasRequiredGenericBar) return genericBar;
  hasRequiredGenericBar = 1;
  const _ETA = requireEta();
  const _Terminal = requireTerminal();
  const _formatter = requireFormatter();
  const _options = requireOptions();
  const _EventEmitter = require$$4;
  genericBar = class GenericBar extends _EventEmitter {
    constructor(options2) {
      super();
      this.options = _options.assignDerivedOptions(options2);
      this.terminal = this.options.terminal ? this.options.terminal : new _Terminal(this.options.stream);
      this.value = 0;
      this.startValue = 0;
      this.total = 100;
      this.lastDrawnString = null;
      this.startTime = null;
      this.stopTime = null;
      this.lastRedraw = Date.now();
      this.eta = new _ETA(this.options.etaBufferLength, 0, 0);
      this.payload = {};
      this.isActive = false;
      this.formatter = typeof this.options.format === "function" ? this.options.format : _formatter;
    }
    // internal render function
    render(forceRendering = false) {
      const params = {
        progress: this.getProgress(),
        eta: this.eta.getTime(),
        startTime: this.startTime,
        stopTime: this.stopTime,
        total: this.total,
        value: this.value,
        maxWidth: this.terminal.getWidth()
      };
      if (this.options.etaAsynchronousUpdate) {
        this.updateETA();
      }
      const s = this.formatter(this.options, params, this.payload);
      const forceRedraw = forceRendering || this.options.forceRedraw || this.options.noTTYOutput && !this.terminal.isTTY();
      if (forceRedraw || this.lastDrawnString != s) {
        this.emit("redraw-pre");
        this.terminal.cursorTo(0, null);
        this.terminal.write(s);
        this.terminal.clearRight();
        this.lastDrawnString = s;
        this.lastRedraw = Date.now();
        this.emit("redraw-post");
      }
    }
    // start the progress bar
    start(total, startValue, payload) {
      this.value = startValue || 0;
      this.total = typeof total !== "undefined" && total >= 0 ? total : 100;
      this.startValue = startValue || 0;
      this.payload = payload || {};
      this.startTime = Date.now();
      this.stopTime = null;
      this.lastDrawnString = "";
      this.eta = new _ETA(this.options.etaBufferLength, this.startTime, this.value);
      this.isActive = true;
      this.emit("start", total, startValue);
    }
    // stop the bar
    stop() {
      this.isActive = false;
      this.stopTime = Date.now();
      this.emit("stop", this.total, this.value);
    }
    // update the bar value
    // update(value, payload)
    // update(payload)
    update(arg0, arg1 = {}) {
      if (typeof arg0 === "number") {
        this.value = arg0;
        this.eta.update(Date.now(), arg0, this.total);
      }
      const payloadData = (typeof arg0 === "object" ? arg0 : arg1) || {};
      this.emit("update", this.total, this.value);
      for (const key in payloadData) {
        this.payload[key] = payloadData[key];
      }
      if (this.value >= this.getTotal() && this.options.stopOnComplete) {
        this.stop();
      }
    }
    // calculate the actual progress value
    getProgress() {
      let progress = this.value / this.total;
      if (this.options.progressCalculationRelative) {
        progress = (this.value - this.startValue) / (this.total - this.startValue);
      }
      if (isNaN(progress)) {
        progress = this.options && this.options.emptyOnZero ? 0 : 1;
      }
      progress = Math.min(Math.max(progress, 0), 1);
      return progress;
    }
    // update the bar value
    // increment(delta, payload)
    // increment(payload)
    increment(arg0 = 1, arg1 = {}) {
      if (typeof arg0 === "object") {
        this.update(this.value + 1, arg0);
      } else {
        this.update(this.value + arg0, arg1);
      }
    }
    // get the total (limit) value
    getTotal() {
      return this.total;
    }
    // set the total (limit) value
    setTotal(total) {
      if (typeof total !== "undefined" && total >= 0) {
        this.total = total;
      }
    }
    // force eta calculation update (long running processes)
    updateETA() {
      this.eta.update(Date.now(), this.value, this.total);
    }
  };
  return genericBar;
}
var singleBar;
var hasRequiredSingleBar;
function requireSingleBar() {
  if (hasRequiredSingleBar) return singleBar;
  hasRequiredSingleBar = 1;
  const _GenericBar = requireGenericBar();
  const _options = requireOptions();
  singleBar = class SingleBar extends _GenericBar {
    constructor(options2, preset) {
      super(_options.parse(options2, preset));
      this.timer = null;
      if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
        this.options.synchronousUpdate = false;
      }
      this.schedulingRate = this.terminal.isTTY() ? this.options.throttleTime : this.options.notTTYSchedule;
      this.sigintCallback = null;
    }
    // internal render function
    render() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      super.render();
      if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
        this.terminal.newline();
      }
      this.timer = setTimeout(this.render.bind(this), this.schedulingRate);
    }
    update(current, payload) {
      if (!this.timer) {
        return;
      }
      super.update(current, payload);
      if (this.options.synchronousUpdate && this.lastRedraw + this.options.throttleTime * 2 < Date.now()) {
        this.render();
      }
    }
    // start the progress bar
    start(total, startValue, payload) {
      if (this.options.noTTYOutput === false && this.terminal.isTTY() === false) {
        return;
      }
      if (this.sigintCallback === null && this.options.gracefulExit) {
        this.sigintCallback = this.stop.bind(this);
        process.once("SIGINT", this.sigintCallback);
        process.once("SIGTERM", this.sigintCallback);
      }
      this.terminal.cursorSave();
      if (this.options.hideCursor === true) {
        this.terminal.cursor(false);
      }
      if (this.options.linewrap === false) {
        this.terminal.lineWrapping(false);
      }
      super.start(total, startValue, payload);
      this.render();
    }
    // stop the bar
    stop() {
      if (!this.timer) {
        return;
      }
      if (this.sigintCallback) {
        process.removeListener("SIGINT", this.sigintCallback);
        process.removeListener("SIGTERM", this.sigintCallback);
        this.sigintCallback = null;
      }
      this.render();
      super.stop();
      clearTimeout(this.timer);
      this.timer = null;
      if (this.options.hideCursor === true) {
        this.terminal.cursor(true);
      }
      if (this.options.linewrap === false) {
        this.terminal.lineWrapping(true);
      }
      this.terminal.cursorRestore();
      if (this.options.clearOnComplete) {
        this.terminal.cursorTo(0, null);
        this.terminal.clearLine();
      } else {
        this.terminal.newline();
      }
    }
  };
  return singleBar;
}
var multiBar;
var hasRequiredMultiBar;
function requireMultiBar() {
  if (hasRequiredMultiBar) return multiBar;
  hasRequiredMultiBar = 1;
  const _Terminal = requireTerminal();
  const _BarElement = requireGenericBar();
  const _options = requireOptions();
  const _EventEmitter = require$$4;
  multiBar = class MultiBar extends _EventEmitter {
    constructor(options2, preset) {
      super();
      this.bars = [];
      this.options = _options.parse(options2, preset);
      this.options.synchronousUpdate = false;
      this.terminal = this.options.terminal ? this.options.terminal : new _Terminal(this.options.stream);
      this.timer = null;
      this.isActive = false;
      this.schedulingRate = this.terminal.isTTY() ? this.options.throttleTime : this.options.notTTYSchedule;
      this.loggingBuffer = [];
      this.sigintCallback = null;
    }
    // add a new bar to the stack
    create(total, startValue, payload, barOptions = {}) {
      const bar = new _BarElement(Object.assign(
        {},
        // global options
        this.options,
        // terminal instance
        {
          terminal: this.terminal
        },
        // overrides
        barOptions
      ));
      this.bars.push(bar);
      if (this.options.noTTYOutput === false && this.terminal.isTTY() === false) {
        return bar;
      }
      if (this.sigintCallback === null && this.options.gracefulExit) {
        this.sigintCallback = this.stop.bind(this);
        process.once("SIGINT", this.sigintCallback);
        process.once("SIGTERM", this.sigintCallback);
      }
      if (!this.isActive) {
        if (this.options.hideCursor === true) {
          this.terminal.cursor(false);
        }
        if (this.options.linewrap === false) {
          this.terminal.lineWrapping(false);
        }
        this.timer = setTimeout(this.update.bind(this), this.schedulingRate);
      }
      this.isActive = true;
      bar.start(total, startValue, payload);
      this.emit("start");
      return bar;
    }
    // remove a bar from the stack
    remove(bar) {
      const index = this.bars.indexOf(bar);
      if (index < 0) {
        return false;
      }
      this.bars.splice(index, 1);
      this.update();
      this.terminal.newline();
      this.terminal.clearBottom();
      return true;
    }
    // internal update routine
    update() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.emit("update-pre");
      this.terminal.cursorRelativeReset();
      this.emit("redraw-pre");
      if (this.loggingBuffer.length > 0) {
        this.terminal.clearLine();
        while (this.loggingBuffer.length > 0) {
          this.terminal.write(this.loggingBuffer.shift(), true);
        }
      }
      for (let i = 0; i < this.bars.length; i++) {
        if (i > 0) {
          this.terminal.newline();
        }
        this.bars[i].render();
      }
      this.emit("redraw-post");
      if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
        this.terminal.newline();
        this.terminal.newline();
      }
      this.timer = setTimeout(this.update.bind(this), this.schedulingRate);
      this.emit("update-post");
      if (this.options.stopOnComplete && !this.bars.find((bar) => bar.isActive)) {
        this.stop();
      }
    }
    stop() {
      clearTimeout(this.timer);
      this.timer = null;
      if (this.sigintCallback) {
        process.removeListener("SIGINT", this.sigintCallback);
        process.removeListener("SIGTERM", this.sigintCallback);
        this.sigintCallback = null;
      }
      this.isActive = false;
      if (this.options.hideCursor === true) {
        this.terminal.cursor(true);
      }
      if (this.options.linewrap === false) {
        this.terminal.lineWrapping(true);
      }
      this.terminal.cursorRelativeReset();
      this.emit("stop-pre-clear");
      if (this.options.clearOnComplete) {
        this.terminal.clearBottom();
      } else {
        for (let i = 0; i < this.bars.length; i++) {
          if (i > 0) {
            this.terminal.newline();
          }
          this.bars[i].render();
          this.bars[i].stop();
        }
        this.terminal.newline();
      }
      this.emit("stop");
    }
    log(s) {
      this.loggingBuffer.push(s);
    }
  };
  return multiBar;
}
var legacy;
var hasRequiredLegacy;
function requireLegacy() {
  if (hasRequiredLegacy) return legacy;
  hasRequiredLegacy = 1;
  legacy = {
    format: "progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "=",
    barIncompleteChar: "-"
  };
  return legacy;
}
var shadesClassic;
var hasRequiredShadesClassic;
function requireShadesClassic() {
  if (hasRequiredShadesClassic) return shadesClassic;
  hasRequiredShadesClassic = 1;
  shadesClassic = {
    format: " {bar} {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "█",
    barIncompleteChar: "░"
  };
  return shadesClassic;
}
var shadesGrey;
var hasRequiredShadesGrey;
function requireShadesGrey() {
  if (hasRequiredShadesGrey) return shadesGrey;
  hasRequiredShadesGrey = 1;
  shadesGrey = {
    format: " \x1B[90m{bar}\x1B[0m {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "█",
    barIncompleteChar: "░"
  };
  return shadesGrey;
}
var rect;
var hasRequiredRect;
function requireRect() {
  if (hasRequiredRect) return rect;
  hasRequiredRect = 1;
  rect = {
    format: " {bar}■ {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "■",
    barIncompleteChar: " "
  };
  return rect;
}
var presets;
var hasRequiredPresets;
function requirePresets() {
  if (hasRequiredPresets) return presets;
  hasRequiredPresets = 1;
  const _legacy = requireLegacy();
  const _shades_classic = requireShadesClassic();
  const _shades_grey = requireShadesGrey();
  const _rect = requireRect();
  presets = {
    legacy: _legacy,
    shades_classic: _shades_classic,
    shades_grey: _shades_grey,
    rect: _rect
  };
  return presets;
}
var cliProgress$1;
var hasRequiredCliProgress;
function requireCliProgress() {
  if (hasRequiredCliProgress) return cliProgress$1;
  hasRequiredCliProgress = 1;
  const _SingleBar = requireSingleBar();
  const _MultiBar = requireMultiBar();
  const _Presets = requirePresets();
  const _Formatter = requireFormatter();
  const _defaultFormatValue = requireFormatValue();
  const _defaultFormatBar = requireFormatBar();
  const _defaultFormatTime = requireFormatTime();
  cliProgress$1 = {
    Bar: _SingleBar,
    SingleBar: _SingleBar,
    MultiBar: _MultiBar,
    Presets: _Presets,
    Format: {
      Formatter: _Formatter,
      BarFormat: _defaultFormatBar,
      ValueFormat: _defaultFormatValue,
      TimeFormat: _defaultFormatTime
    }
  };
  return cliProgress$1;
}
var cliProgressExports = requireCliProgress();
const cliProgress = /* @__PURE__ */ getDefaultExportFromCjs(cliProgressExports);
const ANSI_BACKGROUND_OFFSET = 10;
const wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
const wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
const styles$1 = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
Object.keys(styles$1.modifier);
const foregroundColorNames = Object.keys(styles$1.color);
const backgroundColorNames = Object.keys(styles$1.bgColor);
[...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles$1)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles$1[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles$1[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles$1, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles$1, "codes", {
    value: codes,
    enumerable: false
  });
  styles$1.color.close = "\x1B[39m";
  styles$1.bgColor.close = "\x1B[49m";
  styles$1.color.ansi = wrapAnsi16();
  styles$1.color.ansi256 = wrapAnsi256();
  styles$1.color.ansi16m = wrapAnsi16m();
  styles$1.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles$1.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles$1.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles$1, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise */
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles$1.rgbToAnsi256(...styles$1.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles$1.ansi256ToAnsi(styles$1.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles$1.ansi256ToAnsi(styles$1.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles$1;
}
const ansiStyles = assembleStyles();
const level = (() => {
  if (!("navigator" in globalThis)) {
    return 0;
  }
  if (globalThis.navigator.userAgentData) {
    const brand = navigator.userAgentData.brands.find(({ brand: brand2 }) => brand2 === "Chromium");
    if (brand && brand.version > 93) {
      return 3;
    }
  }
  if (/\b(Chrome|Chromium)\//.test(globalThis.navigator.userAgent)) {
    return 1;
  }
  return 0;
})();
const colorSupport = level !== 0 && {
  level
};
const supportsColor = {
  stdout: colorSupport,
  stderr: colorSupport
};
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
const { stdout: stdoutColor, stderr: stderrColor } = supportsColor;
const GENERATOR = Symbol("GENERATOR");
const STYLER = Symbol("STYLER");
const IS_EMPTY = Symbol("IS_EMPTY");
const levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
const styles = /* @__PURE__ */ Object.create(null);
const applyOptions = (object, options2 = {}) => {
  if (options2.level && !(Number.isInteger(options2.level) && options2.level >= 0 && options2.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options2.level === void 0 ? colorLevel : options2.level;
};
const chalkFactory = (options2) => {
  const chalk2 = (...strings) => strings.join(" ");
  applyOptions(chalk2, options2);
  Object.setPrototypeOf(chalk2, createChalk.prototype);
  return chalk2;
};
function createChalk(options2) {
  return chalkFactory(options2);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansiStyles)) {
  styles[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
const getModelAnsi = (model, level2, type, ...arguments_) => {
  if (model === "rgb") {
    if (level2 === "ansi16m") {
      return ansiStyles[type].ansi16m(...arguments_);
    }
    if (level2 === "ansi256") {
      return ansiStyles[type].ansi256(ansiStyles.rgbToAnsi256(...arguments_));
    }
    return ansiStyles[type].ansi(ansiStyles.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level2, type, ...ansiStyles.hexToRgb(...arguments_));
  }
  return ansiStyles[type][model](...arguments_);
};
const usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles[model] = {
    get() {
      const { level: level2 } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level2], "color", ...arguments_), ansiStyles.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles[bgModel] = {
    get() {
      const { level: level2 } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level2], "bgColor", ...arguments_), ansiStyles.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
const proto = Object.defineProperties(() => {
}, {
  ...styles,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level2) {
      this[GENERATOR].level = level2;
    }
  }
});
const createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
const createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
const applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles);
const chalk = createChalk();
createChalk({ level: stderrColor ? stderrColor.level : 0 });
dirname(import.meta.url);
class ArgParser {
  constructor() {
    this.commands = {};
    this.options = {};
    this.examples = [];
    this.helpText = "";
    this.versionText = "1.0.0";
  }
  usage(text) {
    this.helpText = text;
    return this;
  }
  command(pattern, desc, handler) {
    const match = pattern.match(/\$0 <(\w+)>/);
    if (match) this.commands[match[1]] = { desc, handler, required: true };
    return this;
  }
  option(name, opts = {}) {
    this.options[name] = opts;
    return this;
  }
  example(cmd, desc) {
    this.examples.push({ cmd, desc });
    return this;
  }
  help() {
    return this;
  }
  alias(short, long) {
    if (this.options[long]) this.options[long].alias = short;
    return this;
  }
  version(v) {
    if (v) this.versionText = v;
    return this;
  }
  strict() {
    return this;
  }
  parseSync() {
    const args = process.argv.slice(2);
    const result = {};
    const positional = [];
    if (args.includes("--help") || args.includes("-h")) {
      this.showHelp();
      process.exit(0);
    }
    if (args.includes("--version")) {
      console.log(this.versionText);
      process.exit(0);
    }
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--")) {
        const [key, value] = arg.split("=");
        const optName = key.slice(2);
        if (value !== void 0) {
          result[optName] = this.coerceValue(optName, value);
        } else if (this.options[optName]?.type === "boolean") {
          result[optName] = true;
        } else {
          const nextArg = args[i + 1];
          if (nextArg && !nextArg.startsWith("-")) {
            result[optName] = this.coerceValue(optName, nextArg);
            i++;
          } else {
            result[optName] = true;
          }
        }
      } else if (arg.startsWith("-") && arg.length === 2) {
        const shortFlag = arg[1];
        const longName = this.findLongName(shortFlag);
        if (longName) {
          if (this.options[longName]?.type === "boolean") {
            result[longName] = true;
          } else {
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith("-")) {
              result[longName] = this.coerceValue(longName, nextArg);
              i++;
            }
          }
        }
      } else {
        positional.push(arg);
      }
    }
    if (positional.length > 0) result.urls = positional;
    Object.keys(this.options).forEach((key) => {
      if (result[key] === void 0 && this.options[key].default !== void 0) {
        result[key] = this.options[key].default;
      }
    });
    if ((!result.urls || result.urls.length === 0) && this.commands.url?.required) {
      console.error("Error: Missing required argument: url");
      this.showHelp();
      process.exit(1);
    }
    return result;
  }
  coerceValue(optName, value) {
    const opt = this.options[optName];
    if (!opt) return value;
    if (opt.coerce) return opt.coerce(value);
    switch (opt.type) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true" || value === "1";
      default:
        return value;
    }
  }
  findLongName(shortFlag) {
    return Object.keys(this.options).find((key) => this.options[key].alias === shortFlag);
  }
  showHelp() {
    console.log(this.helpText || "Usage: grab <url> [options]");
    console.log("\nPositional arguments:");
    Object.keys(this.commands).forEach((cmd) => {
      console.log(`  ${cmd.padEnd(20)} ${this.commands[cmd].desc}`);
    });
    console.log("\nOptions:");
    Object.keys(this.options).forEach((key) => {
      const opt = this.options[key];
      const flags = opt.alias ? `-${opt.alias}, --${key}` : `--${key}`;
      console.log(`  ${flags.padEnd(20)} ${opt.describe || ""}`);
    });
    if (this.examples.length > 0) {
      console.log("\nExamples:");
      this.examples.forEach((ex) => {
        console.log(`  ${ex.cmd}`);
        console.log(`    ${ex.desc}`);
      });
    }
  }
}
function isFileUrl(url) {
  return /\.[a-zA-Z0-9]{1,5}(?:\.[a-zA-Z0-9]{1,5})*$/.test(url.split("?")[0]);
}
class ColorFileDownloader {
  constructor() {
    this.progressBar = null;
    this.multiBar = null;
    this.loadingSpinner = null;
    this.abortController = null;
    this.COL_FILENAME = 25;
    this.COL_SPINNER = 2;
    this.COL_BAR = 15;
    this.COL_PERCENT = 4;
    this.COL_DOWNLOADED = 16;
    this.COL_TOTAL = 10;
    this.COL_SPEED = 10;
    this.COL_ETA = 10;
    this.colors = {
      primary: chalk.cyan,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      info: chalk.blue,
      purple: chalk.magenta,
      pink: chalk.magentaBright,
      yellow: chalk.yellowBright,
      cyan: chalk.cyanBright,
      green: chalk.green,
      gradient: [
        chalk.blue,
        chalk.magenta,
        chalk.cyan,
        chalk.green,
        chalk.yellow,
        chalk.red
      ]
    };
    this.barColors = [
      "\x1B[32m",
      // green
      "\x1B[33m",
      // yellow
      "\x1B[34m",
      // blue
      "\x1B[35m",
      // magenta
      "\x1B[36m",
      // cyan
      "\x1B[91m",
      // bright red
      "\x1B[92m",
      // bright green
      "\x1B[93m",
      // bright yellow
      "\x1B[94m",
      // bright blue
      "\x1B[95m",
      // bright magenta
      "\x1B[96m"
      // bright cyan
    ];
    this.barGlueColors = [
      "\x1B[31m",
      // red
      "\x1B[33m",
      // yellow
      "\x1B[35m",
      // magenta
      "\x1B[37m",
      // white
      "\x1B[90m",
      // gray
      "\x1B[93m",
      // bright yellow
      "\x1B[97m"
      // bright white
    ];
    this.spinnerTypes = Object.keys(spinners.default || spinners);
    this.stateDir = this.getStateDirectory();
    this.ensureStateDirectoryExists();
    this.isPaused = false;
    this.pauseCallback = null;
    this.resumeCallback = null;
    this.abortControllers = [];
    this.keyboardListener = null;
    this.isAddingUrl = false;
  }
  /**
   * Get state directory from environment variable or use default
   * @returns {string} State directory path
   */
  getStateDirectory() {
    return process.env.GRAB_DOWNLOAD_STATE_DIR || path.join(process.cwd(), ".grab-downloads");
  }
  /**
   * Ensure state directory exists
   */
  ensureStateDirectoryExists() {
    try {
      if (!fs.existsSync(this.stateDir)) {
        fs.mkdirSync(this.stateDir, { recursive: true });
      }
    } catch (error) {
      console.log(this.colors.warning("⚠️  Could not create state directory, using current directory"));
      this.stateDir = process.cwd();
    }
  }
  /**
   * Get state file path for a given output path
   * @param {string} outputPath - The output file path
   * @returns {string} State file path
   */
  getStateFilePath(outputPath) {
    const stateFileName = path.basename(outputPath) + ".download-state";
    return path.join(this.stateDir, stateFileName);
  }
  /**
   * Clean up state file
   * @param {string} stateFilePath - Path to state file
   */
  cleanupStateFile(stateFilePath) {
    try {
      if (fs.existsSync(stateFilePath)) {
        fs.unlinkSync(stateFilePath);
      }
    } catch (error) {
      console.log(this.colors.warning("⚠️  Could not clean up state file"));
    }
  }
  /**
   * Print aligned header row for progress bars
   */
  printHeaderRow() {
    console.log(
      this.colors.success("📈 %".padEnd(this.COL_PERCENT)) + this.colors.yellow("📁 Files".padEnd(this.COL_FILENAME)) + this.colors.cyan("🔄".padEnd(this.COL_SPINNER)) + " " + this.colors.green("📊 Progress".padEnd(this.COL_BAR + 1)) + this.colors.info("📥 Downloaded".padEnd(this.COL_DOWNLOADED)) + this.colors.info("📦 Total".padEnd(this.COL_TOTAL)) + this.colors.purple("⚡ Speed".padEnd(this.COL_SPEED)) + this.colors.pink("⏱️ ETA".padEnd(this.COL_ETA))
    );
  }
  /**
   * Get random ora spinner type (for ora spinners)
   * @returns {string} Random ora spinner name
   */
  getRandomOraSpinner() {
    return this.spinnerTypes[Math.floor(Math.random() * this.spinnerTypes.length)];
  }
  /**
   * Get random bar color
   * @returns {string} ANSI color code
   */
  getRandomBarColor() {
    return this.barColors[Math.floor(Math.random() * this.barColors.length)];
  }
  /**
   * Get random bar glue color
   * @returns {string} ANSI color code
   */
  getRandomBarGlueColor() {
    return this.barGlueColors[Math.floor(Math.random() * this.barGlueColors.length)];
  }
  /**
   * Get random spinner type
   */
  getRandomSpinner() {
    return this.spinnerTypes[Math.floor(Math.random() * this.spinnerTypes.length)];
  }
  /**
   * Get spinner frames for a given spinner type
   * @param {string} spinnerType - The spinner type name
   * @returns {array} Array of spinner frame characters
   */
  getSpinnerFrames(spinnerType) {
    const spinnerData = spinners.default || spinners;
    const spinner = spinnerData[spinnerType];
    if (spinner && spinner.frames) {
      return spinner.frames;
    }
    return spinnerData.dots?.frames || ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  }
  /**
   * Get the visual width of a spinner frame (accounting for multi-char emojis)
   * @param {string} frame - The spinner frame
   * @returns {number} Visual width
   */
  getSpinnerWidth(frame) {
    let width = 0;
    for (const char of frame) {
      const code = char.codePointAt(0);
      if (code >= 126976 && code <= 128767 || // Miscellaneous Symbols and Pictographs
      code >= 127744 && code <= 128511 || // Miscellaneous Symbols
      code >= 128512 && code <= 128591 || // Emoticons
      code >= 128640 && code <= 128767 || // Transport and Map
      code >= 128768 && code <= 128895 || // Alchemical Symbols
      code >= 128896 && code <= 129023 || // Geometric Shapes Extended
      code >= 129024 && code <= 129279 || // Supplemental Arrows-C
      code >= 9728 && code <= 9983 || // Miscellaneous Symbols
      code >= 9984 && code <= 10175) {
        width += 2;
      } else {
        width += 1;
      }
    }
    return width;
  }
  /**
   * Calculate dynamic bar size based on spinner width and terminal width
   * @param {string} spinnerFrame - Current spinner frame
   * @param {number} baseBarSize - Base bar size
   * @returns {number} Adjusted bar size
   */
  calculateBarSize(spinnerFrame, baseBarSize = 20) {
    const terminalWidth = process.stdout.columns || 120;
    const spinnerWidth = this.getSpinnerWidth(spinnerFrame);
    const otherElementsWidth = 59;
    const filenameWidth = 20;
    const availableWidth = terminalWidth - otherElementsWidth - filenameWidth - spinnerWidth;
    const adjustedBarSize = Math.max(10, Math.min(baseBarSize, availableWidth));
    return adjustedBarSize;
  }
  /**
   * Check if server supports resumable downloads
   * @param {string} url - The URL to check
   * @returns {Object} - Server support info and headers
   */
  async checkServerSupport(url) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: this.abortController?.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const acceptRanges = response.headers.get("accept-ranges");
      const contentLength = response.headers.get("content-length");
      const lastModified = response.headers.get("last-modified");
      const etag = response.headers.get("etag");
      return {
        supportsResume: acceptRanges === "bytes",
        totalSize: contentLength ? parseInt(contentLength, 10) : 0,
        lastModified,
        etag,
        headers: response.headers
      };
    } catch (error) {
      console.log(this.colors.warning("⚠️  Could not check server resume support, proceeding with regular download"));
      return {
        supportsResume: false,
        totalSize: 0,
        lastModified: null,
        etag: null,
        headers: null
      };
    }
  }
  /**
   * Load download state from file
   * @param {string} stateFilePath - Path to state file
   * @returns {Object} - Download state
   */
  loadDownloadState(stateFilePath) {
    try {
      if (fs.existsSync(stateFilePath)) {
        const stateData = fs.readFileSync(stateFilePath, "utf8");
        return JSON.parse(stateData);
      }
    } catch (error) {
      console.log(this.colors.warning("⚠️  Could not load download state, starting fresh"));
    }
    return null;
  }
  /**
   * Save download state to file
   * @param {string} stateFilePath - Path to state file
   * @param {Object} state - Download state
   */
  saveDownloadState(stateFilePath, state) {
    try {
      fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.log(this.colors.warning("⚠️  Could not save download state"));
    }
  }
  /**
   * Get partial file size
   * @param {string} filePath - Path to partial file
   * @returns {number} - Size of partial file
   */
  getPartialFileSize(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return stats.size;
      }
    } catch (error) {
      console.log(this.colors.warning("⚠️  Could not read partial file size"));
    }
    return 0;
  }
  /**
   * Get random gradient color
   */
  getRandomColor() {
    return this.colors.gradient[Math.floor(Math.random() * this.colors.gradient.length)];
  }
  /**
   * Format bytes into human readable format with proper MB/GB units using 1024 base
   * @param {number} bytes - Number of bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return this.colors.info("0 B");
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [
      { unit: "B", color: this.colors.info },
      { unit: "KB", color: this.colors.cyan },
      { unit: "MB", color: this.colors.yellow },
      { unit: "GB", color: this.colors.purple },
      { unit: "TB", color: this.colors.pink },
      { unit: "PB", color: this.colors.primary }
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    const size = sizes[i] || sizes[sizes.length - 1];
    return size.color.bold(`${value} ${size.unit}`);
  }
  /**
   * Format bytes for progress display (without colors for progress bar)
   * @param {number} bytes - Number of bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted string without colors
   */
  formatBytesPlain(bytes, decimals = 1) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    return `${value} ${sizes[i] || sizes[sizes.length - 1]}`;
  }
  /**
   * Format bytes for progress display (compact version for tight layouts)
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string in compact format
   */
  formatBytesCompact(bytes) {
    if (bytes === 0) return "0B";
    const k = 1024;
    const kb = bytes / k;
    if (kb < 100) {
      const value2 = Math.round(kb);
      return `${value2}KB`;
    }
    const mb = bytes / (k * k);
    const value = mb.toFixed(1);
    return `${value}`;
  }
  /**
   * Truncate filename for display
   * @param {string} filename - Original filename
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated filename
   */
  truncateFilename(filename, maxLength = 25) {
    if (filename.length <= maxLength) return filename.padEnd(maxLength);
    const extension = path.extname(filename);
    const baseName = path.basename(filename, extension);
    if (baseName.length <= 3) {
      return filename.padEnd(maxLength);
    }
    const firstPart = Math.ceil((maxLength - extension.length - 3) / 2);
    const lastPart = Math.floor((maxLength - extension.length - 3) / 2);
    const truncatedBase = baseName.substring(0, firstPart) + "..." + baseName.substring(baseName.length - lastPart);
    return `${truncatedBase}${extension}`.padEnd(maxLength);
  }
  /**
   * Format ETA time in hours:minutes:seconds format
   * @param {number} seconds - ETA in seconds
   * @returns {string} Formatted ETA string (padded to consistent width)
   */
  formatETA(seconds) {
    if (!seconds || seconds === Infinity || seconds < 0) return "   --   ";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = Math.round(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`.padEnd(this.COL_ETA);
  }
  /**
   * Format progress for master bar showing sum of all downloads
   * @param {number} totalDownloaded - Total downloaded bytes across all files
   * @param {number} totalSize - Total size bytes across all files
   * @returns {string} Formatted progress string showing sums in MB
   */
  formatMasterProgress(totalDownloaded, totalSize) {
    const k = 1024;
    const totalDownloadedMB = totalDownloaded / (k * k);
    const totalSizeMB = totalSize / (k * k);
    if (totalSizeMB >= 1024) {
      const totalDownloadedGB = totalDownloadedMB / 1024;
      return `${totalDownloadedGB.toFixed(1)}GB`.padEnd(this.COL_DOWNLOADED);
    }
    return `${totalDownloadedMB.toFixed(1)}MB`.padEnd(this.COL_DOWNLOADED);
  }
  /**
   * Format progress display with consistent width
   * @param {number} downloaded - Downloaded bytes
   * @param {number} total - Total bytes
   * @returns {string} Formatted progress string
   */
  formatProgress(downloaded, total) {
    const downloadedStr = this.formatBytesCompact(downloaded);
    return downloadedStr.padEnd(this.COL_DOWNLOADED);
  }
  /**
   * Format downloaded bytes for display
   * @param {number} downloaded - Downloaded bytes
   * @returns {string} Formatted downloaded string
   */
  formatDownloaded(downloaded) {
    return this.formatBytesCompact(downloaded).padEnd(this.COL_DOWNLOADED);
  }
  /**
   * Format total bytes for display (separate column)
   * @param {number} total - Total bytes
   * @returns {string} Formatted total string
   */
  formatTotalDisplay(total) {
    if (total === 0) return "0MB".padEnd(this.COL_TOTAL);
    const k = 1024;
    const mb = total / (k * k);
    if (mb >= 1024) {
      const gb = mb / 1024;
      return `${gb.toFixed(1)}GB`.padEnd(this.COL_TOTAL);
    }
    if (mb < 1) {
      return `${mb.toFixed(2)}MB`.padEnd(this.COL_TOTAL);
    }
    return `${mb.toFixed(1)}MB`.padEnd(this.COL_TOTAL);
  }
  /**
   * Format total bytes for display (MB/GB format)
   * @param {number} total - Total bytes
   * @returns {string} Formatted total string
   */
  formatTotal(total) {
    if (total === 0) return "0MB".padEnd(this.COL_TOTAL);
    const k = 1024;
    const mb = total / (k * k);
    if (mb >= 1024) {
      const gb = mb / 1024;
      return `${gb.toFixed(1)}GB`.padEnd(this.COL_TOTAL);
    }
    if (mb < 1) {
      return `${mb.toFixed(2)}MB`.padEnd(this.COL_TOTAL);
    }
    return `${mb.toFixed(1)}MB`.padEnd(this.COL_TOTAL);
  }
  /**
   * Format speed display with consistent width
   * @param {string} speed - Speed string
   * @returns {string} Formatted speed string
   */
  formatSpeed(speed) {
    return speed.padEnd(this.COL_SPEED);
  }
  /**
   * Format speed for display (MB/s without "MB" text unless below 100KB/s)
   * @param {number} bytesPerSecond - Speed in bytes per second
   * @returns {string} Formatted speed string
   */
  formatSpeedDisplay(bytesPerSecond) {
    if (bytesPerSecond === 0) return "0B";
    const k = 1024;
    const kbPerSecond = bytesPerSecond / k;
    if (kbPerSecond < 100) {
      const formattedValue2 = Math.round(kbPerSecond);
      return `${formattedValue2}KB`;
    }
    const mbPerSecond = bytesPerSecond / (k * k);
    const formattedValue = mbPerSecond.toFixed(1);
    return `${formattedValue}`;
  }
  /**
   * Format speed for total display (MB/s without "MB" text unless below 100KB/s)
   * @param {number} bytesPerSecond - Speed in bytes per second
   * @returns {string} Formatted speed string
   */
  formatTotalSpeed(bytesPerSecond) {
    return this.formatSpeedDisplay(bytesPerSecond).padEnd(this.COL_SPEED);
  }
  /**
   * Download multiple files with multibar progress tracking
   * @param {Array} downloads - Array of {url, outputPath, filename} objects
   */
  async downloadMultipleFiles(downloads) {
    try {
      this.setupGlobalKeyboardListener();
      const masterBarColor = this.getRandomBarColor();
      const masterBarGlue = this.getRandomBarGlueColor();
      this.multiBar = new cliProgress.MultiBar({
        format: this.colors.success("{percentage}%") + " " + this.colors.yellow("{filename}") + " " + this.colors.cyan("{spinner}") + " " + masterBarColor + "{bar}\x1B[0m " + this.colors.info("{downloadedDisplay}") + " " + this.colors.info("{totalDisplay}") + " " + this.colors.purple("{speed}") + " " + this.colors.pink("{etaFormatted}"),
        hideCursor: true,
        clearOnComplete: false,
        stopOnComplete: true,
        autopadding: false,
        barCompleteChar: "█",
        barIncompleteChar: "░",
        barGlue: masterBarGlue,
        barsize: this.COL_BAR
      });
      let totalDownloaded = 0;
      let totalSize = 0;
      let individualSpeeds = new Array(downloads.length).fill(0);
      let individualSizes = new Array(downloads.length).fill(0);
      let individualDownloaded = new Array(downloads.length).fill(0);
      let individualStartTimes = new Array(downloads.length).fill(Date.now());
      let lastSpeedUpdate = Date.now();
      let lastIndividualDownloaded = new Array(downloads.length).fill(0);
      let lastTotalUpdate = Date.now();
      let lastTotalDownloaded = 0;
      const totalSizeFromDownloads = downloads.reduce((sum, download) => {
        const estimatedSize = download.estimatedSize || 1024 * 1024 * 100;
        return sum + estimatedSize;
      }, 0);
      totalSize = totalSizeFromDownloads;
      let actualTotalSize = 0;
      const speedUpdateInterval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastUpdate = (now - lastSpeedUpdate) / 1e3;
        for (let i = 0; i < downloads.length; i++) {
          if (timeSinceLastUpdate > 0) {
            const incrementalDownloaded = individualDownloaded[i] - lastIndividualDownloaded[i];
            individualSpeeds[i] = incrementalDownloaded / timeSinceLastUpdate;
            if (fileBars[i] && fileBars[i].bar) {
              const speed = this.formatSpeed(this.formatSpeedDisplay(individualSpeeds[i]));
              const eta2 = individualSizes[i] > 0 ? this.formatETA((individualSizes[i] - individualDownloaded[i]) / individualSpeeds[i]) : this.formatETA(0);
              fileBars[i].bar.update(individualDownloaded[i], {
                speed,
                progress: this.formatProgress(individualDownloaded[i], individualSizes[i]),
                downloadedDisplay: this.formatBytesCompact(individualDownloaded[i]),
                totalDisplay: this.formatTotalDisplay(individualSizes[i]),
                etaFormatted: eta2
              });
            }
          }
        }
        lastSpeedUpdate = now;
        lastIndividualDownloaded = [...individualDownloaded];
        const totalSpeedBps = individualSpeeds.reduce((sum, speed) => sum + speed, 0);
        const totalDownloadedFromFiles = individualDownloaded.reduce((sum, downloaded) => sum + downloaded, 0);
        const timeElapsed = (now - individualStartTimes[0]) / 1e3;
        const totalEta = totalSize > 0 && totalSpeedBps > 0 ? this.formatETA((totalSize - totalDownloadedFromFiles) / totalSpeedBps) : this.formatETA(0);
        const totalPercentage = totalSize > 0 ? Math.round(totalDownloadedFromFiles / totalSize * 100) : 0;
        const discoveredTotalSize = individualSizes.reduce((sum, size) => sum + size, 0);
        const displayTotalSize = discoveredTotalSize > 0 ? discoveredTotalSize : totalSize;
        masterBar.update(totalDownloadedFromFiles, {
          speed: this.formatTotalSpeed(totalSpeedBps),
          progress: this.formatMasterProgress(totalDownloadedFromFiles, displayTotalSize),
          downloadedDisplay: this.formatBytesCompact(totalDownloadedFromFiles),
          totalDisplay: this.formatTotalDisplay(displayTotalSize),
          etaFormatted: this.formatETA(timeElapsed),
          // Show time elapsed instead of ETA
          percentage: displayTotalSize > 0 ? Math.round(totalDownloadedFromFiles / displayTotalSize * 100) : 0
        });
      }, 1e3);
      const masterSpinnerWidth = this.getSpinnerWidth("⬇️");
      const masterMaxFilenameLength = this.COL_FILENAME - masterSpinnerWidth;
      const masterBarSize = this.calculateBarSize("⬇️", this.COL_BAR);
      const masterBar = this.multiBar.create(totalSize, 0, {
        filename: "Total".padEnd(masterMaxFilenameLength),
        spinner: "⬇️",
        speed: "0B".padEnd(this.COL_SPEED),
        progress: this.formatMasterProgress(0, totalSize),
        downloadedDisplay: this.formatBytesCompact(0),
        totalDisplay: this.formatTotalDisplay(totalSize),
        etaFormatted: this.formatETA(0),
        percentage: "  0".padStart(this.COL_PERCENT - 1)
      }, {
        format: this.colors.success("{percentage}%") + " " + this.colors.yellow.bold("{filename}") + " " + this.colors.success("{spinner}") + " \x1B[92m{bar}\x1B[0m " + this.colors.info("{downloadedDisplay}") + " " + this.colors.info("{totalDisplay}") + " " + this.colors.purple("{speed}") + " " + this.colors.pink("{etaFormatted}"),
        barCompleteChar: "▶",
        barIncompleteChar: "▷",
        barGlue: "\x1B[33m",
        barsize: masterBarSize
      });
      const fileBars = downloads.map((download, index) => {
        const spinnerType = this.getRandomSpinner();
        const spinnerFrames = this.getSpinnerFrames(spinnerType);
        const spinnerWidth = this.getSpinnerWidth(spinnerFrames[0]);
        const maxFilenameLength = this.COL_FILENAME - spinnerWidth;
        const truncatedName = this.truncateFilename(download.filename, maxFilenameLength);
        const fileBarColor = this.getRandomBarColor();
        const fileBarGlue = this.getRandomBarGlueColor();
        const barSize = this.calculateBarSize(spinnerFrames[0], this.COL_BAR);
        return {
          bar: this.multiBar.create(100, 0, {
            filename: truncatedName,
            spinner: spinnerFrames[0],
            speed: this.formatSpeed("0B"),
            progress: this.formatProgress(0, 0),
            downloadedDisplay: this.formatBytesCompact(0),
            totalDisplay: this.formatTotalDisplay(0),
            etaFormatted: this.formatETA(0),
            percentage: "  0".padStart(3)
          }, {
            format: this.colors.yellow("{filename}") + " " + this.colors.cyan("{spinner}") + " " + fileBarColor + "{bar}\x1B[0m " + this.colors.success("{percentage}%") + " " + this.colors.info("{downloadedDisplay}") + " " + this.colors.info("{totalDisplay}") + " " + this.colors.purple("{speed}") + " " + this.colors.pink("{etaFormatted}"),
            barCompleteChar: "█",
            barIncompleteChar: "░",
            barGlue: fileBarGlue,
            barsize: barSize
          }),
          spinnerFrames,
          spinnerIndex: 0,
          lastSpinnerUpdate: Date.now(),
          lastFrameUpdate: Date.now(),
          download: { ...download, index }
        };
      });
      const downloadPromises = fileBars.map(async (fileBar, index) => {
        try {
          await this.downloadSingleFileWithBar(fileBar, masterBar, downloads.length, {
            totalDownloaded,
            totalSize,
            individualSpeeds,
            individualSizes,
            individualDownloaded,
            individualStartTimes,
            lastTotalUpdate,
            lastTotalDownloaded,
            actualTotalSize
          });
          return { success: true, index, filename: fileBar.download.filename };
        } catch (error) {
          return { success: false, index, filename: fileBar.download.filename, error };
        }
      });
      const results = await Promise.allSettled(downloadPromises);
      clearInterval(speedUpdateInterval);
      this.multiBar.stop();
      const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
      const failed = results.length - successful;
      if (failed > 0) {
        console.log(this.colors.error(`❌ Failed: ${failed}/${downloads.length}`));
        results.forEach((result, index) => {
          if (result.status === "rejected" || !result.value.success) {
            const filename = downloads[index].filename;
            const error = result.reason || result.value?.error || "Unknown error";
            console.log(this.colors.error(`  • ${filename}: ${error.message || error}`));
          }
        });
      }
      const celebrationEmojis = ["🥳", "🎊", "🎈", "🌟", "💯", "🚀", "✨", "🔥"];
      const randomEmoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
      console.log(this.colors.green(`${randomEmoji} Success: ${successful}/${downloads.length}`));
      this.clearAbortControllers();
      let pausedMessageShown = false;
      this.setPauseCallback(() => {
        if (!pausedMessageShown) {
          this.multiBar.stop();
          console.log(this.colors.warning("⏸️  Paused. Press p to resume, a to add URL."));
          pausedMessageShown = true;
        }
      });
      this.setResumeCallback(() => {
        if (pausedMessageShown) {
          console.log(this.colors.success("▶️  Resumed. Press p to pause, a to add URL."));
          pausedMessageShown = false;
        }
      });
    } catch (error) {
      if (this.multiBar) {
        this.multiBar.stop();
      }
      console.error(this.colors.error.bold("💥 Batch download failed: ") + this.colors.warning(error.message));
      throw error;
    }
  }
  /**
   * Download a single file with multibar integration and resume capability
   * @param {Object} fileBar - File bar object with progress bar and spinner info
   * @param {Object} masterBar - Master progress bar
   * @param {number} totalFiles - Total number of files being downloaded
   * @param {Object} totalTracking - Object to track total progress
   */
  async downloadSingleFileWithBar(fileBar, masterBar, totalFiles, totalTracking) {
    const { bar, spinnerFrames, download } = fileBar;
    const { url, outputPath, filename } = download;
    const stateFilePath = this.getStateFilePath(outputPath);
    const tempFilePath = outputPath + ".tmp";
    try {
      const abortController = new AbortController();
      this.setAbortController(abortController);
      const serverInfo = await this.checkServerSupport(url);
      const previousState = this.loadDownloadState(stateFilePath);
      const partialSize = this.getPartialFileSize(tempFilePath);
      let startByte = 0;
      let resuming = false;
      if (serverInfo.supportsResume && partialSize > 0 && previousState) {
        const fileUnchanged = (!serverInfo.lastModified || serverInfo.lastModified === previousState.lastModified) && (!serverInfo.etag || serverInfo.etag === previousState.etag) && serverInfo.totalSize === previousState.totalSize;
        if (fileUnchanged && partialSize < serverInfo.totalSize) {
          startByte = partialSize;
          resuming = true;
        } else {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          this.cleanupStateFile(stateFilePath);
        }
      } else if (partialSize > 0) {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
      const headers = {};
      if (resuming && startByte > 0) {
        headers["Range"] = `bytes=${startByte}-`;
      }
      const response = await fetch(url, {
        headers,
        signal: abortController.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentLength = response.headers.get("content-length");
      const totalSize = resuming ? serverInfo.totalSize : contentLength ? parseInt(contentLength, 10) : 0;
      const downloadState = {
        url,
        outputPath,
        totalSize,
        startByte,
        lastModified: serverInfo.lastModified,
        etag: serverInfo.etag,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.saveDownloadState(stateFilePath, downloadState);
      bar.setTotal(totalSize || 100);
      bar.update(startByte, {
        progress: this.formatProgress(startByte, totalSize),
        downloadedDisplay: this.formatBytesCompact(startByte),
        totalDisplay: this.formatTotalDisplay(totalSize)
      });
      const writeStream = fs.createWriteStream(tempFilePath, {
        flags: resuming ? "a" : "w"
      });
      let downloaded = startByte;
      let lastTime = Date.now();
      let lastDownloaded = downloaded;
      const progressStream = new Readable({
        read() {
        }
      });
      const reader = response.body.getReader();
      const processChunk = async () => {
        try {
          while (true) {
            while (this.isPaused) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            const { done, value } = await reader.read();
            if (done) {
              progressStream.push(null);
              break;
            }
            downloaded += value.length;
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1e3;
            if (now - fileBar.lastFrameUpdate >= 150) {
              fileBar.spinnerIndex = (fileBar.spinnerIndex + 1) % spinnerFrames.length;
              fileBar.lastFrameUpdate = now;
              const currentSpinner = spinnerFrames[fileBar.spinnerIndex];
              const newBarSize = this.calculateBarSize(currentSpinner, this.COL_BAR);
              bar.options.barsize = newBarSize;
            }
            if (now - fileBar.lastSpinnerUpdate >= 45e3) {
              const newSpinnerType = this.getRandomSpinner();
              fileBar.spinnerFrames = this.getSpinnerFrames(newSpinnerType);
              fileBar.spinnerIndex = 0;
              fileBar.lastSpinnerUpdate = now;
            }
            if (timeDiff >= 0.3) {
              bar.update(downloaded, {
                spinner: spinnerFrames[fileBar.spinnerIndex],
                progress: this.formatProgress(downloaded, totalSize),
                downloadedDisplay: this.formatBytesCompact(downloaded),
                totalDisplay: this.formatTotalDisplay(totalSize)
              });
              if (totalTracking) {
                const bytesDiff = downloaded - lastDownloaded;
                totalTracking.totalDownloaded += bytesDiff;
                const fileIndex = fileBar.download.index || 0;
                totalTracking.individualDownloaded[fileIndex] = downloaded;
                totalTracking.individualSizes[fileIndex] = totalSize;
                totalTracking.totalSize = totalTracking.individualSizes.reduce((sum, size) => sum + size, 0);
                if (totalTracking.actualTotalSize !== void 0) {
                  totalTracking.actualTotalSize = totalTracking.totalSize;
                }
                if (totalSize > 0 && totalTracking.individualSizes[fileIndex] === totalSize) {
                  masterBar.setTotal(totalTracking.totalSize);
                }
              }
              lastTime = now;
              lastDownloaded = downloaded;
            } else {
              bar.update(downloaded, {
                spinner: spinnerFrames[fileBar.spinnerIndex],
                progress: this.formatProgress(downloaded, totalSize),
                downloadedDisplay: this.formatBytesCompact(downloaded),
                totalDisplay: this.formatTotalDisplay(totalSize)
              });
            }
            progressStream.push(Buffer.from(value));
          }
        } catch (error) {
          progressStream.destroy(error);
        }
      };
      processChunk();
      await pipeline(progressStream, writeStream);
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      fs.renameSync(tempFilePath, outputPath);
      this.cleanupStateFile(stateFilePath);
      const currentCompleted = masterBar.value + 1;
      const finalTotalSize = totalTracking.actualTotalSize || totalTracking.totalSize;
      const discoveredTotalSize = totalTracking.individualSizes.reduce((sum, size) => sum + size, 0);
      const displayTotalSize = discoveredTotalSize > 0 ? discoveredTotalSize : finalTotalSize;
      masterBar.update(totalTracking.totalDownloaded, {
        progress: this.formatMasterProgress(totalTracking.totalDownloaded, displayTotalSize),
        downloadedDisplay: this.formatBytesCompact(totalTracking.totalDownloaded),
        totalDisplay: this.formatTotalDisplay(displayTotalSize),
        etaFormatted: this.formatETA((Date.now() - (totalTracking.individualStartTimes?.[0] || Date.now())) / 1e3)
        // Show time elapsed
      });
    } catch (error) {
      bar.update(bar.total, {
        spinner: "❌",
        speed: this.formatSpeed("FAILED"),
        downloadedDisplay: this.formatBytesCompact(0),
        totalDisplay: this.formatTotalDisplay(0)
      });
      console.log(this.colors.info(`💾 Partial download saved for ${filename}. Restart to resume.`));
      throw error;
    }
  }
  /**
   * Download a file with colorful progress tracking and resume capability
   * @param {string} url - The URL to download
   * @param {string} outputPath - The local path to save the file
   */
  async downloadFile(url, outputPath) {
    const stateFilePath = this.getStateFilePath(outputPath);
    const tempFilePath = outputPath + ".tmp";
    try {
      this.abortController = new AbortController();
      const randomOraSpinner = this.getRandomOraSpinner();
      this.loadingSpinner = ora({
        text: this.colors.primary("🌐 Checking server capabilities..."),
        spinner: randomOraSpinner,
        color: "cyan"
      }).start();
      const serverInfo = await this.checkServerSupport(url);
      const previousState = this.loadDownloadState(stateFilePath);
      const partialSize = this.getPartialFileSize(tempFilePath);
      let startByte = 0;
      let resuming = false;
      if (serverInfo.supportsResume && partialSize > 0 && previousState) {
        const fileUnchanged = (!serverInfo.lastModified || serverInfo.lastModified === previousState.lastModified) && (!serverInfo.etag || serverInfo.etag === previousState.etag) && serverInfo.totalSize === previousState.totalSize;
        if (fileUnchanged && partialSize < serverInfo.totalSize) {
          startByte = partialSize;
          resuming = true;
          this.loadingSpinner.succeed(this.colors.success(`✅ Found partial download: ${this.formatBytes(partialSize)} of ${this.formatTotal(serverInfo.totalSize)}`));
          console.log(this.colors.info(`🔄 Resuming download from ${this.formatBytes(startByte)}`));
        } else {
          this.loadingSpinner.warn(this.colors.warning("⚠️  File changed on server, starting fresh download"));
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          this.cleanupStateFile(stateFilePath);
        }
      } else {
        this.loadingSpinner.stop();
        if (partialSize > 0) {
          console.log(this.colors.warning("⚠️  Server does not support resumable downloads, starting fresh"));
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        }
      }
      const headers = {};
      if (resuming && startByte > 0) {
        headers["Range"] = `bytes=${startByte}-`;
      }
      const response = await fetch(url, {
        headers,
        signal: this.abortController.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentLength = response.headers.get("content-length");
      const totalSize = resuming ? serverInfo.totalSize : contentLength ? parseInt(contentLength, 10) : 0;
      const remainingSize = contentLength ? parseInt(contentLength, 10) : 0;
      if (!resuming) {
        if (totalSize === 0) {
          console.log(this.colors.warning("⚠️  Warning: Content-Length not provided, progress will be estimated"));
        } else {
          console.log(this.colors.info(`📦 File size: ${this.formatTotal(totalSize)}`));
        }
      }
      const downloadState = {
        url,
        outputPath,
        totalSize,
        startByte,
        lastModified: serverInfo.lastModified,
        etag: serverInfo.etag,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.saveDownloadState(stateFilePath, downloadState);
      const singleBarColor = this.getRandomBarColor();
      const singleBarGlue = this.getRandomBarGlueColor();
      let currentSpinnerType = this.getRandomSpinner();
      let spinnerFrames = this.getSpinnerFrames(currentSpinnerType);
      let spinnerFrameIndex = 0;
      const initialBarSize = this.calculateBarSize(spinnerFrames[0], this.COL_BAR);
      console.log(
        this.colors.success("📈 %".padEnd(this.COL_PERCENT)) + this.colors.cyan("🔄".padEnd(this.COL_SPINNER)) + " " + this.colors.green("📊 Progress".padEnd(this.COL_BAR + 1)) + this.colors.info("📥 Downloaded".padEnd(this.COL_DOWNLOADED)) + this.colors.info("📦 Total".padEnd(this.COL_TOTAL)) + this.colors.purple("⚡ Speed".padEnd(this.COL_SPEED)) + this.colors.pink("⏱️ ETA".padEnd(this.COL_ETA))
      );
      const keyboardRl = this.setupSingleFileKeyboardListeners(url, outputPath);
      this.progressBar = new cliProgress.SingleBar({
        format: this.colors.success("{percentage}%") + " " + this.colors.cyan("{spinner}") + " " + singleBarColor + "{bar}\x1B[0m " + this.colors.info("{downloadedDisplay}") + " " + this.colors.info("{totalDisplay}") + " " + this.colors.purple("{speed}") + " " + this.colors.pink("{etaFormatted}"),
        barCompleteChar: "█",
        barIncompleteChar: "░",
        barGlue: singleBarGlue,
        hideCursor: true,
        barsize: initialBarSize,
        stopOnComplete: true,
        clearOnComplete: false
      });
      this.progressBar.start(totalSize || 100, startByte, {
        speed: this.formatSpeed("0B/s"),
        etaFormatted: this.formatETA(0),
        spinner: spinnerFrames[0],
        progress: this.formatProgress(startByte, totalSize),
        downloadedDisplay: this.formatBytesCompact(startByte),
        totalDisplay: this.formatTotalDisplay(totalSize)
      });
      const writeStream = fs.createWriteStream(tempFilePath, {
        flags: resuming ? "a" : "w"
      });
      let downloaded = startByte;
      let sessionDownloaded = 0;
      let lastTime = Date.now();
      let lastDownloaded = downloaded;
      let lastSpinnerUpdate = Date.now();
      let lastSpinnerFrameUpdate = Date.now();
      const progressStream = new Readable({
        read() {
        }
        // No-op, we'll push data manually
      });
      const reader = response.body.getReader();
      const processChunk = async () => {
        try {
          while (true) {
            while (this.isPaused) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            const { done, value } = await reader.read();
            if (done) {
              progressStream.push(null);
              break;
            }
            sessionDownloaded += value.length;
            downloaded += value.length;
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1e3;
            if (now - lastSpinnerUpdate >= 45e3) {
              currentSpinnerType = this.getRandomSpinner();
              spinnerFrames = this.getSpinnerFrames(currentSpinnerType);
              spinnerFrameIndex = 0;
              lastSpinnerUpdate = now;
            }
            if (now - lastSpinnerFrameUpdate >= 120) {
              spinnerFrameIndex = (spinnerFrameIndex + 1) % spinnerFrames.length;
              lastSpinnerFrameUpdate = now;
              const currentSpinner = spinnerFrames[spinnerFrameIndex];
              const newBarSize = this.calculateBarSize(currentSpinner, this.COL_BAR);
              this.progressBar.options.barsize = newBarSize;
            }
            if (timeDiff >= 0.3) {
              const bytesDiff = downloaded - lastDownloaded;
              const speedBps = bytesDiff / timeDiff;
              const speed = this.formatSpeed(this.formatSpeedDisplay(speedBps));
              const eta2 = totalSize > 0 ? this.formatETA((totalSize - downloaded) / speedBps) : this.formatETA(0);
              this.progressBar.update(downloaded, {
                speed,
                etaFormatted: eta2,
                spinner: spinnerFrames[spinnerFrameIndex],
                progress: this.formatProgress(downloaded, totalSize),
                downloadedDisplay: this.formatBytesCompact(downloaded),
                totalDisplay: this.formatTotalDisplay(totalSize)
              });
              lastTime = now;
              lastDownloaded = downloaded;
            } else {
              this.progressBar.update(downloaded, {
                spinner: spinnerFrames[spinnerFrameIndex],
                progress: this.formatProgress(downloaded, totalSize),
                downloadedDisplay: this.formatBytesCompact(downloaded),
                totalDisplay: this.formatTotalDisplay(totalSize)
              });
            }
            progressStream.push(Buffer.from(value));
          }
        } catch (error) {
          progressStream.destroy(error);
        }
      };
      processChunk();
      await pipeline(progressStream, writeStream);
      this.progressBar.stop();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      fs.renameSync(tempFilePath, outputPath);
      this.cleanupStateFile(stateFilePath);
      console.log(this.colors.success("✅ Download completed!"));
      console.log(this.colors.primary("📁 File saved to: ") + chalk.underline(outputPath));
      console.log(this.colors.purple("📊 Total size: ") + this.formatBytes(downloaded));
      if (resuming) {
        console.log(this.colors.info("🔄 Resumed from: ") + this.formatBytes(startByte));
        console.log(this.colors.info("📥 Downloaded this session: ") + this.formatBytes(sessionDownloaded));
      }
      const celebrationEmojis = ["🥳", "🎊", "🎈", "🌟", "💯", "🚀", "✨", "🔥"];
      const randomEmoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
      console.log(this.colors.success(`${randomEmoji} Successfully downloaded! ${randomEmoji}`));
    } catch (error) {
      if (this.loadingSpinner && this.loadingSpinner.isSpinning) {
        this.loadingSpinner.fail(this.colors.error("❌ Connection failed"));
      }
      if (this.progressBar) {
        this.progressBar.stop();
      }
      console.error(this.colors.error.bold("💥 Download failed: ") + this.colors.warning(error.message));
      if (error.name === "AbortError") {
        console.log(this.colors.info("💾 Download state saved. You can resume later by running the same command."));
      } else {
        console.log(this.colors.info("💾 Partial download saved. Restart to resume from where it left off."));
      }
      throw error;
    }
  }
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.loadingSpinner && this.loadingSpinner.isSpinning) {
      this.loadingSpinner.stop();
    }
    if (this.progressBar) {
      this.progressBar.stop();
    }
    if (this.multiBar) {
      this.multiBar.stop();
    }
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.keyboardListener) {
      try {
        this.keyboardListener.kill();
      } catch (error) {
      }
    }
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }
  /**
   * Set up global keyboard listener for pause/resume and add URL functionality
   */
  setupGlobalKeyboardListener() {
    this.setupFallbackKeyboardListener();
  }
  /**
   * Handle global key press events
   * @param {string} keyName - The name of the pressed key
   */
  async handleGlobalKeyPress(keyName) {
    if (keyName === "P") {
      console.log(this.colors.info("P key pressed - toggling pause/resume"));
      if (!this.isPaused) {
        this.pauseAll();
      } else {
        this.resumeAll();
      }
    } else if (keyName === "A" && !this.isAddingUrl) {
      console.log(this.colors.info("A key pressed - adding URL"));
      await this.promptForNewUrl();
    }
  }
  /**
   * Prompt user for a new URL to download
   */
  async promptForNewUrl() {
    this.isAddingUrl = true;
    try {
      console.log(this.colors.cyan("\n📥 Enter URL to add (or press Enter to cancel):"));
      const rl = require$$0.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      const newUrl = await new Promise((resolve) => {
        rl.question("", (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
      if (newUrl && this.isValidUrl(newUrl)) {
        console.log(this.colors.success(`✅ Adding URL: ${newUrl}`));
        const newFilename = this.generateFilename(newUrl);
        const newOutputPath = path.isAbsolute(newFilename) ? newFilename : path.join(process.cwd(), newFilename);
        const outputDir = path.dirname(newOutputPath);
        try {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
        } catch (error) {
          console.error(this.colors.red.bold("❌ Could not create output directory: ") + error.message);
          return;
        }
        if (this.multiBar) {
          await this.addToMultipleDownloads(newUrl, newOutputPath, newFilename);
        } else {
          this.downloadFile(newUrl, newOutputPath).catch((error) => {
            console.error(this.colors.error(`❌ Failed to download ${newFilename}: ${error.message}`));
          });
        }
        console.log(this.colors.success("🚀 New download started!"));
      } else if (newUrl) {
        console.log(this.colors.red("❌ Invalid URL provided."));
      } else {
        console.log(this.colors.yellow("⚠️  No URL provided, cancelling."));
      }
    } catch (error) {
      console.error(this.colors.red("❌ Error adding URL: ") + error.message);
    } finally {
      this.isAddingUrl = false;
      if (this.isPaused) {
        console.log(this.colors.warning("⏸️  Still paused. Press p to resume, a to add URL."));
      } else {
        console.log(this.colors.success("▶️  Downloads active. Press p to pause, a to add URL."));
      }
    }
  }
  /**
   * Add a new download to the multiple downloads queue
   * @param {string} url - The URL to download
   * @param {string} outputPath - The output path
   * @param {string} filename - The filename
   */
  async addToMultipleDownloads(url, outputPath, filename) {
    const spinnerType = this.getRandomSpinner();
    const spinnerFrames = this.getSpinnerFrames(spinnerType);
    const spinnerWidth = this.getSpinnerWidth(spinnerFrames[0]);
    const maxFilenameLength = this.COL_FILENAME - spinnerWidth;
    const truncatedName = this.truncateFilename(filename, maxFilenameLength);
    const fileBarColor = this.getRandomBarColor();
    const fileBarGlue = this.getRandomBarGlueColor();
    const barSize = this.calculateBarSize(spinnerFrames[0], this.COL_BAR);
    const newDownload = {
      url,
      outputPath,
      filename
    };
    const newFileBar = {
      bar: this.multiBar.create(100, 0, {
        filename: truncatedName,
        spinner: spinnerFrames[0],
        speed: this.formatSpeed("0B"),
        progress: this.formatProgress(0, 0),
        downloadedDisplay: this.formatBytesCompact(0),
        totalDisplay: this.formatTotalDisplay(0),
        etaFormatted: this.formatETA(0),
        percentage: "  0".padStart(3)
      }, {
        format: this.colors.yellow("{filename}") + " " + this.colors.cyan("{spinner}") + " " + fileBarColor + "{bar}\x1B[0m " + this.colors.success("{percentage}%") + " " + this.colors.info("{downloadedDisplay}") + " " + this.colors.info("{totalDisplay}") + " " + this.colors.purple("{speed}") + " " + this.colors.pink("{etaFormatted}"),
        barCompleteChar: "█",
        barIncompleteChar: "░",
        barGlue: fileBarGlue,
        barsize: barSize
      }),
      spinnerFrames,
      spinnerIndex: 0,
      lastSpinnerUpdate: Date.now(),
      lastFrameUpdate: Date.now(),
      download: { ...newDownload, index: this.getCurrentDownloadCount() }
    };
    this.downloadSingleFileWithBar(newFileBar, this.getMasterBar(), this.getCurrentDownloadCount() + 1, {
      totalDownloaded: 0,
      totalSize: 0,
      individualSpeeds: [],
      individualSizes: [],
      individualDownloaded: [],
      individualStartTimes: [],
      lastTotalUpdate: Date.now(),
      lastTotalDownloaded: 0,
      actualTotalSize: 0
    }).catch((error) => {
      console.error(this.colors.error(`❌ Failed to download ${newDownload.filename}: ${error.message}`));
    });
  }
  /**
   * Get current download count (for multiple downloads)
   * @returns {number} Current number of downloads
   */
  getCurrentDownloadCount() {
    return 1;
  }
  /**
   * Get master bar (for multiple downloads)
   * @returns {Object} Master progress bar
   */
  getMasterBar() {
    return null;
  }
  /**
   * Set up fallback keyboard listener using readline
   */
  setupFallbackKeyboardListener() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      const handleKeypress = async (str) => {
        if (str === "") {
          console.log(this.colors.yellow.bold("\n🛑 Download cancelled by user"));
          process.exit(0);
        }
        if (str.toLowerCase() === "p") {
          console.log(this.colors.info("P key pressed - toggling pause/resume"));
          if (!this.isPaused) {
            this.pauseAll();
          } else {
            this.resumeAll();
          }
        }
        if (str.toLowerCase() === "a" && !this.isAddingUrl) {
          console.log(this.colors.info("A key pressed - adding URL"));
          await this.promptForNewUrl();
        }
      };
      process.stdin.on("data", handleKeypress);
    }
  }
  /**
   * Set up keyboard listeners for single file download (legacy method)
   * @param {string} url - The URL being downloaded
   * @param {string} outputPath - The output path
   */
  setupSingleFileKeyboardListeners(url, outputPath) {
    this.setupGlobalKeyboardListener();
    return null;
  }
  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get file extension from URL
   * @param {string} url - URL to extract extension from
   * @returns {string} - File extension or empty string
   */
  getFileExtension(url) {
    try {
      const pathname = new URL(url).pathname;
      return path.extname(pathname).toLowerCase();
    } catch {
      return "";
    }
  }
  /**
   * Generate filename from URL
   * @param {string} url - Download URL
   * @returns {string} - Generated filename
   */
  generateFilename(url) {
    try {
      const filename = path.basename(new URL(url).pathname);
      return filename || "downloaded-file";
    } catch (error) {
      return "downloaded-file";
    }
  }
  setPauseCallback(cb) {
    this.pauseCallback = cb;
  }
  setResumeCallback(cb) {
    this.resumeCallback = cb;
  }
  setAbortController(controller) {
    this.abortControllers.push(controller);
  }
  clearAbortControllers() {
    this.abortControllers = [];
  }
  pauseAll() {
    this.isPaused = true;
    console.log(this.colors.warning("⏸️  Pausing all downloads..."));
    if (this.pauseCallback) this.pauseCallback();
  }
  resumeAll() {
    this.isPaused = false;
    console.log(this.colors.success("▶️  Resuming all downloads..."));
    if (this.resumeCallback) this.resumeCallback();
  }
}
const __isMain = typeof import.meta.main === "boolean" && import.meta.main || (() => {
  try {
    const scriptArg = process.argv[1] ? path.resolve(process.argv[1]) : "";
    if (!scriptArg) return false;
    const href = pathToFileURL(scriptArg).href;
    return import.meta.url === href;
  } catch {
    return false;
  }
})();
if (__isMain) {
  const argv = new ArgParser().usage("Usage: grab-url <url...> [options]").command("$0 <url>", "Fetch data or download files; pass one or more URLs").option("no-save", {
    type: "boolean",
    default: false,
    describe: "Don't save output to file, just print to console"
  }).option("output", {
    alias: "o",
    type: "string",
    describe: "Output filename (default: output.json)",
    default: null
  }).option("params", {
    alias: "p",
    type: "string",
    describe: `JSON string of query parameters (e.g., '{"key":"value"}')`,
    coerce: (arg) => {
      if (!arg) return {};
      try {
        return JSON.parse(arg);
      } catch (e) {
        throw new Error(`Invalid JSON in params: ${arg}`);
      }
    }
  }).help().alias("h", "help").example("grab-url https://api.example.com/data", "Fetch JSON/text from an API and save to output.json").example("grab-url https://example.com/file1.zip https://example.com/file2.zip", "Download multiple files concurrently").example("grab-url https://example.com/file.iso -o ubuntu.iso", "Save the first URL to a custom filename").version("1.0.0").strict().parseSync();
  const urls = argv.urls || [];
  const params = argv.params || {};
  const outputFile = argv.output;
  const noSave = argv["no-save"];
  const anyFileUrl = urls.some(isFileUrl);
  const isDownloadMode = urls.length > 1 || anyFileUrl;
  (async () => {
    if (isDownloadMode) {
      const downloader = new ColorFileDownloader();
      const downloads = urls.map((url, i) => {
        let filename = null;
        if (i === 0 && outputFile) filename = outputFile;
        return { url, outputPath: filename };
      });
      const downloadObjects = downloads.map((download, index) => {
        let actualUrl = download.url;
        let filename = download.outputPath;
        if (!filename) filename = downloader.generateFilename(actualUrl);
        const outputPath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
        const outputDir = path.dirname(outputPath);
        try {
          if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        } catch (error) {
          console.error(chalk.red.bold("❌ Could not create output directory: ") + error.message);
          process.exit(1);
        }
        return {
          url: actualUrl,
          outputPath,
          filename: path.basename(filename)
        };
      });
      try {
        await downloader.downloadMultipleFiles(downloadObjects);
        const statsTable = new Table({
          head: ["Filename", "Size", "Created"],
          colWidths: [32, 14, 25],
          colAligns: ["left", "right", "left"],
          style: { "padding-left": 1, "padding-right": 1, head: [], border: [] }
        });
        downloadObjects.forEach((downloadObj) => {
          try {
            const stats = fs.statSync(downloadObj.outputPath);
            statsTable.push([
              downloadObj.filename,
              downloader.formatBytes(stats.size),
              stats.birthtime.toLocaleString()
            ]);
          } catch (error) {
            statsTable.push([
              downloadObj.filename,
              "Error",
              "Could not read"
            ]);
          }
        });
        console.log(chalk.cyan.bold("\nFile Details:"));
        console.log(statsTable.toString());
      } catch (error) {
        console.error(chalk.red.bold("Failed to download files: ") + chalk.yellow(error.message));
        process.exit(1);
      }
      downloader.cleanup();
    } else {
      const url = urls[0];
      const startTime = process.hrtime();
      try {
        const res = await grab(url, params);
        if (res.error) log(`

Status: ❌ ${res.error}`);
        let filePath = null;
        let outputData;
        let isTextData = false;
        if (typeof res.data === "string") {
          outputData = res.data;
          isTextData = true;
        } else if (Buffer.isBuffer(res.data) || res.data instanceof Uint8Array) {
          outputData = res.data;
          isTextData = false;
        } else if (res.data instanceof Blob) {
          const arrayBuffer = await res.data.arrayBuffer();
          outputData = Buffer.from(arrayBuffer);
          isTextData = false;
        } else if (res.data && typeof res.data === "object") {
          outputData = JSON.stringify(res.data, null, 2);
          isTextData = true;
        } else {
          outputData = String(res.data);
          isTextData = true;
        }
        if (!noSave) {
          const urlPath = new URL(url).pathname;
          const urlExt = path.extname(urlPath);
          const defaultExt = isTextData ? ".json" : urlExt || ".bin";
          filePath = outputFile ? path.resolve(outputFile) : path.resolve(process.cwd(), `output${defaultExt}`);
          if (isTextData) fs.writeFileSync(filePath, outputData, "utf8");
          else fs.writeFileSync(filePath, outputData);
          const [seconds, nanoseconds] = process.hrtime(startTime);
          const elapsedMs = (seconds + nanoseconds / 1e9).toFixed(2);
          const stats = fs.statSync(filePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
          log(`⏱️ ${elapsedMs}s 📦 ${fileSizeMB}MB ✅ Saved to: ${filePath}`);
        } else {
          if (isTextData) {
            log(outputData);
          } else {
            log(`Binary data received (${outputData.length} bytes). Use --output to save to file.`);
          }
        }
      } catch (error) {
        log(`Error: ${error.message}`, { color: "red" });
        process.exit(1);
      }
    }
  })();
}
export {
  ColorFileDownloader
};
//# sourceMappingURL=download.es.js.map

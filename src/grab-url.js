#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import readline from 'readline';
import { readFileSync } from 'fs';
import { join } from 'path';
import spinners from './icons/cli/spinners.js';
import grab, { log } from '../dist/grab-api.es.js';
import { pathToFileURL, fileURLToPath } from 'url';

import cliProgress from 'cli-progress';
import chalk from 'chalk';
// Use cli-spinners for spinner animations
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- ArgParser from grab-cli.js ---
class ArgParser {
  constructor() {
    this.commands = {};
    this.options = {};
    this.examples = [];
    this.helpText = '';
    this.versionText = '1.0.0';
  }
  usage(text) { this.helpText = text; return this; }
  command(pattern, desc, handler) {
    const match = pattern.match(/\$0 <(\w+)>/);
    if (match) this.commands[match[1]] = { desc, handler, required: true };
    return this;
  }
  option(name, opts = {}) { this.options[name] = opts; return this; }
  example(cmd, desc) { this.examples.push({ cmd, desc }); return this; }
  help() { return this; }
  alias(short, long) { if (this.options[long]) this.options[long].alias = short; return this; }
  version(v) { if (v) this.versionText = v; return this; }
  strict() { return this; }
  parseSync() {
    const args = process.argv.slice(2);
    const result = {};
    const positional = [];
    if (args.includes('--help') || args.includes('-h')) { this.showHelp(); process.exit(0); }
    if (args.includes('--version')) { console.log(this.versionText); process.exit(0); }
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const [key, value] = arg.split('=');
        const optName = key.slice(2);
        if (value !== undefined) {
          result[optName] = this.coerceValue(optName, value);
        } else if (this.options[optName]?.type === 'boolean') {
          result[optName] = true;
        } else {
          const nextArg = args[i + 1];
          if (nextArg && !nextArg.startsWith('-')) {
            result[optName] = this.coerceValue(optName, nextArg);
            i++;
          } else {
            result[optName] = true;
          }
        }
      } else if (arg.startsWith('-') && arg.length === 2) {
        const shortFlag = arg[1];
        const longName = this.findLongName(shortFlag);
        if (longName) {
          if (this.options[longName]?.type === 'boolean') {
            result[longName] = true;
          } else {
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
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
    Object.keys(this.options).forEach(key => {
      if (result[key] === undefined && this.options[key].default !== undefined) {
        result[key] = this.options[key].default;
      }
    });
    if ((!result.urls || result.urls.length === 0) && this.commands.url?.required) {
      console.error('Error: Missing required argument: url');
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
      case 'number': return Number(value);
      case 'boolean': return value === 'true' || value === '1';
      default: return value;
    }
  }
  findLongName(shortFlag) {
    return Object.keys(this.options).find(key => this.options[key].alias === shortFlag);
  }
  showHelp() {
    console.log(this.helpText || 'Usage: grab <url> [options]');
    console.log('\nPositional arguments:');
    Object.keys(this.commands).forEach(cmd => {
      console.log(`  ${cmd.padEnd(20)} ${this.commands[cmd].desc}`);
    });
    console.log('\nOptions:');
    Object.keys(this.options).forEach(key => {
      const opt = this.options[key];
      const flags = opt.alias ? `-${opt.alias}, --${key}` : `--${key}`;
      console.log(`  ${flags.padEnd(20)} ${opt.describe || ''}`);
    });
    if (this.examples.length > 0) {
      console.log('\nExamples:');
      this.examples.forEach(ex => {
        console.log(`  ${ex.cmd}`);
        console.log(`    ${ex.desc}`);
      });
    }
  }
}

// --- Helper: Detect if a URL is a file download ---
function isFileUrl(url) {
  // Heuristic: ends with a file extension (e.g., .zip, .mp4, .tar.gz, .pdf, etc)
  return /\.[a-zA-Z0-9]{1,5}(?:\.[a-zA-Z0-9]{1,5})*$/.test(url.split('?')[0]);
}

export class ColorFileDownloader {
constructor() {
  this.progressBar = null;
  this.multiBar = null;
  this.loadingSpinner = null;
  this.abortController = null;
  
  // Column width constants for alignment
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

  // ANSI color codes for progress bars
  this.barColors = [
    '\u001b[32m', // green
    '\u001b[33m', // yellow
    '\u001b[34m', // blue
    '\u001b[35m', // magenta
    '\u001b[36m', // cyan
    '\u001b[91m', // bright red
    '\u001b[92m', // bright green
    '\u001b[93m', // bright yellow
    '\u001b[94m', // bright blue
    '\u001b[95m', // bright magenta
    '\u001b[96m'  // bright cyan
  ];

  this.barGlueColors = [
    '\u001b[31m', // red
    '\u001b[33m', // yellow
    '\u001b[35m', // magenta
    '\u001b[37m', // white
    '\u001b[90m', // gray
    '\u001b[93m', // bright yellow
    '\u001b[97m'  // bright white
  ];
  
  // Available spinner types for random selection (from spinners.json)
  this.spinnerTypes = Object.keys(spinners.default || spinners);
  
  // Initialize state directory
  this.stateDir = this.getStateDirectory();
  this.ensureStateDirectoryExists();
  this.isPaused = false;
  this.pauseCallback = null;
  this.resumeCallback = null;
  this.abortControllers = [];
  
  // Initialize global keyboard listener
  this.keyboardListener = null;
  this.isAddingUrl = false;
}

/**
 * Get state directory from environment variable or use default
 * @returns {string} State directory path
 */
getStateDirectory() {
  return process.env.GRAB_DOWNLOAD_STATE_DIR || path.join(process.cwd(), '.grab-downloads');
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
    console.log(this.colors.warning('⚠️  Could not create state directory, using current directory'));
    this.stateDir = process.cwd();
  }
}

/**
 * Get state file path for a given output path
 * @param {string} outputPath - The output file path
 * @returns {string} State file path
 */
getStateFilePath(outputPath) {
  const stateFileName = path.basename(outputPath) + '.download-state';
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
    console.log(this.colors.warning('⚠️  Could not clean up state file'));
  }
}

/**
 * Print aligned header row for progress bars
 */
printHeaderRow() {
  console.log(
    this.colors.success('📈 %'.padEnd(this.COL_PERCENT)) +
    this.colors.yellow('📁 Files'.padEnd(this.COL_FILENAME)) +
    this.colors.cyan('🔄'.padEnd(this.COL_SPINNER)) +
    ' ' +
    this.colors.green('📊 Progress'.padEnd(this.COL_BAR + 1)) +
    this.colors.info('📥 Downloaded'.padEnd(this.COL_DOWNLOADED)) +
    this.colors.info('📦 Total'.padEnd(this.COL_TOTAL)) +
    this.colors.purple('⚡ Speed'.padEnd(this.COL_SPEED)) +
    this.colors.pink('⏱️ ETA'.padEnd(this.COL_ETA))
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
  
  // Fallback to dots if spinner not found
  return spinnerData.dots?.frames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
}

/**
 * Get the visual width of a spinner frame (accounting for multi-char emojis)
 * @param {string} frame - The spinner frame
 * @returns {number} Visual width
 */
getSpinnerWidth(frame) {
  // Count visual width - emojis and some unicode chars take 2 spaces
  let width = 0;
  for (const char of frame) {
    const code = char.codePointAt(0);
    // Emoji range check and other wide characters
    if ((code >= 0x1F000 && code <= 0x1F6FF) || // Miscellaneous Symbols and Pictographs
        (code >= 0x1F300 && code <= 0x1F5FF) || // Miscellaneous Symbols
        (code >= 0x1F600 && code <= 0x1F64F) || // Emoticons
        (code >= 0x1F680 && code <= 0x1F6FF) || // Transport and Map
        (code >= 0x1F700 && code <= 0x1F77F) || // Alchemical Symbols
        (code >= 0x1F780 && code <= 0x1F7FF) || // Geometric Shapes Extended
        (code >= 0x1F800 && code <= 0x1F8FF) || // Supplemental Arrows-C
        (code >= 0x2600 && code <= 0x26FF) ||   // Miscellaneous Symbols
        (code >= 0x2700 && code <= 0x27BF)) {   // Dingbats
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
  
  // Account for other UI elements: percentage (4), progress (20), speed (10), ETA (15), spaces and colors (10)
  const otherElementsWidth = 59;
  const filenameWidth = 20; // Truncated filename width
  
  const availableWidth = terminalWidth - otherElementsWidth - filenameWidth - spinnerWidth;
  
  // Ensure minimum bar size
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
      method: 'HEAD',
      signal: this.abortController?.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const acceptRanges = response.headers.get('accept-ranges');
    const contentLength = response.headers.get('content-length');
    const lastModified = response.headers.get('last-modified');
    const etag = response.headers.get('etag');
    
    return {
      supportsResume: acceptRanges === 'bytes',
      totalSize: contentLength ? parseInt(contentLength, 10) : 0,
      lastModified,
      etag,
      headers: response.headers
    };
  } catch (error) {
    console.log(this.colors.warning('⚠️  Could not check server resume support, proceeding with regular download'));
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
      const stateData = fs.readFileSync(stateFilePath, 'utf8');
      return JSON.parse(stateData);
    }
  } catch (error) {
    console.log(this.colors.warning('⚠️  Could not load download state, starting fresh'));
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
    console.log(this.colors.warning('⚠️  Could not save download state'));
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
    console.log(this.colors.warning('⚠️  Could not read partial file size'));
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
  if (bytes === 0) return this.colors.info('0 B');
  
  const k = 1024; // Use 1024 for binary calculations
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    { unit: 'B', color: this.colors.info },
    { unit: 'KB', color: this.colors.cyan },
    { unit: 'MB', color: this.colors.yellow },
    { unit: 'GB', color: this.colors.purple },
    { unit: 'TB', color: this.colors.pink },
    { unit: 'PB', color: this.colors.primary }
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
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

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
  if (bytes === 0) return '0B';
  
  const k = 1024;
  const kb = bytes / k;
  
  // If below 100KB, show in KB with whole numbers
  if (kb < 100) {
    const value = Math.round(kb);
    return `${value}KB`;
  }
  
  // Otherwise show in MB with 1 decimal place (without "MB" text)
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
  
  // Show first few and last few characters with ellipsis in middle
  const firstPart = Math.ceil((maxLength - extension.length - 3) / 2);
  const lastPart = Math.floor((maxLength - extension.length - 3) / 2);
  
  const truncatedBase = baseName.substring(0, firstPart) + '...' + baseName.substring(baseName.length - lastPart);
  return `${truncatedBase}${extension}`.padEnd(maxLength);
}

/**
 * Format ETA time in hours:minutes:seconds format
 * @param {number} seconds - ETA in seconds
 * @returns {string} Formatted ETA string (padded to consistent width)
 */
formatETA(seconds) {
  if (!seconds || seconds === Infinity || seconds < 0) return '   --   ';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  
  return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`.padEnd(this.COL_ETA);
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
    const totalSizeGB = totalSizeMB / 1024;
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
  if (total === 0) return '0MB'.padEnd(this.COL_TOTAL);
  
  const k = 1024;
  const mb = total / (k * k);
  
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb.toFixed(1)}GB`.padEnd(this.COL_TOTAL);
  }
  
  // For files smaller than 1MB, show in MB with decimal
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
  if (total === 0) return '0MB'.padEnd(this.COL_TOTAL);
  
  const k = 1024;
  const mb = total / (k * k);
  
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb.toFixed(1)}GB`.padEnd(this.COL_TOTAL);
  }
  
  // For files smaller than 1MB, show in MB with decimal
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
  if (bytesPerSecond === 0) return '0B';
  
  const k = 1024;
  const kbPerSecond = bytesPerSecond / k;
  
  // If below 100KB/s, show in KB with whole numbers
  if (kbPerSecond < 100) {
    const formattedValue = Math.round(kbPerSecond);
    return `${formattedValue}KB`;
  }
  
  // Otherwise show in MB with 1 decimal place (without "MB" text)
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
    // Set up global keyboard listener for pause/resume and add URL BEFORE starting downloads
    this.setupGlobalKeyboardListener();
    
    // Print header row with emojis
    // this.printHeaderRow();

    // Show keyboard shortcut info for pause/resume in multibar view
    // console.log(this.colors.info('💡 [p] pause/resume downloads, [a] add URL.'));

    // Get random colors for the multibar
    const masterBarColor = this.getRandomBarColor();
    const masterBarGlue = this.getRandomBarGlueColor();

    // Create multibar container with compact format and random colors
    this.multiBar = new cliProgress.MultiBar({
      format: this.colors.success('{percentage}%') + ' ' +
              this.colors.yellow('{filename}') + ' ' +
              this.colors.cyan('{spinner}') + ' ' + 
              masterBarColor + '{bar}\u001b[0m' + ' ' +
              this.colors.info('{downloadedDisplay}') + ' ' +
              this.colors.info('{totalDisplay}') + ' ' +
              this.colors.purple('{speed}') + ' ' +
              this.colors.pink('{etaFormatted}'),
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true,
      autopadding: false,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      barGlue: masterBarGlue,
      barsize: this.COL_BAR
    });

    // Track overall progress for master bar
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
    
    // Calculate total size from all downloads
    const totalSizeFromDownloads = downloads.reduce((sum, download) => {
      // Estimate size based on filename or use a default
      const estimatedSize = download.estimatedSize || 1024 * 1024 * 100; // 100MB default
      return sum + estimatedSize;
    }, 0);
    totalSize = totalSizeFromDownloads;
    
    // Track actual total size as we discover file sizes
    let actualTotalSize = 0;

    // Set up interval to update speeds every second
    const speedUpdateInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = (now - lastSpeedUpdate) / 1000; // seconds
      
      // Update individual speeds based on incremental download since last update
      for (let i = 0; i < downloads.length; i++) {
        if (timeSinceLastUpdate > 0) {
          const incrementalDownloaded = individualDownloaded[i] - lastIndividualDownloaded[i];
          individualSpeeds[i] = incrementalDownloaded / timeSinceLastUpdate;
          
          if (fileBars[i] && fileBars[i].bar) {
            const speed = this.formatSpeed(this.formatSpeedDisplay(individualSpeeds[i]));
            const eta = individualSizes[i] > 0 ? 
              this.formatETA((individualSizes[i] - individualDownloaded[i]) / individualSpeeds[i]) : 
              this.formatETA(0);
            
            fileBars[i].bar.update(individualDownloaded[i], {
              speed: speed,
              progress: this.formatProgress(individualDownloaded[i], individualSizes[i]),
              downloadedDisplay: this.formatBytesCompact(individualDownloaded[i]),
              totalDisplay: this.formatTotalDisplay(individualSizes[i]),
              etaFormatted: eta
            });
          }
        }
      }
      
      // Update last values for next calculation
      lastSpeedUpdate = now;
      lastIndividualDownloaded = [...individualDownloaded];
      
      // Calculate total speed
      const totalSpeedBps = individualSpeeds.reduce((sum, speed) => sum + speed, 0);
      
      // Calculate total downloaded from individual files
      const totalDownloadedFromFiles = individualDownloaded.reduce((sum, downloaded) => sum + downloaded, 0);
      
      // Calculate time elapsed since start
      const timeElapsed = (now - individualStartTimes[0]) / 1000; // seconds since first download started
      
      // Update master bar
      const totalEta = totalSize > 0 && totalSpeedBps > 0 ? 
        this.formatETA((totalSize - totalDownloadedFromFiles) / totalSpeedBps) : 
        this.formatETA(0);
      
      const totalPercentage = totalSize > 0 ? 
        Math.round((totalDownloadedFromFiles / totalSize) * 100) : 0;
      
      // Calculate actual total size from discovered individual file sizes
      const discoveredTotalSize = individualSizes.reduce((sum, size) => sum + size, 0);
      const displayTotalSize = discoveredTotalSize > 0 ? discoveredTotalSize : totalSize;
      
      masterBar.update(totalDownloadedFromFiles, {
        speed: this.formatTotalSpeed(totalSpeedBps),
        progress: this.formatMasterProgress(totalDownloadedFromFiles, displayTotalSize),
        downloadedDisplay: this.formatBytesCompact(totalDownloadedFromFiles),
        totalDisplay: this.formatTotalDisplay(displayTotalSize),
        etaFormatted: this.formatETA(timeElapsed), // Show time elapsed instead of ETA
        percentage: displayTotalSize > 0 ? 
          Math.round((totalDownloadedFromFiles / displayTotalSize) * 100) : 0
      });
    }, 1000);
    
    // Create master progress bar with more compact format and special colors
    const masterSpinnerWidth = this.getSpinnerWidth('⬇️');
    const masterMaxFilenameLength = this.COL_FILENAME - masterSpinnerWidth;
    const masterBarSize = this.calculateBarSize('⬇️', this.COL_BAR);
    const masterBar = this.multiBar.create(totalSize, 0, {
      filename: 'Total'.padEnd(masterMaxFilenameLength),
      spinner: '⬇️',
      speed: '0B'.padEnd(this.COL_SPEED),
      progress: this.formatMasterProgress(0, totalSize),
      downloadedDisplay: this.formatBytesCompact(0),
      totalDisplay: this.formatTotalDisplay(totalSize),
      etaFormatted: this.formatETA(0),
      percentage: '  0'.padStart(this.COL_PERCENT - 1)
    }, {
      format: this.colors.success('{percentage}%') + ' ' +
              this.colors.yellow.bold('{filename}') + ' ' +
              this.colors.success('{spinner}') + ' ' + 
              '\u001b[92m{bar}\u001b[0m' + ' ' +
              this.colors.info('{downloadedDisplay}') + ' ' +
              this.colors.info('{totalDisplay}') + ' ' +
              this.colors.purple('{speed}') + ' ' +
              this.colors.pink('{etaFormatted}'),
      barCompleteChar: '▶',
      barIncompleteChar: '▷',
      barGlue: '\u001b[33m',
      barsize: masterBarSize
    });

    // Create individual progress bars for each download
    const fileBars = downloads.map((download, index) => {
      const spinnerType = this.getRandomSpinner();
      const spinnerFrames = this.getSpinnerFrames(spinnerType);
      
      // Calculate spinner width to adjust filename padding
      const spinnerWidth = this.getSpinnerWidth(spinnerFrames[0]);
      const maxFilenameLength = this.COL_FILENAME - spinnerWidth; // Adjust filename length based on spinner width
      const truncatedName = this.truncateFilename(download.filename, maxFilenameLength);
      
      // Get random colors for this file's progress bar
      const fileBarColor = this.getRandomBarColor();
      const fileBarGlue = this.getRandomBarGlueColor();
      
      // Calculate bar size based on spinner width
      const barSize = this.calculateBarSize(spinnerFrames[0], this.COL_BAR);
      
      return {
        bar: this.multiBar.create(100, 0, {
          filename: truncatedName,
          spinner: spinnerFrames[0],
          speed: this.formatSpeed('0B'),
          progress: this.formatProgress(0, 0),
          downloadedDisplay: this.formatBytesCompact(0),
          totalDisplay: this.formatTotalDisplay(0),
          etaFormatted: this.formatETA(0),
          percentage: '  0'.padStart(3)
        }, {
          format: this.colors.yellow('{filename}') + ' ' +
                  this.colors.cyan('{spinner}') + ' ' + 
                  fileBarColor + '{bar}\u001b[0m' + ' ' +
                  this.colors.success('{percentage}%') + ' ' +
                  this.colors.info('{downloadedDisplay}') + ' ' +
                  this.colors.info('{totalDisplay}') + ' ' +
                  this.colors.purple('{speed}') + ' ' +
                  this.colors.pink('{etaFormatted}'),
          barCompleteChar: '█',
          barIncompleteChar: '░',
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

    // Start all downloads concurrently
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

    // Wait for all downloads to complete
    const results = await Promise.allSettled(downloadPromises);

    // Clear the speed update interval
    clearInterval(speedUpdateInterval);

    // Stop multibar
    this.multiBar.stop();

    // Display results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    if (failed > 0) {
      console.log(this.colors.error(`❌ Failed: ${failed}/${downloads.length}`));
      
      results.forEach((result, index) => {
        if (result.status === 'rejected' || !result.value.success) {
          const filename = downloads[index].filename;
          const error = result.reason || result.value?.error || 'Unknown error';
          console.log(this.colors.error(`  • ${filename}: ${error.message || error}`));
        }
      });
    }
    
    // Random celebration emoji
    const celebrationEmojis = ['🥳', '🎊', '🎈', '🌟', '💯', '🚀', '✨', '🔥'];
    const randomEmoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
    console.log(this.colors.green(`${randomEmoji} Success: ${successful}/${downloads.length}`));

    this.clearAbortControllers();
    
    let pausedMessageShown = false;
    
    this.setPauseCallback(() => {
      if (!pausedMessageShown) {
        this.multiBar.stop();
        console.log(this.colors.warning('⏸️  Paused. Press p to resume, a to add URL.'));
        pausedMessageShown = true;
      }
    });
    
    this.setResumeCallback(() => {
      if (pausedMessageShown) {
        console.log(this.colors.success('▶️  Resumed. Press p to pause, a to add URL.'));
        pausedMessageShown = false;
      }
    });

  } catch (error) {
    if (this.multiBar) {
      this.multiBar.stop();
    }
    console.error(this.colors.error.bold('💥 Batch download failed: ') + this.colors.warning(error.message));
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
  const tempFilePath = outputPath + '.tmp';

  try {
    // Create abort controller for this download
    const abortController = new AbortController();
    this.setAbortController(abortController);
    
    // Check server support and get file info
    const serverInfo = await this.checkServerSupport(url);
    
    // Load previous download state
    const previousState = this.loadDownloadState(stateFilePath);
    
    // Check if we have a partial file
    const partialSize = this.getPartialFileSize(tempFilePath);
    
    let startByte = 0;
    let resuming = false;
    
    if (serverInfo.supportsResume && partialSize > 0 && previousState) {
      // Validate that the file hasn't changed on server
      const fileUnchanged = 
        (!serverInfo.lastModified || serverInfo.lastModified === previousState.lastModified) &&
        (!serverInfo.etag || serverInfo.etag === previousState.etag) &&
        (serverInfo.totalSize === previousState.totalSize);
      
      if (fileUnchanged && partialSize < serverInfo.totalSize) {
        startByte = partialSize;
        resuming = true;
      } else {
        // Clean up partial file and state
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        this.cleanupStateFile(stateFilePath);
      }
    } else if (partialSize > 0) {
      // Server doesn't support resume, clean up partial file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    // Prepare request headers
    const headers = {};
    if (resuming && startByte > 0) {
      headers['Range'] = `bytes=${startByte}-`;
    }

    // Make the fetch request
    const response = await fetch(url, {
      headers,
      signal: abortController.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the total file size
    const contentLength = response.headers.get('content-length');
    const totalSize = resuming ? serverInfo.totalSize : (contentLength ? parseInt(contentLength, 10) : 0);

    // Save download state
    const downloadState = {
      url,
      outputPath,
      totalSize,
      startByte,
      lastModified: serverInfo.lastModified,
      etag: serverInfo.etag,
      timestamp: new Date().toISOString()
    };
    this.saveDownloadState(stateFilePath, downloadState);

    // Update bar with file size info
    bar.setTotal(totalSize || 100);
    bar.update(startByte, {
      progress: this.formatProgress(startByte, totalSize),
      downloadedDisplay: this.formatBytesCompact(startByte),
      totalDisplay: this.formatTotalDisplay(totalSize)
    });

    // Create write stream (append mode if resuming)
    const writeStream = fs.createWriteStream(tempFilePath, { 
      flags: resuming ? 'a' : 'w' 
    });
    
    // Track progress
    let downloaded = startByte;
    let lastTime = Date.now();
    let lastDownloaded = downloaded;

    // Create progress stream
    const progressStream = new Readable({
      read() {}
    });

    const reader = response.body.getReader();
    
    const processChunk = async () => {
      try {
        while (true) {
          // Check for pause state
          while (this.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
          }
          
          const { done, value } = await reader.read();
          
          if (done) {
            progressStream.push(null);
            break;
          }

          downloaded += value.length;
          
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;

          // Update spinner frame every 150ms for smooth animation
          if (now - fileBar.lastFrameUpdate >= 150) {
            fileBar.spinnerIndex = (fileBar.spinnerIndex + 1) % spinnerFrames.length;
            fileBar.lastFrameUpdate = now;
            
            // Recalculate bar size when spinner changes
            const currentSpinner = spinnerFrames[fileBar.spinnerIndex];
            const newBarSize = this.calculateBarSize(currentSpinner, this.COL_BAR);
            bar.options.barsize = newBarSize;
          }

          // Change spinner type every 45 seconds
          if (now - fileBar.lastSpinnerUpdate >= 45000) {
            const newSpinnerType = this.getRandomSpinner();
            fileBar.spinnerFrames = this.getSpinnerFrames(newSpinnerType);
            fileBar.spinnerIndex = 0;
            fileBar.lastSpinnerUpdate = now;
          }

          if (timeDiff >= 0.3) { // Update every 300ms for smoother animation
            bar.update(downloaded, {
              spinner: spinnerFrames[fileBar.spinnerIndex],
              progress: this.formatProgress(downloaded, totalSize),
              downloadedDisplay: this.formatBytesCompact(downloaded),
              totalDisplay: this.formatTotalDisplay(totalSize)
            });
            
            // Update total tracking
            if (totalTracking) {
              const bytesDiff = downloaded - lastDownloaded;
              totalTracking.totalDownloaded += bytesDiff;
              
              // Update individual downloaded amount and size for this file
              const fileIndex = fileBar.download.index || 0;
              totalTracking.individualDownloaded[fileIndex] = downloaded;
              totalTracking.individualSizes[fileIndex] = totalSize;
              
              // Calculate total size from all individual sizes
              totalTracking.totalSize = totalTracking.individualSizes.reduce((sum, size) => sum + size, 0);
              
              // Update actual total size for master bar display
              if (totalTracking.actualTotalSize !== undefined) {
                totalTracking.actualTotalSize = totalTracking.totalSize;
              }
              
              // Update master bar total if this is the first time we're getting the actual size
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

    // Move temp file to final location
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    fs.renameSync(tempFilePath, outputPath);
    
    // Clean up state file
    this.cleanupStateFile(stateFilePath);

    // Update master progress
    const currentCompleted = masterBar.value + 1;
    const finalTotalSize = totalTracking.actualTotalSize || totalTracking.totalSize;
    const discoveredTotalSize = totalTracking.individualSizes.reduce((sum, size) => sum + size, 0);
    const displayTotalSize = discoveredTotalSize > 0 ? discoveredTotalSize : finalTotalSize;
    
    masterBar.update(totalTracking.totalDownloaded, {
      progress: this.formatMasterProgress(totalTracking.totalDownloaded, displayTotalSize),
      downloadedDisplay: this.formatBytesCompact(totalTracking.totalDownloaded),
      totalDisplay: this.formatTotalDisplay(displayTotalSize),
      etaFormatted: this.formatETA((Date.now() - (totalTracking.individualStartTimes?.[0] || Date.now())) / 1000) // Show time elapsed
    });

  } catch (error) {
    // Update bar to show error state
    bar.update(bar.total, {
      spinner: '❌',
      speed: this.formatSpeed('FAILED'),
      downloadedDisplay: this.formatBytesCompact(0),
      totalDisplay: this.formatTotalDisplay(0)
    });
    
    // Don't clean up partial file on error - allow resume
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
  const tempFilePath = outputPath + '.tmp';
  
  try {
    // Create abort controller for cancellation
    this.abortController = new AbortController();
    
    // Start with a random ora spinner animation
    const randomOraSpinner = this.getRandomOraSpinner();
    this.loadingSpinner = ora({
      text: this.colors.primary('🌐 Checking server capabilities...'),
      spinner: randomOraSpinner,
      color: 'cyan'
    }).start();

    // Check server support and get file info
    const serverInfo = await this.checkServerSupport(url);
    
    // Load previous download state
    const previousState = this.loadDownloadState(stateFilePath);
    
    // Check if we have a partial file
    const partialSize = this.getPartialFileSize(tempFilePath);
    
    let startByte = 0;
    let resuming = false;
    
    if (serverInfo.supportsResume && partialSize > 0 && previousState) {
      // Validate that the file hasn't changed on server
      const fileUnchanged = 
        (!serverInfo.lastModified || serverInfo.lastModified === previousState.lastModified) &&
        (!serverInfo.etag || serverInfo.etag === previousState.etag) &&
        (serverInfo.totalSize === previousState.totalSize);
      
      if (fileUnchanged && partialSize < serverInfo.totalSize) {
        startByte = partialSize;
        resuming = true;
        this.loadingSpinner.succeed(this.colors.success(`✅ Found partial download: ${this.formatBytes(partialSize)} of ${this.formatTotal(serverInfo.totalSize)}`));
        console.log(this.colors.info(`🔄 Resuming download from ${this.formatBytes(startByte)}`));
      } else {
        this.loadingSpinner.warn(this.colors.warning('⚠️  File changed on server, starting fresh download'));
        // Clean up partial file and state
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        this.cleanupStateFile(stateFilePath);
      }
    } else {
      this.loadingSpinner.stop();
      if (partialSize > 0) {
        console.log(this.colors.warning('⚠️  Server does not support resumable downloads, starting fresh'));
        // Clean up partial file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }

    // Prepare request headers
    const headers = {};
    if (resuming && startByte > 0) {
      headers['Range'] = `bytes=${startByte}-`;
    }

    // Make the fetch request
    const response = await fetch(url, {
      headers,
      signal: this.abortController.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the total file size
    const contentLength = response.headers.get('content-length');
    const totalSize = resuming ? serverInfo.totalSize : (contentLength ? parseInt(contentLength, 10) : 0);
    const remainingSize = contentLength ? parseInt(contentLength, 10) : 0;

    if (!resuming) {
      if (totalSize === 0) {
        console.log(this.colors.warning('⚠️  Warning: Content-Length not provided, progress will be estimated'));
      } else {
        console.log(this.colors.info(`📦 File size: ${this.formatTotal(totalSize)}`));
      }
    }

    // Save download state
    const downloadState = {
      url,
      outputPath,
      totalSize,
      startByte,
      lastModified: serverInfo.lastModified,
      etag: serverInfo.etag,
      timestamp: new Date().toISOString()
    };
    this.saveDownloadState(stateFilePath, downloadState);

    // Get random colors for single file progress bar
    const singleBarColor = this.getRandomBarColor();
    const singleBarGlue = this.getRandomBarGlueColor();

    // Get initial spinner frames
    let currentSpinnerType = this.getRandomSpinner();
    let spinnerFrames = this.getSpinnerFrames(currentSpinnerType);
    let spinnerFrameIndex = 0;
    
    // Calculate initial bar size
    const initialBarSize = this.calculateBarSize(spinnerFrames[0], this.COL_BAR);

    // Print header row with emojis for single file download
    console.log(
      this.colors.success('📈 %'.padEnd(this.COL_PERCENT)) +
      this.colors.cyan('🔄'.padEnd(this.COL_SPINNER)) +
      ' ' +
      this.colors.green('📊 Progress'.padEnd(this.COL_BAR + 1)) +
      this.colors.info('📥 Downloaded'.padEnd(this.COL_DOWNLOADED)) +
      this.colors.info('📦 Total'.padEnd(this.COL_TOTAL)) +
      this.colors.purple('⚡ Speed'.padEnd(this.COL_SPEED)) +
      this.colors.pink('⏱️ ETA'.padEnd(this.COL_ETA))
    );

    // Set up keyboard listeners for single file download
    const keyboardRl = this.setupSingleFileKeyboardListeners(url, outputPath);

    // Create compact colorful progress bar with random colors
    this.progressBar = new cliProgress.SingleBar({
      format: this.colors.success('{percentage}%') + ' ' +
              this.colors.cyan('{spinner}') + ' ' +
              singleBarColor + '{bar}\u001b[0m' + ' ' + 
              this.colors.info('{downloadedDisplay}') + ' ' +
              this.colors.info('{totalDisplay}') + ' ' +
              this.colors.purple('{speed}') + ' ' +
              this.colors.pink('{etaFormatted}'),
      barCompleteChar: '█',
      barIncompleteChar: '░',
      barGlue: singleBarGlue,
      hideCursor: true,
      barsize: initialBarSize,
      stopOnComplete: true,
      clearOnComplete: false
    });

    // Initialize progress bar with spinner
    this.progressBar.start(totalSize || 100, startByte, {
      speed: this.formatSpeed('0B/s'),
      etaFormatted: this.formatETA(0),
      spinner: spinnerFrames[0],
      progress: this.formatProgress(startByte, totalSize),
      downloadedDisplay: this.formatBytesCompact(startByte),
      totalDisplay: this.formatTotalDisplay(totalSize)
    });

    // Create write stream (append mode if resuming)
    const writeStream = fs.createWriteStream(tempFilePath, { 
      flags: resuming ? 'a' : 'w' 
    });
    
    // Track progress
    let downloaded = startByte;
    let sessionDownloaded = 0;
    let lastTime = Date.now();
    let lastDownloaded = downloaded;
    let lastSpinnerUpdate = Date.now();
    let lastSpinnerFrameUpdate = Date.now();

    // Create a transform stream to track progress
    const progressStream = new Readable({
      read() {} // No-op, we'll push data manually
    });

    // Process the response body stream
    const reader = response.body.getReader();
    
    const processChunk = async () => {
      try {
        while (true) {
          // Check for pause state
          while (this.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
          }
          
          const { done, value } = await reader.read();
          
          if (done) {
            progressStream.push(null); // Signal end of stream
            break;
          }

          // Update progress tracking
          sessionDownloaded += value.length;
          downloaded += value.length;
          
          // Calculate download speed and update display
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          
          // Update spinner type every 45 seconds for variety
          if (now - lastSpinnerUpdate >= 45000) {
            currentSpinnerType = this.getRandomSpinner();
            spinnerFrames = this.getSpinnerFrames(currentSpinnerType);
            spinnerFrameIndex = 0;
            lastSpinnerUpdate = now;
          }
          
          // Update spinner frame every 120ms for smooth animation
          if (now - lastSpinnerFrameUpdate >= 120) {
            spinnerFrameIndex = (spinnerFrameIndex + 1) % spinnerFrames.length;
            lastSpinnerFrameUpdate = now;
            
            // Recalculate bar size when spinner changes
            const currentSpinner = spinnerFrames[spinnerFrameIndex];
            const newBarSize = this.calculateBarSize(currentSpinner, this.COL_BAR);
            this.progressBar.options.barsize = newBarSize;
          }
          
          if (timeDiff >= 0.3) { // Update every 300ms for smooth animation
            const bytesDiff = downloaded - lastDownloaded;
            const speedBps = bytesDiff / timeDiff;
            const speed = this.formatSpeed(this.formatSpeedDisplay(speedBps));
            const eta = totalSize > 0 ? this.formatETA((totalSize - downloaded) / speedBps) : this.formatETA(0);
            
            this.progressBar.update(downloaded, {
              speed: speed,
              etaFormatted: eta,
              spinner: spinnerFrames[spinnerFrameIndex],
              progress: this.formatProgress(downloaded, totalSize),
              downloadedDisplay: this.formatBytesCompact(downloaded),
              totalDisplay: this.formatTotalDisplay(totalSize)
            });
            
            lastTime = now;
            lastDownloaded = downloaded;
          } else {
            // Update progress and spinner without speed calculation
            this.progressBar.update(downloaded, {
              spinner: spinnerFrames[spinnerFrameIndex],
              progress: this.formatProgress(downloaded, totalSize),
              downloadedDisplay: this.formatBytesCompact(downloaded),
              totalDisplay: this.formatTotalDisplay(totalSize)
            });
          }

          // Push the chunk to our readable stream
          progressStream.push(Buffer.from(value));
        }
      } catch (error) {
        progressStream.destroy(error);
      }
    };

    // Start processing chunks
    processChunk();

    // Use pipeline to handle the stream properly
    await pipeline(progressStream, writeStream);

    // Complete the progress bar
    this.progressBar.stop();
    
    // Move temp file to final location
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    fs.renameSync(tempFilePath, outputPath);
    
    // Clean up state file
    this.cleanupStateFile(stateFilePath);
    
    // Success celebration
    console.log(this.colors.success('✅ Download completed!'));
    console.log(this.colors.primary('📁 File saved to: ') + chalk.underline(outputPath));
    console.log(this.colors.purple('📊 Total size: ') + this.formatBytes(downloaded));
    
    if (resuming) {
      console.log(this.colors.info('🔄 Resumed from: ') + this.formatBytes(startByte));
      console.log(this.colors.info('📥 Downloaded this session: ') + this.formatBytes(sessionDownloaded));
    }
    
    // Random success emoji
    const celebrationEmojis = ['🥳', '🎊', '🎈', '🌟', '💯', '🚀', '✨', '🔥'];
    const randomEmoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
    console.log(this.colors.success(`${randomEmoji} Successfully downloaded! ${randomEmoji}`));

  } catch (error) {
    if (this.loadingSpinner && this.loadingSpinner.isSpinning) {
      this.loadingSpinner.fail(this.colors.error('❌ Connection failed'));
    }
    if (this.progressBar) {
      this.progressBar.stop();
    }
    
    // Don't clean up partial file on error - allow resume
    console.error(this.colors.error.bold('💥 Download failed: ') + this.colors.warning(error.message));
    
    if (error.name === 'AbortError') {
      console.log(this.colors.info('💾 Download state saved. You can resume later by running the same command.'));
    } else {
      console.log(this.colors.info('💾 Partial download saved. Restart to resume from where it left off.'));
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
      // Ignore cleanup errors
    }
  }
  
  // Clean up stdin listener
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}

/**
 * Set up global keyboard listener for pause/resume and add URL functionality
 */
setupGlobalKeyboardListener() {
  // Use the fallback keyboard listener which works better in terminal environments
  this.setupFallbackKeyboardListener();
}

/**
 * Handle global key press events
 * @param {string} keyName - The name of the pressed key
 */
async handleGlobalKeyPress(keyName) {
  if (keyName === 'P') {
    console.log(this.colors.info('P key pressed - toggling pause/resume'));
    if (!this.isPaused) {
      this.pauseAll();
    } else {
      this.resumeAll();
    }
  } else if (keyName === 'A' && !this.isAddingUrl) {
    console.log(this.colors.info('A key pressed - adding URL'));
    await this.promptForNewUrl();
  }
}

/**
 * Prompt user for a new URL to download
 */
async promptForNewUrl() {
  this.isAddingUrl = true;
  
  try {
    console.log(this.colors.cyan('\n📥 Enter URL to add (or press Enter to cancel):'));
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const newUrl = await new Promise((resolve) => {
      rl.question('', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
    
    if (newUrl && this.isValidUrl(newUrl)) {
      console.log(this.colors.success(`✅ Adding URL: ${newUrl}`));
      
      // Generate filename for new URL
      const newFilename = this.generateFilename(newUrl);
      const newOutputPath = path.isAbsolute(newFilename) ? newFilename : path.join(process.cwd(), newFilename);
      
      // Ensure output directory exists
      const outputDir = path.dirname(newOutputPath);
      try {
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
      } catch (error) {
        console.error(this.colors.red.bold('❌ Could not create output directory: ') + error.message);
        return;
      }
      
      // Check if we're in multiple download mode (multiBar exists)
      if (this.multiBar) {
        // Add to multiple downloads
        await this.addToMultipleDownloads(newUrl, newOutputPath, newFilename);
      } else {
        // Start new single download in background
        this.downloadFile(newUrl, newOutputPath).catch(error => {
          console.error(this.colors.error(`❌ Failed to download ${newFilename}: ${error.message}`));
        });
      }
      
      console.log(this.colors.success('🚀 New download started!'));
    } else if (newUrl) {
      console.log(this.colors.red('❌ Invalid URL provided.'));
    } else {
      console.log(this.colors.yellow('⚠️  No URL provided, cancelling.'));
    }
  } catch (error) {
    console.error(this.colors.red('❌ Error adding URL: ') + error.message);
  } finally {
    this.isAddingUrl = false;
    
    if (this.isPaused) {
      console.log(this.colors.warning('⏸️  Still paused. Press p to resume, a to add URL.'));
    } else {
      console.log(this.colors.success('▶️  Downloads active. Press p to pause, a to add URL.'));
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
  // Create new progress bar for the added download
  const spinnerType = this.getRandomSpinner();
  const spinnerFrames = this.getSpinnerFrames(spinnerType);
  const spinnerWidth = this.getSpinnerWidth(spinnerFrames[0]);
  const maxFilenameLength = this.COL_FILENAME - spinnerWidth;
  const truncatedName = this.truncateFilename(filename, maxFilenameLength);
  const fileBarColor = this.getRandomBarColor();
  const fileBarGlue = this.getRandomBarGlueColor();
  const barSize = this.calculateBarSize(spinnerFrames[0], this.COL_BAR);
  
  const newDownload = {
    url: url,
    outputPath: outputPath,
    filename: filename
  };
  
  const newFileBar = {
    bar: this.multiBar.create(100, 0, {
      filename: truncatedName,
      spinner: spinnerFrames[0],
      speed: this.formatSpeed('0B'),
      progress: this.formatProgress(0, 0),
      downloadedDisplay: this.formatBytesCompact(0),
      totalDisplay: this.formatTotalDisplay(0),
      etaFormatted: this.formatETA(0),
      percentage: '  0'.padStart(3)
    }, {
      format: this.colors.yellow('{filename}') + ' ' +
              this.colors.cyan('{spinner}') + ' ' + 
              fileBarColor + '{bar}\u001b[0m' + ' ' +
              this.colors.success('{percentage}%') + ' ' +
              this.colors.info('{downloadedDisplay}') + ' ' +
              this.colors.info('{totalDisplay}') + ' ' +
              this.colors.purple('{speed}') + ' ' +
              this.colors.pink('{etaFormatted}'),
      barCompleteChar: '█',
      barIncompleteChar: '░',
      barGlue: fileBarGlue,
      barsize: barSize
    }),
    spinnerFrames,
    spinnerIndex: 0,
    lastSpinnerUpdate: Date.now(),
    lastFrameUpdate: Date.now(),
    download: { ...newDownload, index: this.getCurrentDownloadCount() }
  };
  
  // Start the new download
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
  }).catch(error => {
    console.error(this.colors.error(`❌ Failed to download ${newDownload.filename}: ${error.message}`));
  });
}

/**
 * Get current download count (for multiple downloads)
 * @returns {number} Current number of downloads
 */
getCurrentDownloadCount() {
  // This is a placeholder - in a real implementation, you'd track this
  return 1;
}

/**
 * Get master bar (for multiple downloads)
 * @returns {Object} Master progress bar
 */
getMasterBar() {
  // This is a placeholder - in a real implementation, you'd return the actual master bar
  return null;
}

/**
 * Set up fallback keyboard listener using readline
 */
setupFallbackKeyboardListener() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    const handleKeypress = async (str) => {
      // Handle Ctrl+C to exit
      if (str === '\u0003') {
        console.log(this.colors.yellow.bold('\n🛑 Download cancelled by user'));
        process.exit(0);
      }
      
      // Handle 'p' key for pause/resume
      if (str.toLowerCase() === 'p') {
        console.log(this.colors.info('P key pressed - toggling pause/resume'));
        if (!this.isPaused) {
          this.pauseAll();
        } else {
          this.resumeAll();
        }
      }
      
      // Handle 'a' key for adding URL
      if (str.toLowerCase() === 'a' && !this.isAddingUrl) {
        console.log(this.colors.info('A key pressed - adding URL'));
        await this.promptForNewUrl();
      }
    };
    
    process.stdin.on('data', handleKeypress);
    // console.log(this.colors.info('💡 Keyboard listener active: [p] pause/resume, [a] add URL'));
  }
}

/**
 * Set up keyboard listeners for single file download (legacy method)
 * @param {string} url - The URL being downloaded
 * @param {string} outputPath - The output path
 */
setupSingleFileKeyboardListeners(url, outputPath) {
  // Use the global keyboard listener instead
  this.setupGlobalKeyboardListener();
  return null; // Return null since we're using global listener
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
    return '';
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
    return filename || 'downloaded-file';
  } catch (error) {
    return 'downloaded-file';
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
  console.log(this.colors.warning('⏸️  Pausing all downloads...'));
  // Don't abort controllers on pause, just set the flag
  if (this.pauseCallback) this.pauseCallback();
}

resumeAll() {
  this.isPaused = false;
  console.log(this.colors.success('▶️  Resuming all downloads...'));
  if (this.resumeCallback) this.resumeCallback();
}
}

// --- Main CLI logic ---
// Only run CLI when this file is executed directly, not when imported
const __isMain = (typeof import.meta.main === 'boolean' && import.meta.main) || (() => {
  try {
    const scriptArg = process.argv[1] ? path.resolve(process.argv[1]) : '';
    if (!scriptArg) return false;
    const href = pathToFileURL(scriptArg).href;
    return import.meta.url === href;
  } catch {
    return false;
  }
})();

if (__isMain) {
  const argv = new ArgParser()
    .usage('Usage: grab-url <url...> [options]')
    .command('$0 <url>', 'Fetch data or download files; pass one or more URLs')
    .option('no-save', {
      type: 'boolean',
      default: false,
      describe: 'Don\'t save output to file, just print to console'
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'Output filename (default: output.json)',
      default: null
    })
    .option('params', {
      alias: 'p',
      type: 'string',
      describe: 'JSON string of query parameters (e.g., \'{"key":"value"}\')',
      coerce: (arg) => {
        if (!arg) return {};
        try { return JSON.parse(arg); } catch (e) { throw new Error(`Invalid JSON in params: ${arg}`); }
      }
    })
    .help()
    .alias('h', 'help')
    .example('grab-url https://api.example.com/data', 'Fetch JSON/text from an API and save to output.json')
    .example('grab-url https://example.com/file1.zip https://example.com/file2.zip', 'Download multiple files concurrently')
    .example('grab-url https://example.com/file.iso -o ubuntu.iso', 'Save the first URL to a custom filename')
    .version('1.0.0')
    .strict()
    .parseSync();

  const urls = argv.urls || [];
  const params = argv.params || {};
  const outputFile = argv.output;
  const noSave = argv['no-save'];

  // --- Mode detection ---
  const anyFileUrl = urls.some(isFileUrl);
  const isDownloadMode = urls.length > 1 || anyFileUrl;

  (async () => {
  if (isDownloadMode) {
    // --- Download Mode ---
    const downloader = new ColorFileDownloader();
    // Prepare download objects
    const downloads = urls.map((url, i) => {
      let filename = null;
      // If user provided output, use it for the first file
      if (i === 0 && outputFile) filename = outputFile;
      return { url, outputPath: filename };
    });
    // Prepare download objects with filenames
    const downloadObjects = downloads.map((download, index) => {
      let actualUrl = download.url;
      let filename = download.outputPath;
      if (!filename) filename = downloader.generateFilename(actualUrl);
      const outputPath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
      const outputDir = path.dirname(outputPath);
      try { if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true }); } catch (error) {
        console.error(chalk.red.bold('❌ Could not create output directory: ') + error.message);
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
      // Display individual file stats in a table
      const statsTable = new Table({
        head: ['Filename', 'Size', 'Created'],
        colWidths: [32, 14, 25],
        colAligns: ['left', 'right', 'left'],
        style: { 'padding-left': 1, 'padding-right': 1, head: [], border: [] }
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
            'Error',
            'Could not read'
          ]);
        }
      });
      console.log(chalk.cyan.bold('\nFile Details:'));
      console.log(statsTable.toString());
    } catch (error) {
      console.error(chalk.red.bold('Failed to download files: ') + chalk.yellow(error.message));
      process.exit(1);
    }
    downloader.cleanup();
  } else {
    // --- API Mode ---
    const url = urls[0];
    const startTime = process.hrtime();
    try {
      const res = await grab(url, params);
      if (res.error) log(`\n\nStatus: ❌ ${res.error}`);
      let filePath = null;
      let outputData;
      let isTextData = false;
      if (typeof res.data === 'string') { outputData = res.data; isTextData = true; }
      else if (Buffer.isBuffer(res.data) || res.data instanceof Uint8Array) { outputData = res.data; isTextData = false; }
      else if (res.data instanceof Blob) { const arrayBuffer = await res.data.arrayBuffer(); outputData = Buffer.from(arrayBuffer); isTextData = false; }
      else if (res.data && typeof res.data === 'object') { outputData = JSON.stringify(res.data, null, 2); isTextData = true; }
      else { outputData = String(res.data); isTextData = true; }
      if (!noSave) {
        const urlPath = new URL(url).pathname;
        const urlExt = path.extname(urlPath);
        const defaultExt = isTextData ? '.json' : (urlExt || '.bin');
        filePath = outputFile ? path.resolve(outputFile) : path.resolve(process.cwd(), `output${defaultExt}`);
        if (isTextData) fs.writeFileSync(filePath, outputData, 'utf8');
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
      log(`Error: ${error.message}`, {color: 'red'});
      process.exit(1);
    }
  }
  })();
}
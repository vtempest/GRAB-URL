#!/usr/bin/env node
import fsPromises from "fs/promises";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import opener from "opener";
import minimist from "minimist";
import waitOn from "wait-on";

const argv = minimist(process.argv.slice(2));
const cmdArgs = argv._;
const aiBase = argv["ai-base"] || "https://perplexity.ai?q=";
const noAi = argv.noAi || argv.noai || argv.ai === false;
const noOpen = argv.noOpen || argv.noopen || false;
const maxErrorContextChars = 1000;
const pollDelay = argv.pollDelay || 1200;

const nextDir = path.join(".", ".next");
const logPath = fs.existsSync(nextDir)
  ? path.join(".next", "port.log")
  : "open-when-ready.log";

console.log(`📁 Log: ${logPath} | Poll: ${pollDelay}ms`);

/**
 * Opens browser when dev server is ready.
 * 
 * ### Features
 * - **Automatic**: Detects server start
 * - **Versatile**: Supports multiple browsers
 * 
 * ```js
 * console.log("Ready!");
 * ```
 */
function getErrorContext(log) {
  const lines = log.split(/\n/);
  const errorRegex = /⨯|[Ss]yntax[Ee]rror|error|failed|exception/i;
  for (let i = 0; i < lines.length; i++) {
    if (errorRegex.test(lines[i])) {
      const context = lines
        .slice(Math.max(0, i - 5), i + 16)
        .slice(0, 25)
        .join(" ")
        .replace(/[^\w\s:./\\-]/g, "")
        .trim()
        .replace(/\s{2,}/g, " ")
        .slice(0, maxErrorContextChars)
        .replace(/ /g, "%20");
      return context;
    }
  }
  return "";
}

function extractUrl(log) {
  // Better regex for Local: line
  const localMatch = log.match(/Local:\s+(http:\/\/localhost:\d+)/i);
  if (localMatch) {
    console.log("✅ EXTRACTED URL:", localMatch[1]);
    return localMatch[1];
  }

  // Fallback port
  const portMatch = log.match(/localhost:(\d+)/);
  if (portMatch) {
    const url = `http://localhost:${portMatch[1]}`;
    console.log("✅ FALLBACK URL:", url);
    return url;
  }

  console.log("❌ NO URL FOUND");
  return null;
}

async function run() {
  try {
    await fsPromises.rm(logPath, { force: true });
  } catch {}
  console.log("🚀 Starting", cmdArgs.join(" "));

  const proc = spawn(cmdArgs.join(" "), [], {
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    shell: true,
    detached: true,
  });

  const logStream = fs.createWriteStream(logPath);
  proc.stdout?.pipe(process.stdout);
  proc.stdout?.pipe(logStream);
  proc.stderr?.pipe(process.stderr);
  proc.stderr?.pipe(logStream);

  let opened = false;
  let errorOpened = false;
  let lastReadySeen = false;
  let lastLogSize = 0;
  let stableCount = 0;

  const poll = setInterval(async () => {
    try {
      const stats = fs.statSync(logPath);
      const currentLog = await fsPromises.readFile(logPath, "utf8");

      // Stability check LAST - check ready first!
      const logChanged = stats.size !== lastLogSize;
      if (logChanged && stats.size > 100) {
        stableCount = 0;
        lastLogSize = stats.size;
        console.log(
          `📊 ${stats.size}B CHANGED | LOG:\n${currentLog.slice(0, 500)}...`,
        );
      } else if (stats.size > 100) {
        stableCount++;
        console.log(`📊 ${stats.size}B STABLE (${stableCount}/5)`);
        if (stableCount >= 5) {
          console.log("🛑 Log stable 5 polls - stopping");
          clearInterval(poll);
          return;
        }
      }

      // Error first
      const errorRegex = /⨯|[Ss]yntax[Ee]rror|error|failed|exception/i;
      if (errorRegex.test(currentLog) && !noAi && !errorOpened) {
        console.log("🎯 ERROR!");
        const err = getErrorContext(currentLog);
        const customPrompt = "Explain what the error is, how to fix it, then give a shell script with the best recommended solution.";
        const prompt = encodeURIComponent(customPrompt + " ");
        opener(`${aiBase}${prompt}next.js+${err}`);
        errorOpened = true;
        return;
      }

      // Ready check BEFORE stability stops us - with transition guard
      const readyRegex = /(?:ready[\s-]*started server|Ready in \d+ms)/i;
      const isReadyNow = readyRegex.test(currentLog);
      if (isReadyNow && !lastReadySeen && !opened) {
        opened = true;
        lastReadySeen = true;
        console.log("🎉 READY DETECTED!");
        const url = extractUrl(currentLog);
        if (url && !noOpen) {
          console.log("🌐 Testing", url);
          try {
            await waitOn(url, { timeout: 10000, http: true });
            console.log("✅ HTTP READY!");
          } catch (e) {
            console.log(
              "⚠ HTTP not ready, but opening:",
              e.message.slice(0, 50),
            );
          }
          console.log("🚀 OPENING BROWSER:", url);
          opener(url);
        }
        clearInterval(poll);
        return;
      }
      lastReadySeen = isReadyNow;
    } catch (e) {
      console.log("Poll error:", e.message);
    }
  }, pollDelay);

  process.on("SIGINT", () => {
    console.log("\n👋 Exiting (dev server alive)");
    clearInterval(poll);
    process.exit(0);
  });
}

run().catch(console.error);

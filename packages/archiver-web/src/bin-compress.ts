import { parseArgs } from "util";
import * as fs from "fs";
import * as path from "path";
import { compress } from "./index.js";

async function readStreamToBuffer(stream: NodeJS.ReadStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function main() {
  const options = {
    out: { type: "string" as const, short: "o" },
    level: { type: "string" as const, short: "l", default: "6" },
    help: { type: "boolean" as const, short: "h" },
  };

  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options,
    allowPositionals: true,
  });

  if (values.help) {
    console.error("Usage: compress [files...] [options]");
    console.error("If [files...] are omitted, reads from stdin.");
    console.error("Options:");
    console.error("  -o, --out <file>        Output file. If absent and not TTY, outputs to stdout.");
    console.error("  -l, --level <1-9>       Compression level (default: 6).");
    process.exit(0);
  }

  const filesToArchive: Array<{ path: string; content: Blob | string }> = [];

  if (positionals.length > 0) {
    for (const filePath of positionals) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        console.error("Directory archiving not supported yet (" + filePath + ")");
        process.exit(1);
      }
      const buf = fs.readFileSync(filePath);
      filesToArchive.push({
        path: path.basename(filePath),
        content: new Blob([new Uint8Array(buf)]),
      });
    }
  } else {
    if (process.stdin.isTTY) {
      console.error("Error: Must provide files to archive or pipe input via stdin.");
      process.exit(1);
    }
    const stdinBuffer = await readStreamToBuffer(process.stdin);
    filesToArchive.push({
      path: "piped-content",
      content: new Blob([new Uint8Array(stdinBuffer)]),
    });
  }

  const archive = await compress({
    files: filesToArchive,
    outputName: values.out ? path.basename(values.out) : "archive.zip",
    compressionLevel: parseInt(values.level || "6", 10),
  });

  const archiveBuffer = Buffer.from(await archive.blob.arrayBuffer());

  if (values.out) {
    fs.writeFileSync(path.resolve(values.out), archiveBuffer);
    console.error("Created archive at " + values.out);
  } else {
    process.stdout.write(archiveBuffer);
  }
}

main().catch((err) => {
  console.error("Compress Error:", err);
  process.exit(1);
});

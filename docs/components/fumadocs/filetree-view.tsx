import { generateFileTree, parseIgnoreFile } from "@/lib/fumadocs/generate-filetree";
import { FileTreeTable } from "./filetree-table";
import path from "path";

export function FileTreeView({
  dir,
  ghBase,
  descriptions = {},
  ignore = [],
  ignoreFile,
  inferDescriptions = true,
}: {
  /** Absolute or relative (to cwd) path to the directory to scan */
  dir: string;
  /** Base GitHub URL for file links, e.g. "https://github.com/user/repo/tree/master/src" */
  ghBase: string;
  /** Descriptions keyed by relative path from the scanned dir */
  descriptions?: Record<string, string>;
  /** List of file/folder names or relative paths to ignore */
  ignore?: string[];
  /** Path to a .treeignore file (gitignore-style, one pattern per line) */
  ignoreFile?: string;
  /** Infer file descriptions from JSDoc/comments at the top of source files (default: true) */
  inferDescriptions?: boolean;
}) {
  const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);

  const ignorePatterns = new Set(ignore);
  if (ignoreFile) {
    const filePath = path.isAbsolute(ignoreFile) ? ignoreFile : path.resolve(process.cwd(), ignoreFile);
    for (const p of parseIgnoreFile(filePath)) {
      ignorePatterns.add(p);
    }
  }

  const tree = generateFileTree(resolvedDir, descriptions, ignorePatterns, inferDescriptions);

  return <FileTreeTable tree={tree} ghBase={ghBase} />;
}

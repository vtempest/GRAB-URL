/**
 * @file archiver.test.ts
 * @description Unit tests for the archiver-web `extract` and `compress` functions.
 *
 * `libarchive.js` relies on a WASM worker which is unavailable in Node/Vitest,
 * so we mock the entire module and test that our wrappers:
 *   - call the correct libarchive.js APIs
 *   - correctly filter files by folderPath
 *   - handle passwords, binary content, binary detection fallback
 *   - correctly map `compress` arguments onto Archive.write()
 *   - surface errors cleanly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extract, compress, _setArchiveClass } from '../packages/archiver-web/src/index.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeFileBlob(text: string, mime = 'text/plain') {
  return {
    text: () => Promise.resolve(text),
    size: text.length,
    type: mime,
  };
}

function makeBinaryBlob(bytes: Uint8Array) {
  return {
    text: () => Promise.reject(new Error('binary')),
    arrayBuffer: () => Promise.resolve(bytes.buffer),
    size: bytes.length,
    type: 'application/octet-stream',
  };
}

// ─── libarchive.js mock ──────────────────────────────────────────────────────

const mockUsePassword = vi.fn();
const mockGetFilesObject = vi.fn();
const mockArchiveWrite   = vi.fn();
const mockArchiveOpen    = vi.fn();

const MockArchive = {
  open: mockArchiveOpen,
  write: mockArchiveWrite,
  init: vi.fn(),
};

// ─── setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Inject mock Archive class to bypass dynamic import of libarchive.js
  _setArchiveClass(MockArchive);

  mockArchiveOpen.mockResolvedValue({
    usePassword: mockUsePassword,
    getFilesObject: mockGetFilesObject,
  });
  mockUsePassword.mockResolvedValue(undefined);
  mockArchiveWrite.mockResolvedValue(new Blob(['ARCHIVE_DATA']));
});

// ─── extract() ───────────────────────────────────────────────────────────────

describe('extract()', () => {
  it('throws when no archiveBuffer is provided', async () => {
    await expect(
      extract({ archiveBuffer: null as unknown as ArrayBuffer })
    ).rejects.toThrow('Must provide archiveBuffer');
  });

  it('extracts all root files when folderPath is empty string', async () => {
    mockGetFilesObject.mockResolvedValue({
      'readme.md': { extract: () => Promise.resolve(makeFileBlob('# Hello')) },
      'index.ts':  { extract: () => Promise.resolve(makeFileBlob('export {}')) },
    });

    const result = await extract({ archiveBuffer: new ArrayBuffer(8) });

    expect(result).toHaveLength(2);
    const paths = result.map(f => f.path).sort();
    expect(paths).toEqual(['index.ts', 'readme.md']);
    expect(result.find(f => f.path === 'readme.md')?.content).toBe('# Hello');
    expect(result.find(f => f.path === 'index.ts')?.content).toBe('export {}');
  });

  it('filters files by folderPath prefix', async () => {
    mockGetFilesObject.mockResolvedValue({
      src: {
        'index.ts':  { extract: () => Promise.resolve(makeFileBlob('export {}')) },
        'utils.ts':  { extract: () => Promise.resolve(makeFileBlob('export const x = 1')) },
      },
      'readme.md': { extract: () => Promise.resolve(makeFileBlob('# Hello')) },
    });

    const result = await extract({
      archiveBuffer: new ArrayBuffer(8),
      folderPath: 'src/',
    });

    expect(result).toHaveLength(2);
    expect(result.every(f => !f.path.startsWith('src/'))).toBe(true);
  });

  it('calls usePassword when password is provided', async () => {
    mockGetFilesObject.mockResolvedValue({});

    await extract({
      archiveBuffer: new ArrayBuffer(8),
      password: 's3cr3t',
    });

    expect(mockUsePassword).toHaveBeenCalledWith('s3cr3t');
  });

  it('skips usePassword when no password is given', async () => {
    mockGetFilesObject.mockResolvedValue({});

    await extract({ archiveBuffer: new ArrayBuffer(8) });

    expect(mockUsePassword).not.toHaveBeenCalled();
  });

  it('base64-encodes binary content when text() throws', async () => {
    const bytes = Uint8Array.from([0x00, 0xff, 0x10, 0xab]);
    mockGetFilesObject.mockResolvedValue({
      'data.bin': { extract: () => Promise.resolve(makeBinaryBlob(bytes)) },
    });

    const result = await extract({ archiveBuffer: new ArrayBuffer(8) });
    expect(result).toHaveLength(1);
    // Content should be a non-empty base64 string
    expect(result[0].content.length).toBeGreaterThan(0);
  });

  it('populates size and mime correctly for each file', async () => {
    const blob = makeFileBlob('hello world', 'text/markdown');
    mockGetFilesObject.mockResolvedValue({
      'notes.md': { extract: () => Promise.resolve(blob) },
    });

    const result = await extract({ archiveBuffer: new ArrayBuffer(8) });
    expect(result[0].size).toBe('hello world'.length);
    expect(result[0].mime).toBe('text/markdown');
  });

  it('returns empty array when archive has no files', async () => {
    mockGetFilesObject.mockResolvedValue({});

    const result = await extract({ archiveBuffer: new ArrayBuffer(8) });
    expect(result).toHaveLength(0);
  });
});

// ─── compress() ──────────────────────────────────────────────────────────────

describe('compress()', () => {
  it('returns a blob, mime type, and downloadName', async () => {
    const result = await compress({
      files: [{ path: 'hello.txt', content: 'Hello World' }],
      outputName: 'archive.zip',
    });

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.mime).toBe('application/zip');
    expect(result.downloadName).toBe('archive.zip');
  });

  it('passes files to Archive.write', async () => {
    await compress({
      files: [{ path: 'a.txt', content: 'AAA' }],
      outputName: 'out.tar',
      format: 'USTAR',
      compression: 'GZIP',
    });

    expect(mockArchiveWrite).toHaveBeenCalledOnce();
    const call = mockArchiveWrite.mock.calls[0][0];
    expect(call.outputFileName).toBe('out.tar');
    expect(call.format).toBe('USTAR');
    expect(call.compression).toBe('GZIP');
    expect(call.files[0].pathname).toBe('a.txt');
    expect(call.files[0].file).toBeInstanceOf(Blob);
  });

  it('converts string content to a Blob', async () => {
    await compress({
      files: [{ path: 'str.txt', content: 'text content' }],
      outputName: 'out.zip',
    });

    const { files } = mockArchiveWrite.mock.calls[0][0];
    expect(files[0].file).toBeInstanceOf(Blob);
  });

  it('converts Uint8Array content to a Blob', async () => {
    await compress({
      files: [{ path: 'bytes.bin', content: new Uint8Array([1, 2, 3]) }],
      outputName: 'out.zip',
    });

    const { files } = mockArchiveWrite.mock.calls[0][0];
    expect(files[0].file).toBeInstanceOf(Blob);
  });

  it('converts ArrayBuffer content to a Blob', async () => {
    await compress({
      files: [{ path: 'buf.bin', content: new ArrayBuffer(4) }],
      outputName: 'out.zip',
    });

    const { files } = mockArchiveWrite.mock.calls[0][0];
    expect(files[0].file).toBeInstanceOf(Blob);
  });

  it('passes a Blob directly without wrapping', async () => {
    const rawBlob = new Blob(['already a blob']);
    await compress({
      files: [{ path: 'blob.txt', content: rawBlob }],
      outputName: 'out.zip',
    });

    const { files } = mockArchiveWrite.mock.calls[0][0];
    expect(files[0].file).toBe(rawBlob);
  });

  it('throws on unsupported content type', async () => {
    await expect(
      compress({
        files: [{ path: 'bad.txt', content: 12345 as unknown as string }],
        outputName: 'out.zip',
      })
    ).rejects.toThrow('Unsupported content type');
  });

  it('passes passphrase to Archive.write', async () => {
    await compress({
      files: [{ path: 'secure.txt', content: 'secret' }],
      outputName: 'locked.zip',
      passphrase: 'my-pass',
    });

    const call = mockArchiveWrite.mock.calls[0][0];
    expect(call.passphrase).toBe('my-pass');
  });

  it('passes compressionLevel to Archive.write', async () => {
    await compress({
      files: [{ path: 'a.txt', content: 'hi' }],
      outputName: 'compressed.zip',
      compressionLevel: 9,
    });

    const call = mockArchiveWrite.mock.calls[0][0];
    expect(call.compressionLevel).toBe(9);
  });

  it('handles multiple files in a single call', async () => {
    await compress({
      files: [
        { path: 'a.txt', content: 'AAA' },
        { path: 'b.txt', content: 'BBB' },
        { path: 'c.txt', content: 'CCC' },
      ],
      outputName: 'multi.zip',
    });

    const { files } = mockArchiveWrite.mock.calls[0][0];
    expect(files).toHaveLength(3);
    expect(files.map((f: any) => f.pathname)).toEqual(['a.txt', 'b.txt', 'c.txt']);
  });
});

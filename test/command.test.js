import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ColorFileDownloader } from '../src/grab-url.js';

describe('Ubuntu Downloads CLI Tests', () => {
  let downloader;
  let testOutputDir;

  beforeEach(() => {
    downloader = new ColorFileDownloader();
    testOutputDir = path.join(process.cwd(), 'test/test-downloads');
    
    // Create test directory
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test files
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
    
    // Cleanup downloader resources
    downloader.cleanup();
  });

  describe('Multiple File Downloads', () => {
    it('should successfully download 3 Ubuntu files simultaneously', async () => {
      const downloads = [
        {
          url: 'https://data-management.uni-muenster.de/direct-access/wwurdm/84958668513',
          outputPath: path.join(testOutputDir, 'hallurag.zip'),
          filename: 'hallurag.zip'
        },
        // {
        //   url: 'https://releases.ubuntu.com/24.04.2/ubuntu-24.04.2-live-server-amd64.iso', 
        //   outputPath: path.join(testOutputDir, 'ubuntu-server.iso'),
        //   filename: 'ubuntu-server.iso'
        // },
        // {
        //   url: 'https://releases.ubuntu.com/22.04.5/ubuntu-22.04.5-desktop-amd64.iso',
        //   outputPath: path.join(testOutputDir, 'ubuntu-22-desktop.iso'), 
        //   filename: 'ubuntu-22-desktop.iso'
        // }
      ];

      // Mock console methods to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Set a reasonable timeout for large file downloads
      const downloadPromise = downloader.downloadMultipleFiles(downloads);
      
      // Wait for downloads to complete
      await expect(downloadPromise).resolves.not.toThrow();
      
      // Verify all files were created
      downloads.forEach(download => {
        expect(fs.existsSync(download.outputPath)).toBe(true);
        
        // Verify file has some content (not empty)
        const stats = fs.statSync(download.outputPath);
        expect(stats.size).toBeGreaterThan(0);
        
        // Verify it's actually an ISO file (starts with ISO magic bytes)
        const buffer = fs.readFileSync(download.outputPath, { encoding: null, flag: 'r' });
        const first32KB = buffer.subarray(0, 32768);
        
        // Check for ISO 9660 signature at offset 32769 or CD001 signature
        const hasISOSignature = buffer.toString('ascii', 32769, 32774) === 'CD001' ||
                               first32KB.includes(Buffer.from('CD001'));
        expect(hasISOSignature).toBe(true);
      });
      
      consoleSpy.mockRestore();
    }, 300000); // 5 minute timeout for large downloads
  });

  // describe('Download Cancellation and Resume', () => {
  //   it('should handle download cancellation after 30 seconds and allow resume', async () => {
  //     const testUrl = 'https://releases.ubuntu.com/24.04.2/ubuntu-24.04.2-desktop-amd64.iso';
  //     const outputPath = path.join(testOutputDir, 'ubuntu-cancel-resume-test.iso');
      
  //     let downloadAborted = false;
  //     let partialFileSize = 0;
      
  //     // Mock console methods
  //     const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
  //     // Start initial download
  //     const downloadPromise = downloader.downloadFile(testUrl, outputPath);
      
  //     // Cancel download after 30 seconds
  //     const cancelTimeout = setTimeout(() => {
  //       try {
  //         downloader.cleanup();
  //         downloadAborted = true;
          
  //         // Check if partial file exists
  //         if (fs.existsSync(outputPath)) {
  //           const stats = fs.statSync(outputPath);
  //           partialFileSize = stats.size;
  //           console.log(`Partial download size: ${partialFileSize} bytes`);
  //         }
  //       } catch (error) {
  //         console.log('Cleanup completed during cancellation');
  //       }
  //     }, 30000);
      
  //     // Wait for cancellation or completion
  //     try {
  //       await downloadPromise;
  //       clearTimeout(cancelTimeout);
  //     } catch (error) {
  //       // Expected if download was cancelled
  //       clearTimeout(cancelTimeout);
  //       expect(downloadAborted || error.message.includes('cancelled')).toBe(true);
  //     }
      
  //     // Verify partial download occurred
  //     expect(partialFileSize).toBeGreaterThan(0);
  //     expect(fs.existsSync(outputPath)).toBe(true);
      
  //     // Create new downloader instance for resume
  //     const resumeDownloader = new ColorFileDownloader();
      
  //     // Resume download (this would normally use HTTP Range headers in a real implementation)
  //     // For this test, we'll start a fresh download and verify it can overwrite
  //     try {
  //       await resumeDownloader.downloadFile(testUrl, outputPath);
        
  //       // Verify resumed download completed successfully
  //       expect(fs.existsSync(outputPath)).toBe(true);
        
  //       const finalStats = fs.statSync(outputPath);
  //       expect(finalStats.size).toBeGreaterThanOrEqual(partialFileSize);
        
  //       // Verify it's a valid ISO file
  //       const buffer = fs.readFileSync(outputPath, { encoding: null, flag: 'r' });
  //       const hasISOSignature = buffer.toString('ascii', 32769, 32774) === 'CD001';
  //       expect(hasISOSignature).toBe(true);
        
  //     } finally {
  //       resumeDownloader.cleanup();
  //     }
      
  //     consoleSpy.mockRestore();
  //   }, 180000); // 3 minute timeout for cancellation and resume test
  // });

});

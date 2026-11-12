import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';

/**
 * Downloads a gzipped JSON translation pack over HTTPS/HTTP (following redirects)
 * and verifies that it decompresses to a valid 66-book Bible payload.
 */
export function downloadBuffer(url: string, maxRedirects: number = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'daily-bread-statusbar-vscode'
        },
        timeout: 30000
      },
      res => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (maxRedirects <= 0) {
            reject(new Error('Too many HTTP redirects while downloading translation pack.'));
            return;
          }
          const nextUrl = new URL(res.headers.location, url).toString();
          downloadBuffer(nextUrl, maxRedirects - 1).then(resolve, reject);
          return;
        }

        if (status !== 200) {
          res.resume();
          reject(new Error(`Download failed with HTTP ${status} from ${url}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', err => reject(err));
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Download timed out after 30 seconds.'));
    });
    req.on('error', err => reject(err));
  });
}

/**
 * Decompresses and validates a downloaded `.json.gz` Bible pack.
 * Returns the parsed book map (`bookId -> chapters[][]`) if valid.
 */
export function parseAndValidatePack(gzBuffer: Buffer): Record<string, string[][]> {
  const jsonBuf = zlib.gunzipSync(gzBuffer);
  const parsed = JSON.parse(jsonBuf.toString('utf8')) as Record<string, string[][]>;

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed['1']) || !Array.isArray(parsed['66'])) {
    throw new Error('Invalid Bible translation pack format (missing expected canonical books).');
  }
  return parsed;
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to resolve key contents safely from multiple possible locations:
// 1. Environment variables (PRIVATE_KEY / PUBLIC_KEY)
// 2. Render Secret Files mounted at /etc/secrets/
// 3. App root secret files / Render working directory (/app/keys/ or /app/private.pem)
// 4. Relative directory (../keys/)
const loadKey = (envVarName, filename) => {
  if (process.env[envVarName]) {
    return process.env[envVarName].replace(/\\n/g, '\n');
  }

  const candidatePaths = [
    path.join('/etc/secrets', filename),
    path.join(process.cwd(), 'keys', filename),
    path.join(process.cwd(), filename),
    path.join(__dirname, '../keys', filename),
  ];

  for (const keyPath of candidatePaths) {
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf-8');
    }
  }

  throw new Error(`Key file "${filename}" could not be found in any of: ${candidatePaths.join(', ')}`);
};

const privateKey = loadKey('PRIVATE_KEY', 'private.pem');
const publicKey = loadKey('PUBLIC_KEY', 'public.pem');

export { privateKey, publicKey };

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load public.pem from committed keys folder or fallback
const publicKeyPath = path.join(__dirname, '../keys/public.pem');
const publicKey = fs.existsSync(publicKeyPath) ? fs.readFileSync(publicKeyPath, 'utf-8') : '';

// 2. Load private.pem strictly from Render's secret stores
const loadPrivateKey = () => {
  // Check environment variable first
  if (process.env.PRIVATE_KEY) {
    return process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
  }

  // Define paths to search
  const renderSecretPaths = [
    '/etc/secrets/private.pem',                      // Render standard secret path
    path.join(process.cwd(), 'private.pem'),         // Render native runtime mirror root
    path.join(__dirname, '../keys/private.pem'),     // Local development fallback
  ];

  // Loop through and return the first one that exists
  for (const keyPath of renderSecretPaths) {
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf-8');
    }
  }

  // Crash explicitly with a helpful message instead of letting readFileSync fail downstream
  throw new Error(
    `Private key not found! Verified paths: ${renderSecretPaths.join(', ')}. Please configure PRIVATE_KEY or upload private.pem to Render Secrets.`
  );
};

const privateKey = loadPrivateKey();

export { privateKey, publicKey };

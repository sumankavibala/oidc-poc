import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load public.pem directly from the repository's keys folder (committed to Git)
const publicKeyPath = path.join(__dirname, '../keys/public.pem');
const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');

// 2. Load private.pem strictly from Render's secret stores (ENV or Render Secret Files)
const loadPrivateKey = () => {
  if (process.env.PRIVATE_KEY) {
    return process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
  }

  const renderSecretPaths = [
    path.join('/etc/secrets', 'private.pem'),
    path.join(process.cwd(), 'keys', 'private.pem'),
    path.join(process.cwd(), 'private.pem'),
    path.join(__dirname, '../keys', 'private.pem'),
  ];

  for (const keyPath of renderSecretPaths) {
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf-8');
    }
  }

  throw new Error(
    `Private key not found! Please configure PRIVATE_KEY environment variable or upload private.pem as a Secret File in Render.`
  );
};

const privateKey = loadPrivateKey();

export { privateKey, publicKey };

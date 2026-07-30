import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to resolve key paths (checks Render's secret store first, then local ./keys folder)
const getKeyPath = (filename) => {
  const renderPath = path.join('/etc/secrets', filename);
  if (fs.existsSync(renderPath)) {
    return renderPath;
  }
  return path.join(__dirname, '../keys', filename);
};
const privateKey = fs.readFileSync(getKeyPath('private.pem'), 'utf-8');
const publicKey = fs.readFileSync(getKeyPath('public.pem'), 'utf-8');

export {privateKey, publicKey};

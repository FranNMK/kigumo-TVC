/**
 * Centralized Environment Loader
 * 
 * Solves cPanel Passenger & deployment quirks:
 * 1. Checks both `.env` and `env` (without dot, common when cPanel hides dotfiles).
 * 2. Checks both process.cwd() and absolute paths relative to project root.
 * 3. Guarantees environment variables are populated synchronously before other modules execute.
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

let loadedEnvPath = null;

function loadEnvironment() {
  if (loadedEnvPath) return loadedEnvPath;

  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../env')
  ];

  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath) && fs.statSync(envPath).isFile()) {
        const result = dotenv.config({ path: envPath });
        if (!result.error) {
          loadedEnvPath = envPath;
          break;
        }
      }
    } catch (_) {
      // Continue searching next candidate
    }
  }

  return loadedEnvPath;
}

// Auto-run on require
loadEnvironment();

module.exports = {
  loadedEnvPath,
  loadEnvironment
};

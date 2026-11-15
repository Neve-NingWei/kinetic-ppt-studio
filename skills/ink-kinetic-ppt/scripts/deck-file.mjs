import fs from 'node:fs';
import path from 'node:path';

// root must be the canonical directory returned by realpathSync.native().
export function resolveDeckFile(root, reference) {
  if (path.win32.isAbsolute(reference) || /[:\0]/.test(reference)) {
    throw new Error('Deck resources must use relative file paths.');
  }

  // Reject parent segments before normalization, especially after a junction.
  if (reference.split(/[\\/]/).includes('..')) {
    throw new Error('Deck resource must not contain parent directory segments: ' + reference);
  }
  const candidate = path.resolve(root, reference);

  let file;
  try {
    file = fs.realpathSync.native(candidate);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }

  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (file !== root && !file.startsWith(prefix)) {
    throw new Error('Deck resource resolves outside --src: ' + reference);
  }
  return fs.statSync(file).isFile() ? file : null;
}

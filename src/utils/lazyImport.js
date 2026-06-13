import { lazy } from 'react';

/**
 * A wrapper around React.lazy that handles ChunkLoadError and dynamically imported module fetch failures.
 * This happens when a new version of the app is deployed and the user's browser is trying to load
 * an old hashed chunk that no longer exists on the server.
 * 
 * If a fetch error occurs, it triggers a page reload to get the latest index.html and chunk names.
 */
export const lazyImport = (importFunc) => {
  return lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      const isChunkLoadError = 
        error.name === 'ChunkLoadError' || 
        (error.message && error.message.includes('Failed to fetch dynamically imported module'));
        
      if (isChunkLoadError) {
        const reloadCount = parseInt(sessionStorage.getItem('chunkReloadCount') || '0', 10);
        
        if (reloadCount < 2) {
          sessionStorage.setItem('chunkReloadCount', String(reloadCount + 1));
          window.location.reload();
          // Return a promise that never resolves to prevent further rendering while reloading
          return new Promise(() => {});
        }
      }
      
      throw error;
    }
  });
};

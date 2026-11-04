import { useEffect, useState } from 'react'

/**
 * Detects when a new PWA version has been installed and taken control.
 *
 * HOW IT WORKS:
 * - The service worker (SW) caches app assets (JS, CSS, HTML).
 * - When you deploy a new build, the new SW installs in the background.
 * - With registerType:'autoUpdate', it activates immediately and fires
 *   'controllerchange' on navigator.serviceWorker.
 * - We listen for that event and prompt the user to reload.
 *
 * DATA SAFETY:
 * - IndexedDB (Dexie) data is NEVER touched by SW updates.
 * - Only app assets (code/styles) are updated. All sales, products,
 *   settings, and stock history remain 100% intact across any update.
 */
export function usePwaUpdate() {
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Record whether a SW was already controlling the page at load time.
    // If true → this is an update (not a first install), show the banner.
    const hadController = !!navigator.serviceWorker.controller

    function onControllerChange() {
      if (hadController) {
        setUpdateReady(true)
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return {
    updateReady,
    applyUpdate: () => window.location.reload(),
  }
}

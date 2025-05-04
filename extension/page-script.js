let app = null
let isInitializing = false
let observer = null
let isHandlingMutation = false // Guard flag for mutation observer

// Constants
const STORAGE_KEY = 'biyoSettings'
const MESSAGE_SOURCE = 'biyo-page'

const defaultSettings = {
  targetSelector: 'body',
  mountStrategy: 'prepend',
  viteUrl: 'http://localhost:5173',
  enabled: false
}

const settingsManager = {
  save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      return settings
    } catch (error) {
      console.warn('[biyo] Error saving settings:', error)
      return null
    }
  },

  get() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY)
      const settings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings

      // Ensure targetSelector is never empty
      if (!settings.targetSelector?.trim()) {
        settings.targetSelector = defaultSettings.targetSelector
      }

      return settings
    } catch (error) {
      console.warn('[biyo] Error reading settings:', error)
      return defaultSettings
    }
  }
}

const messageHandler = {
  sendMessage(type, data = {}) {
    window.postMessage({ source: MESSAGE_SOURCE, type, ...data }, '*')
  },

  handleMessage(event) {
    if (event.source !== window || event.data.source !== 'biyo-content-script') return

    const { type, settings } = event.data
    switch (type) {
      case 'SAVE_SETTINGS': {
        try {
          settingsManager.save(settings)
          this.sendMessage('SETTINGS_SAVED', { success: true })
          window.dispatchEvent(new CustomEvent('SETTINGS_UPDATED', { detail: settings }))
          initApp()
        } catch (error) {
          this.sendMessage('SETTINGS_SAVED', { success: false, error: error.message })
        }
        break
      }
      case 'GET_SETTINGS': {
        try {
          const currentSettings = settingsManager.get()
          this.sendMessage('GOT_SETTINGS', { settings: currentSettings })
        } catch (error) {
          this.sendMessage('GOT_SETTINGS', { settings: null })
        }
        break
      }
      case 'INITIALIZE_APP': {
        initApp()
        break
      }
    }
  }
}

const checkVueAvailability = async viteUrl => {
  try {
    // Load Vite client for HMR
    const viteClientScript = document.createElement('script')
    viteClientScript.type = 'module'
    viteClientScript.src = `${viteUrl}/@vite/client`
    document.head.appendChild(viteClientScript)

    // Load main.js
    const mainScript = document.createElement('script')
    mainScript.type = 'module'
    mainScript.src = `${viteUrl}/src/main.js`
    document.head.appendChild(mainScript)

    let checkVueInterval = null
    let timeoutId = null

    return new Promise(resolve => {
      checkVueInterval = setInterval(() => {
        if (window.mountVueApp) {
          clearInterval(checkVueInterval)
          clearTimeout(timeoutId)
          console.log('[biyo] Vue detected')
          resolve(true)
        }
      }, 100)

      timeoutId = setTimeout(() => {
        clearInterval(checkVueInterval)
        console.log('[biyo] Vue not detected, assuming React app')
        resolve(false)
      }, 500)
    })
  } catch (error) {
    console.error('[biyo] Error checking Vue availability:', error)
    return false
  }
}

const injectReactScripts = async (viteUrl, container) => {
  try {
    console.log('[biyo] Using container for React app:', container)

    // First, load the React refresh runtime directly
    const refreshRuntimeModule = await import(`${viteUrl}/@react-refresh`)
    refreshRuntimeModule.default.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => type => type
    window.__vite_plugin_react_preamble_installed__ = true
    console.log('[biyo] React refresh runtime initialized')

    // Create script tags for external resources
    const scripts = [
      // Vite client for HMR
      { src: `${viteUrl}/@vite/client`, type: 'module' },
      // Main React entry point that defines mountReactApp
      { src: `${viteUrl}/src/main.jsx`, type: 'module' }
    ]

    // Load all scripts
    const loadPromises = scripts.map(scriptInfo => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.type = scriptInfo.type
        script.src = scriptInfo.src
        script.setAttribute('data-biyo-react', 'true')

        script.onload = () => resolve()
        script.onerror = err => reject(err)

        document.head.appendChild(script)
      })
    })

    // Wait for all scripts to load
    await Promise.all(loadPromises)

    let checkMountInterval = null
    let timeoutId = null

    return new Promise(resolve => {
      checkMountInterval = setInterval(() => {
        if (typeof window.mountReactApp === 'function') {
          clearInterval(checkMountInterval)
          clearTimeout(timeoutId)

          try {
            const reactRoot = window.mountReactApp(container)
            console.log('[biyo] React app mounted successfully')
            resolve(reactRoot)
          } catch (error) {
            console.error('[biyo] Error mounting React app:', error)
            resolve(null)
          }
        }
      }, 100)

      timeoutId = setTimeout(() => {
        clearInterval(checkMountInterval)
        console.error('[biyo] Timed out waiting for mountReactApp function')
        resolve(null)
      }, 5000)
    })
  } catch (error) {
    console.error('[biyo] Error injecting React scripts:', error)
    throw error
  }
}

const cleanupApp = () => {
  if (app) {
    try {
      if (typeof app.unmount === 'function') {
        console.log('[biyo] Unmounting app')
        app.unmount()

        // Clean up replaced content if needed
        const settings = settingsManager.get()
        const targetElement = document.querySelector(settings.targetSelector)
        if (targetElement && settings.mountStrategy === 'replace') {
          targetElement.innerHTML = '' // Clean up replaced content
        }
      }
    } catch (error) {
      console.error('[biyo] Error cleaning up app:', error)
    }
    app = null
  }
}

const initApp = async () => {
  if (isInitializing) return

  isInitializing = true
  isHandlingMutation = true // Prevent observer from triggering during initialization

  const settings = settingsManager.get()

  // Check if the extension is enabled, if not, clean up and return
  if (settings.enabled === false) {
    console.log('[biyo] Biyo is disabled via settings')
    cleanupApp()
    isInitializing = false
    isHandlingMutation = false
    return
  }

  const targetElement = document.querySelector(settings.targetSelector)

  if (!targetElement) {
    isInitializing = false
    isHandlingMutation = false
    return
  }

  // Clean up previous instance if exists
  cleanupApp()

  try {
    let mountElement
    switch (settings.mountStrategy) {
      case 'before':
        mountElement = document.createElement('div')
        targetElement.parentElement.insertBefore(mountElement, targetElement)
        break
      case 'append':
        mountElement = document.createElement('div')
        targetElement.appendChild(mountElement)
        break
      case 'prepend':
        mountElement = document.createElement('div')
        targetElement.insertBefore(mountElement, targetElement.firstChild)
        break
      case 'replace':
        mountElement = targetElement
        targetElement.innerHTML = ''
        break
    }

    const isVue = await checkVueAvailability(settings.viteUrl)

    if (isVue) {
      // For Vue, use direct mounting
      app = window.mountVueApp(mountElement)
      console.log('[biyo] Vue app loaded directly:', settings.viteUrl)
    } else {
      // Inject React scripts and get the root
      app = await injectReactScripts(settings.viteUrl, mountElement)
      console.log('[biyo] React app loaded directly:', settings.viteUrl)
    }
  } catch (error) {
    console.error('[biyo] Error initializing app:', error)
  } finally {
    isInitializing = false
    // Small delay to ensure DOM mutations from initialization are complete
    setTimeout(() => {
      isHandlingMutation = false
    }, 0)
  }
}

// Set up the observer to watch for DOM changes
const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new MutationObserver(mutations => {
    // Skip if we're currently handling a mutation or initializing
    if (isHandlingMutation || isInitializing) return

    const settings = settingsManager.get()
    const targetElement = document.querySelector(settings.targetSelector)

    // Check if we need to reinitialize
    const shouldReinit = mutations.some(mutation => {
      // If target element was removed
      if (mutation.type === 'childList' && mutation.removedNodes.length) {
        const wasTargetRemoved = Array.from(mutation.removedNodes).some(node => {
          return node === targetElement || node.contains(targetElement)
        })
        if (wasTargetRemoved) return true
      }

      // If target element appeared (for initial mount)
      if (!app && mutation.type === 'childList' && mutation.addedNodes.length) {
        const wasTargetAdded = Array.from(mutation.addedNodes).some(node => {
          return node.matches?.(settings.targetSelector) || node.querySelector?.(settings.targetSelector)
        })
        if (wasTargetAdded) return true
      }

      return false
    })

    if (shouldReinit) {
      isHandlingMutation = true
      initApp()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

window.addEventListener('message', event => messageHandler.handleMessage(event))
setupObserver()

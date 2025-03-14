const MESSAGE_SOURCE = 'biyo-content-script'

const injectScript = (src, type = 'module') => {
  const script = document.createElement('script')
  script.type = type
  script.src = src
  document.head.appendChild(script)
  return script
}

const chromeRuntime = {
  isAvailable() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
  },

  sendMessage(message) {
    if (!this.isAvailable()) return
    try {
      chrome.runtime.sendMessage(message)
    } catch (error) {
      console.warn('[biyo] Failed to send chrome message:', error)
    }
  }
}

const messageHandler = {
  sendMessage(type, data = null) {
    window.postMessage({ source: MESSAGE_SOURCE, type, settings: data }, '*')
  },

  getSettings() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler)
        reject(new Error('Timeout waiting for settings'))
      }, 5000)

      const handler = event => {
        if (event.source === window && event.data.source === 'biyo-page' && event.data.type === 'GOT_SETTINGS') {
          clearTimeout(timeout)
          window.removeEventListener('message', handler)
          resolve(event.data.settings)
        }
      }

      window.addEventListener('message', handler)
      this.sendMessage('GET_SETTINGS')
    })
  }
}

const extensionHandler = {
  handleMessage(message, sender, sendResponse) {
    if (!chromeRuntime.isAvailable()) {
      sendResponse({ success: false, error: 'Extension context invalid' })
      return
    }

    switch (message.type) {
      case 'SAVE_SETTINGS': {
        messageHandler.sendMessage('SAVE_SETTINGS', message.settings)
        sendResponse({ success: true })
        break
      }
      case 'GET_SETTINGS': {
        messageHandler
          .getSettings()
          .then(settings => sendResponse({ success: true, settings }))
          .catch(error => sendResponse({ success: false, error: error.message }))
        return true // Keep the message channel open for async response
      }
      case 'PING': {
        sendResponse({ status: 'ready' })
        break
      }
    }
  }
}

const initialize = async () => {
  if (!chromeRuntime.isAvailable()) {
    console.warn('[biyo] Chrome runtime not available')
    return
  }

  // Set up extension message listener first
  try {
    chrome.runtime.onMessage.removeListener(extensionHandler.handleMessage)
  } catch (error) {
    // Ignore errors when trying to remove non-existent listener
  }
  chrome.runtime.onMessage.addListener(extensionHandler.handleMessage)

  // Announce ready state immediately
  chromeRuntime.sendMessage({ type: 'CONTENT_SCRIPT_READY' })

  try {
    // First inject the page script that handles settings
    const pageScript = chrome.runtime.getURL('page-script.js')
    injectScript(pageScript)

    // Give the page script more time to initialize
    await new Promise(resolve => setTimeout(resolve, 500))

    // Then get settings
    console.log('[biyo] Requesting settings...')
    const settings = await messageHandler.getSettings()
    console.log('[biyo] Got settings:', settings)

    // Initialize the app based on settings
    messageHandler.sendMessage('INITIALIZE_APP', settings)
  } catch (error) {
    console.error('[biyo] Failed to initialize:', error)
    // Try to provide more context about the error
    if (error.message.includes('Timeout waiting for settings')) {
      console.error('[biyo] Page script might not be properly initialized. Try refreshing the page.')
    }
    return
  }

  window.addEventListener('message', event => {
    if (event.source === window && event.data.source === 'biyo-page' && event.data.type === 'SETTINGS_SAVED') {
      chromeRuntime.sendMessage({
        type: 'SETTINGS_SAVED',
        success: event.data.success,
        error: event.data.error
      })
    }
  })
}

window.addEventListener('beforeunload', () => {
  if (chromeRuntime.isAvailable()) {
    try {
      chrome.runtime.onMessage.removeListener(extensionHandler.handleMessage)
    } catch (error) {
      // Ignore cleanup errors
    }
  }
})

// Start initialization when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}

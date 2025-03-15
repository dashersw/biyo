// Default settings
const defaultSettings = {
  targetSelector: 'body',
  mountStrategy: 'prepend',
  viteUrl: 'http://localhost:5173',
  enabled: true
}

// Chrome runtime utilities
const chromeRuntime = {
  isAvailable() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
  },

  async queryTabs() {
    if (!this.isAvailable()) {
      throw new Error('Extension context invalid')
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tabs?.[0]?.id) {
      throw new Error('No active tab found')
    }
    return tabs[0].id
  },

  sendMessage(tabId, message) {
    if (!this.isAvailable()) {
      return Promise.reject(new Error('Extension context invalid'))
    }
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve(response)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}

// UI Elements
const elements = {
  form: null,
  status: null,
  init() {
    this.form = document.getElementById('settings-form')
    this.status = document.getElementById('status')
  }
}

// Form handling
const formHandler = {
  getFormValues() {
    const targetSelector = document.getElementById('targetSelector').value.trim()
    if (!targetSelector) {
      throw new Error('Target selector cannot be empty')
    }

    const viteUrl = document.getElementById('viteUrl').value.trim()
    if (!viteUrl) {
      throw new Error('Vite server URL cannot be empty')
    }

    return {
      targetSelector,
      mountStrategy: document.getElementById('mountStrategy').value,
      viteUrl,
      enabled: document.getElementById('enableBiyo').checked
    }
  },

  setFormValues(settings) {
    if (settings.targetSelector) {
      document.getElementById('targetSelector').value = settings.targetSelector
    }
    if (settings.mountStrategy) {
      document.getElementById('mountStrategy').value = settings.mountStrategy
    }
    if (settings.viteUrl) {
      document.getElementById('viteUrl').value = settings.viteUrl
    }
    document.getElementById('enableBiyo').checked = settings.enabled !== false
  }
}

// Status message handling
const statusHandler = {
  show(message, isError = false) {
    elements.status.textContent = message
    elements.status.className = `status ${isError ? 'error' : 'success'}`
    setTimeout(() => {
      elements.status.className = 'status'
    }, 3000)
  }
}

// Communication with content script
const contentScript = {
  async connect(tabId, maxAttempts = 10) {
    let attempts = 0
    while (attempts < maxAttempts) {
      try {
        const settings = await this.getSettings(tabId)
        return settings
      } catch (error) {
        attempts++
        if (attempts === maxAttempts) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content.js']
            })
            await new Promise(resolve => setTimeout(resolve, 500))
            return await this.getSettings(tabId)
          } catch (injectError) {
            throw new Error('Could not connect to content script')
          }
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    throw new Error('Could not connect to content script')
  },

  async getSettings(tabId) {
    const response = await Promise.race([
      chromeRuntime.sendMessage(tabId, { type: 'GET_SETTINGS' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout getting settings')), 1000))
    ])

    if (response?.success) {
      return response.settings || defaultSettings
    }
    throw new Error(response?.error || 'Failed to get settings')
  },

  async saveSettings(tabId, settings) {
    const response = await Promise.race([
      chromeRuntime.sendMessage(tabId, { type: 'SAVE_SETTINGS', settings }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout saving settings')), 1000))
    ])

    if (!response?.success) {
      throw new Error(response?.error || 'Failed to save settings')
    }
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  if (!chromeRuntime.isAvailable()) {
    statusHandler.show('Extension context invalid', true)
    return
  }

  elements.init()

  elements.form.addEventListener('submit', async e => {
    e.preventDefault()
    try {
      const settings = formHandler.getFormValues()
      const tabId = await chromeRuntime.queryTabs()
      await contentScript.connect(tabId)
      await contentScript.saveSettings(tabId, settings)
      statusHandler.show('Settings saved successfully!')
    } catch (error) {
      statusHandler.show(`Error: ${error.message}`, true)
    }
  })

  // Add listener for the enable/disable toggle to apply changes immediately
  document.getElementById('enableBiyo').addEventListener('change', async e => {
    try {
      const tabId = await chromeRuntime.queryTabs()
      await contentScript.connect(tabId)
      const currentSettings = await contentScript.getSettings(tabId)

      // Update only the enabled setting
      const updatedSettings = {
        ...currentSettings,
        enabled: e.target.checked
      }

      await contentScript.saveSettings(tabId, updatedSettings)
      statusHandler.show(`Biyo ${e.target.checked ? 'enabled' : 'disabled'} successfully!`)
    } catch (error) {
      statusHandler.show(`Error: ${error.message}`, true)
    }
  })

  // Load initial settings
  try {
    const tabId = await chromeRuntime.queryTabs()
    await contentScript.connect(tabId)
    const settings = await contentScript.getSettings(tabId)
    formHandler.setFormValues(settings)
  } catch (error) {
    statusHandler.show(`Error: ${error.message}`, true)
    formHandler.setFormValues(defaultSettings)
  }
})

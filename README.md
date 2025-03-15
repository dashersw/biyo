# Biyo

<img src="extension/icons/icon128.png" alt="Biyo Logo" />

Biyo is a browser extension for rapid prototyping that allows you to inject Vue.js or React applications into any existing webpage. Inspired by the Chinese idiom 比翼双飞 (bǐ yì shuāng fēi), meaning "to soar together as one," Biyo enables developers to seamlessly extend web applications with modern frameworks—without altering the original codebase.

## Key Benefits

- **Rapid Prototyping**: Test new features directly in production environments without deployment
- **Framework Freedom**: Use Vue or React regardless of the target site's technology stack
- **Non-Invasive**: Add functionality without modifying the original application's code
- **Instant Feedback**: See your changes immediately with hot module replacement
- **Production Testing**: Validate ideas in the actual user interface before full implementation

## Installation

1. Clone this repository
2. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

## Usage

1. Have your Vue or React app running with Vite (typically at `http://localhost:5173`)
2. Click the Biyo icon in your browser toolbar
3. Configure the injection:
   - **Enable/Disable Toggle**: Quickly enable or disable the injection without removing the extension
   - **Target Element**: CSS selector for where to inject (e.g., `#sidebar`, `.content`)
   - **Mount Strategy**: How to inject your app:
     - `before`: Insert before the target
     - `append`: Add to the end of target
     - `prepend`: Add to the beginning of target
     - `replace`: Replace target's contents
   - **Vite URL**: Where your app is served (default: `http://localhost:5173`)
4. Click "Save" and your app will be injected!

> **Auto-Injection**: Once configured, Biyo will automatically inject your app whenever you visit a page where the target element exists, as long as the extension is active and your Vite server is running. No need to click the icon each time!

> **Quick Toggle**: You can quickly enable or disable Biyo injection using the toggle switch without losing your settings. Changes to the toggle take effect immediately.

## Framework Detection and Required Mounting Methods

Biyo automatically detects whether you're using Vue or React, but **requires specific mounting functions** in your application:

### For Vue Apps (in main.js)

```javascript
// Export a mountVueApp function that accepts a container element
window.mountVueApp = element => {
  const app = createApp(App)
  app.mount(element)
  return app
}
```

### For React Apps (in main.jsx)

```javascript
// Export a mountReactApp function that accepts a container element
window.mountReactApp = container => {
  const root = ReactDOM.createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  return root
}
```

> **Important**: These specific mounting functions are required for Biyo to work properly. They allow the extension to control where and when your app is mounted, and to clean it up properly when needed.

## Development Tips

- Use scoped styles and prefix your CSS classes to avoid conflicts
- Use explicit colors and styles to ensure consistency
- The extension preserves the host page's styles
- For Vue apps, use the class prefix `biyo-`
- For React apps, use the class prefix `biyo-react-`

## Try the Example Apps

We've included simple counter apps for both Vue and React to demonstrate how Biyo works:

### Vue Example

```bash
cd example
npm install
npm run dev
```

### React Example

```bash
cd example-react
npm install
npm run dev
```

Now you can use Biyo to inject either example app anywhere!

## License

MIT License

Copyright (c) 2025 Armagan Amcalar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

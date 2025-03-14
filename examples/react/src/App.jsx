import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="biyo-react-app">
      <h2 className="biyo-react-title">Biyo React Counter</h2>
      <div className="biyo-react-counter">
        <button type="button" className="biyo-react-button" onClick={() => setCount(count => count - 1)}>
          -
        </button>
        <span className="biyo-react-count">{count}</span>
        <button type="button" className="biyo-react-button" onClick={() => setCount(count => count + 1)}>
          +
        </button>
      </div>
    </div>
  )
}

export default App

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Gatekeeper from './components/Gatekeeper.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Gatekeeper>
            <App />
        </Gatekeeper>
    </React.StrictMode>,
)

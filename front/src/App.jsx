import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import RegistroOrg from './views/organizacion/registroOrg.jsx'

function App() {
  return (
    <>
      <nav>
        <Link to="/organizaciones/registrar">Registrar organización</Link>
      </nav>
      <Routes>
        <Route path="/organizaciones/registrar" element={<RegistroOrg />} />
      </Routes>
    </>
  )
}

export default App

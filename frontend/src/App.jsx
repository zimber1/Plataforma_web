import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes'
import SessionManagerModal from './components/Common/SessionManagerModal'
import NetworkStatusAlert from './components/Common/NetworkStatusAlert'

function App() {
  return (
    <AuthProvider>
      <SessionManagerModal />
      <NetworkStatusAlert />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

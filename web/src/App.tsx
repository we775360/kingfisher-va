import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import AdminRoute from './components/AdminRoute'
import Flights from './pages/Flights'
import PIREP from './pages/PIREP'
import Logbook from './pages/Logbook'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import Awards from './pages/Awards'
import Statistics from './pages/Statistics'
import Roster from './pages/Roster'
import Events from './pages/Events'
import RoutesPage from './pages/RoutesPage'
import Community from './pages/Community'
import ATCVSO from './pages/ATCVSO'
import SettingsPage from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/flights" element={<Flights />} />
      <Route path="/pirep" element={<PIREP />} />
      <Route path="/logbook" element={<Logbook />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/awards" element={<Awards />} />
      <Route path="/stats" element={<Statistics />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/events" element={<Events />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/forums" element={<Community />} />
      <Route path="/atc" element={<ATCVSO />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/admin/*" element={
        <AdminRoute>
          <Admin />
        </AdminRoute>
      } />
    </Routes>
  )
}

export default App
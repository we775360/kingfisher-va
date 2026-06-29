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
import ATCLogin from './pages/ATCLogin'
import ATCDashboard from './pages/ATCDashboard'
import ATCRoute from './components/ATCRoute'
import RealisticFlights from './pages/RealisticFlights'
import SettingsPage from './pages/Settings'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Handbook from './pages/Handbook'
import LiveMap from './pages/LiveMap'
import FSACARS from './pages/FSACARS'
import BookingInfo from './pages/BookingInfo'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/handbook" element={<Handbook />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/live-map" element={<LiveMap />} />
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
      <Route path="/atc/login" element={<ATCLogin />} />
      <Route path="/fsacars" element={<FSACARS />} />
      <Route path="/booking/:type/:id" element={<BookingInfo />} />
      <Route path="/atc/dashboard" element={
        <ATCRoute>
          <ATCDashboard />
        </ATCRoute>
      } />
      <Route path="/realistic-flights" element={<RealisticFlights />} />
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
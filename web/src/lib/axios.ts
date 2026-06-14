import axios from 'axios'

const api = axios.create({
  baseURL: window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/v1'
    : 'https://kingfisher-api.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kf_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
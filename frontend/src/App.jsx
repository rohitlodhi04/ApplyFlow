import { useState, useEffect } from 'react'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(localStorage.getItem('access'))
  const [error, setError] = useState('')
  const [applications, setApplications] = useState([])
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [stats, setStats] = useState({ total: 0, by_status: {} })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return

    const fetchApplications = async () => {
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (statusFilter) params.append('status', statusFilter)

        const response = await fetch(
          `http://127.0.0.1:8000/api/applications/?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (response.status === 401) {
          localStorage.removeItem('access')
          setToken(null)
          return
        }
        const data = await response.json()
        setApplications(data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchApplications()
  }, [token, search, statusFilter])
  
  useEffect(() => {
    if (!token) return

    const fetchStats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/applications/stats/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          setStats(await response.json())
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchStats()
  }, [token, applications])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('access', data.access)
        setToken(data.access)
        setPassword('')
      } else {
        setError('Galat username ya password')
      }
    } catch (err) {
      setError('Server se connect nahi ho paya')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (response.ok) {
        setMessage('Account ban gaya! Ab login karo.')
        setPassword('')
        setMode('login')
      } else {
        const data = await response.json()
        setError(Object.values(data).flat()[0])
      }
    } catch (err) {
      console.error(err)
      setError('Server se connect nahi ho paya')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access')
    setToken(null)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://127.0.0.1:8000/api/applications/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ company_name: company, job_role: role }),
      })
      if (response.status === 401) {
        localStorage.removeItem('access')
        setToken(null)
        return
      }
      if (response.ok) {
        const newApp = await response.json()
        setApplications([newApp, ...applications])
        setCompany('')
        setRole('')
      } else {
        console.error('Add failed:', response.status)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/applications/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        localStorage.removeItem('access')
        setToken(null)
        return
      }
      if (response.ok) {
        setApplications(applications.filter((app) => app.id !== id))
      } else {
        console.error('Delete failed:', response.status)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/applications/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.status === 401) {
        localStorage.removeItem('access')
        setToken(null)
        return
      }
      if (response.ok) {
        const updated = await response.json()
        setApplications(
          applications.map((app) => (app.id === id ? updated : app))
        )
      } else {
        console.error('Update failed:', response.status)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (token) {
    return (
      <div>
        <h1>ApplyFlow</h1>
        <button onClick={handleLogout}>Logout</button>
        <p>
          Total: {stats.total} | Applied: {stats.by_status.APPLIED || 0} |
          Interview: {stats.by_status.INTERVIEW || 0} |
          Offer: {stats.by_status.OFFER || 0}
        </p>
        <form onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            type="text"
            placeholder="Job role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
        <input
          type="text"
          placeholder="Search company or role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="WISHLIST">Wishlist</option>
          <option value="APPLIED">Applied</option>
          <option value="ASSESSMENT">Assessment</option>
          <option value="INTERVIEW">Interview</option>
          <option value="OFFER">Offer</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <ul>
          {applications.map((app) => (
            <li key={app.id}>
              {app.company_name} - {app.job_role}
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(app.id, e.target.value)}
              >
                <option value="WISHLIST">Wishlist</option>
                <option value="APPLIED">Applied</option>
                <option value="ASSESSMENT">Assessment</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button onClick={() => handleDelete(app.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div>
      <h1>{mode === 'login' ? 'ApplyFlow Login' : 'Create account'}</h1>
      <form onSubmit={mode === 'login' ? handleSubmit : handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{mode === 'login' ? 'Login' : 'Sign up'}</button>
      </form>
      {message && <p>{message}</p>}
      {error && <p>{error}</p>}
      <button
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setError('')
          setMessage('')
        }}
      >
        {mode === 'login'
          ? 'New here? Create an account'
          : 'Already have an account? Login'}
      </button>
    </div>
  )
}

export default App
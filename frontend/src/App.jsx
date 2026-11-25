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

  useEffect(() => {
    if (!token) return

    const fetchApplications = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/applications/', {
          headers: { Authorization: `Bearer ${token}` },
        })
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
  }, [token])
  
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
      <h1>ApplyFlow Login</h1>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
    </div>
  )
}

export default App
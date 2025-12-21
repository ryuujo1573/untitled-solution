import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS for frontend development
app.use('/*', cors({
  origin: ['http://localhost:3001'], // Qwik dev server
  credentials: true,
}))

// API routes
const api = new Hono()

api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

api.get('/users', (c) => {
  // TODO: Integrate with Ory Kratos
  return c.json({
    data: [
      { id: '1', email: 'alice@campus.edu', student_id: '2021001', department: 'Computer Science' },
      { id: '2', email: 'bob@campus.edu', student_id: '2021002', department: 'Mathematics' },
    ]
  })
})

// Mount API under /api prefix
app.route('/api', api)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Campus Intelligence Admin API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users'
    }
  })
})

export default app

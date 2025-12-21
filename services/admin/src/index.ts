import { Hono } from 'hono'
import { cors } from 'hono/cors'

// API routes
const api = new Hono()

api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

api.get('/users', (c) => {
  // TODO: Integrate with Ory Kratos
  return c.json({
    data: [
      {
        id: '1',
        email: 'alice@campus.edu',
        student_id: '2021001',
        department: 'Computer Science',
      },
      {
        id: '2',
        email: 'bob@campus.edu',
        student_id: '2021002',
        department: 'Mathematics',
      },
    ],
  })
})

const app = new Hono<{
  Bindings: {
    ALLOWED_ORIGINS: string
  }
}>().route('/', api)

// Enable CORS for frontend development
app.use('/*', async (c, next) => {
  const origins = c.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
  const corsMiddleware = cors({
    origin: origins,
    credentials: true,
  })
  return corsMiddleware(c, next)
})

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Campus Intelligence Admin API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
    },
  })
})

export default app

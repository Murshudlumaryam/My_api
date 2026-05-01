require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth');
const pokemonRoutes = require('./routes/pokemon');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Pokemon API is running',
    docs: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      pokemon: '/api/pokemon'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  await mongoose.connect(process.env.DATABASE_URL);
  console.log('MongoDB connected');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Startup error:', error.message);
  process.exit(1);
});

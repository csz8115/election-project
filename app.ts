import express from 'express';
import pkg from 'express';
import dotenv from 'dotenv';
import path from 'path';
import userRoutes from './routes/userRoutes.ts';
// Import routes

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Express + TypeScript Server is running');
});

app.use('/api', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export default app;

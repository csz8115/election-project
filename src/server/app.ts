import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.ts';
import logger from './logger.ts';
import pinoHttp from 'pino-http';

const app = express();

// Middleware setup
app.use(cors({
  origin: 'http://localhost:2999', // Your frontend URL
  credentials: true // Enable cookies with CORS
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Add cookie parser middleware


// Logger middleware
app.use(pinoHttp({ logger }));

// User routes
app.use('/user', userRoutes);

// auth middleware 
// app.use(async (req, res, next) => {
//   // Check if the req is coming from login or register
//   if (req.path === '/user/login' || req.path === '/user/register') {
//     next();
//   }
//   // Check if the user has a session
//   else {
//     const session = await decrypt(req.cookies.user_session);
//     if (session) {
//       res.locals.username = session.username;
//       res.locals.accountType = session.accountType;
//       next();
//     } else {
//       res.status(401).json({ error: 'Unauthorized' });
//     }
//   }
// });

// start the server
app.listen(3000, () => {
  // log the time when the server starts
  console.log('Server started at localhost:3000');
  logger.info(`Server started`);

});

process.on('exit', () => {
  // log the time when the server stops
  logger.info(`Server stopped`);
  logger.flush();
});

export default app;

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.ts';
import adminRoutes from './routes/adminRoutes.ts';
import employeeRoutes from './routes/employeeRoutes.ts';
import officerRoutes from './routes/officerRoutes.ts';
import logger from './utils/logger.ts';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

// Middleware setup
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // Your frontend URL
  credentials: true // Enable cookies with CORS
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser middleware

// // auth middleware 
// app.use(async (req, res, next) => {
//   // Check if the req is coming from login or register
//   if (req.path.includes('login')) {
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

// User routes
app.use('/api/v1/member', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/officer', officerRoutes);
app.use('/api/v1/employee', employeeRoutes);


// Serve React App for all non-API routes
// app.use(express.static(path.join(__dirname, "./dist")));

// ✅ Serve assets correctly
// app.use("/assets", express.static(path.join(__dirname, "./dist/assets")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "./dist", "index.html"));
// });

// start the server
app.listen(3000, () => {
  logger.info(`Server is running on http://localhost:3000`);
});

process.on('exit', () => {
  // log the time when the server stops
  logger.info(`Server stopped`);
});

export default app;

import express from 'express';
import userAuthController from './user/authController.ts';
import userBallotController from './user/ballotController.ts';

const router = express.Router();

router.use(userAuthController);
router.use(userBallotController);

export default router;

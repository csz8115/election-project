import express from 'express';
import employeeBallotController from './employee/ballotController.ts';
import employeeCandidateController from './employee/candidateController.ts';

const router = express.Router();

router.use(employeeBallotController);
router.use(employeeCandidateController);

export default router;

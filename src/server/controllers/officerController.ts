import express from 'express';
import officerCompanyController from './officer/companyController.ts';
import officerBallotController from './officer/ballotController.ts';

const router = express.Router();

router.use(officerCompanyController);
router.use(officerBallotController);

export default router;

import express from 'express';
import adminUserManagementController from './admin/userManagementController.ts';
import adminReportController from './admin/reportController.ts';

const router = express.Router();

router.use(adminUserManagementController);
router.use(adminReportController);

export default router;

import express from 'express';
import { register, login, passwordLogin, getMe, seedTestAccountsHandler, updateProfile, getPublicSettings, getPublicCities, getPublicCategories, updatePassword, updatePushToken, syncVerification } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.post('/register', catchAsync(register));
router.post('/login', catchAsync(login));
router.post('/password-login', catchAsync(passwordLogin));
router.post('/seed-test-accounts', catchAsync(seedTestAccountsHandler));
router.get('/me', protect, catchAsync(getMe));
router.post('/sync-verification', protect, catchAsync(syncVerification));
router.put('/profile', protect, upload.single('avatar'), catchAsync(updateProfile));
router.get('/settings', catchAsync(getPublicSettings));
router.get('/cities', catchAsync(getPublicCities));
router.get('/categories', catchAsync(getPublicCategories));
router.put('/updatepassword', protect, catchAsync(updatePassword));
router.put('/password', protect, catchAsync(updatePassword)); // alias for owner app
router.put('/push-token', protect, catchAsync(updatePushToken));

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import '../config/firebase'; // Ensure Firebase is initialized
import { getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import User, { IUser, UserRole } from '../models/User';

const JWT_SECRET = env.JWT_SECRET || 'aluna-dev-jwt-secret-change-me';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new UnauthorizedError('Not authorized to access this route'));
  }

  // Password-auth JWT (local / Vercel memory-mongo can reseed per instance)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      uid?: string;
      email?: string;
      typ?: string;
      role?: string;
    };
    if (decoded?.typ === 'password' && (decoded.uid || decoded.email)) {
      let user =
        (decoded.uid && (await User.findById(decoded.uid))) ||
        (decoded.email ? await User.findOne({ email: decoded.email }) : null);

      // Serverless in-memory DB: cold instances get a fresh empty DB — reseed then match by email
      if (!user && decoded.email && process.env.USE_MEMORY_MONGO === '1') {
        try {
          const { seedTestAccounts } = await import('../scripts/seedTestAccounts');
          await seedTestAccounts();
          user = await User.findOne({ email: decoded.email });
        } catch (seedErr) {
          console.warn('Auth reseed failed:', (seedErr as Error).message);
        }
      }

      if (!user) {
        return next(new UnauthorizedError('User belonging to this token does not exist'));
      }
      req.user = user;
      return next();
    }
  } catch {
    /* not our JWT — try Firebase */
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);

    // Look for the user by firebaseUid
    let user = await User.findOne({ firebaseUid: decoded.uid });

    // Fallback: lookup by email if firebaseUid is missing (for legacy users)
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email });
      if (user) {
        user.firebaseUid = decoded.uid;
        await user.save();
      }
    }

    if (!user) {
      return next(new UnauthorizedError('User belonging to this token does not exist'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Token is not valid or expired'));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('غير مصرّح'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('ليس لديك صلاحية لهذا الإجراء'));
    }
    next();
  };
};

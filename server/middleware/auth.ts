import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extended Request type to include user
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

function isTokenPayload(value: unknown): value is { userId: string; email: string; role: string } {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['userId'] === 'string' &&
    typeof obj['email'] === 'string' &&
    typeof obj['role'] === 'string'
  );
}

// Types of routes that don't require authentication
const PUBLIC_PATHS = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/jobs', // Public job listings
  '/api/applications/apply', // Public application submission
];

// Check if path is public
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath));
}

// Auth middleware factory
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Skip auth for public paths
  if (isPublicPath(req.path)) {
    next();
    return;
  }

  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No access token provided' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'No access token provided' });
    return;
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isTokenPayload(decoded)) {
      res.status(401).json({ error: 'Invalid or expired access token' });
      return;
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('[auth-middleware] Token verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

// Role-based access control middleware factory
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
}

// Optional auth middleware - doesn't fail if no token
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      next();
      return;
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (isTokenPayload(decoded)) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    } catch {
      // Token invalid but continue without auth
    }
  }
  
  next();
}

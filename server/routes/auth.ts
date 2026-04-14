import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { StringValue } from 'ms';
import { query } from '../lib/db.js';
import { isMemoryDb } from '../lib/runtime.js';

const router = Router();

// User type definition
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: Date;
}

// Token payload
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function isTokenPayload(value: unknown): value is TokenPayload {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['userId'] === 'string' &&
    typeof obj['email'] === 'string' &&
    typeof obj['role'] === 'string'
  );
}

const devUser = (() => {
  const email = process.env.DEV_AUTH_EMAIL || 'mika.sato@northgrid.io';
  const name = process.env.DEV_AUTH_NAME || 'Mika Sato';
  const role = process.env.DEV_AUTH_ROLE || 'Admin';
  const password = process.env.DEV_AUTH_PASSWORD || 'Password123!';
  return {
    id: process.env.DEV_AUTH_ID || '00000000-0000-0000-0000-000000000001',
    email,
    name,
    role,
    passwordHash: bcrypt.hashSync(password, 10),
  };
})();

// POST /api/auth/login - Authenticate user and generate tokens
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    let user: User | null = null;
    if (isMemoryDb) {
      if (email === devUser.email) {
        user = {
          id: devUser.id,
          email: devUser.email,
          name: devUser.name,
          role: devUser.role,
          password: devUser.passwordHash,
          created_at: new Date(),
        };
      }
    } else {
      // Find user by email
      const users = await query<User>(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      user = users[0] ?? null;
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    if (!user.password) {
      res.status(401).json({ error: 'Password auth not configured for this account' });
      return;
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
    const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as StringValue;
    const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue;

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user info and access token
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error('[auth] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken =
      typeof req.cookies?.refreshToken === 'string' ? (req.cookies.refreshToken as string) : undefined;

    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as StringValue;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    if (!isTokenPayload(decoded)) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error('[auth] Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout - Clear refresh token
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user info (protected)
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for access token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No access token provided' });
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      res.status(401).json({ error: 'No access token provided' });
      return;
    }
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

    // Verify access token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isTokenPayload(decoded)) {
      res.status(401).json({ error: 'Invalid access token' });
      return;
    }

    let user: User | null = null;
    if (isMemoryDb) {
      if (decoded.userId === devUser.id) {
        user = {
          id: devUser.id,
          email: devUser.email,
          name: devUser.name,
          role: devUser.role,
          password: devUser.passwordHash,
          created_at: new Date(),
        };
      }
    } else {
      // Get user from database
      const users = await query<User>(
        'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
        [decoded.userId]
      );
      user = users[0] ?? null;
    }
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[auth] Get user error:', error);
    res.status(401).json({ error: 'Invalid access token' });
  }
});

export default router;

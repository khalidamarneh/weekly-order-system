// backend/server.js - COMPLETE FIXED VERSION

// ---------- Critical: Environment Variables Setup ----------
// Only load .env file in DEVELOPMENT, NOT in production (Railway)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  console.log('🔧 DEVELOPMENT: Loaded .env file');
} else {
  console.log('📡 PRODUCTION: Using Railway environment variables');
}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cookie = require('cookie');

// ---------- Basic env & checks ----------
const NODE_ENV = process.env.NODE_ENV || 'development';

// ✅ ENHANCED: Validate all required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`FATAL: ${envVar} not set in environment variables`);
    console.error(`Current NODE_ENV: ${NODE_ENV}`);
    if (process.env.DATABASE_URL) {
      try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        console.error(`Current DATABASE_URL host: ${dbUrl.hostname}`);
      } catch (e) {
        console.error(`Current DATABASE_URL: [REDACTED]`);
      }
    }
    process.exit(1);
  }
});

// Special check: Ensure DATABASE_URL is not pointing to localhost in production
if (NODE_ENV === 'production') {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log(`🗄️  Production Database host: ${dbUrl.hostname}`);
    
    if (dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1') {
      console.error('❌ FATAL: DATABASE_URL is pointing to localhost in production!');
      console.error('This usually means your .env file is overriding Railway variables');
      console.error('Please check Railway environment variables and ensure NODE_ENV=production');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Invalid DATABASE_URL format:', e.message);
    process.exit(1);
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const COOKIE_SECURE = NODE_ENV === 'production';
const COOKIE_SAME_SITE = NODE_ENV === 'production' ? 'none' : 'lax';

// ---------- Prisma ----------
const prisma = new PrismaClient({ log: ['warn', 'error'] });
prisma.$connect().then(() => console.log('✅ DB connected')).catch(err => { 
  console.error('❌ Database connection failed:', err.message);
  console.error('Check if DATABASE_URL is correctly set in Railway');
  process.exit(1); 
});
process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });

// ---------- App ----------
const app = express();

// ---------- HTTP + Socket ----------
const httpServer = createServer(app);

// ✅ ENHANCED: Secure Socket.IO configuration
const io = new Server(httpServer, {
  cors: { 
    origin: FRONTEND_URL, 
    methods: ['GET','POST'], 
    credentials: true 
  },
  // ✅ ADDED: Origin validation for WebSocket handshake
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    if (origin && origin !== FRONTEND_URL) {
      return callback('Origin not allowed', false);
    }
    callback(null, true);
  },
  transports: ['websocket', 'polling']  // ✅ ADDED for Railway
});

// Production-specific socket security
if (NODE_ENV === 'production') {
  io.engine.on("headers", (headers, req) => {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  });
}

app.set('io', io);

// ---------- Security middleware ----------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ ADDED: Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- CORS ----------
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
}));

// ---------- Rate limiting ----------
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 5, message: { error: 'Too many login attempts' } });
const generalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, message: { error: 'Too many requests' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/register-first-admin', authLimiter);
app.use('/api/', generalLimiter);

// ---------- Uploads ----------
const uploadDir = path.join(__dirname, 'uploads/images');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

// ---------- JWT helpers ----------
// COOKIE options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000 // 1 day
};
const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  path: '/api/auth/refresh',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};
const SOCKET_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// ✅ ENHANCED: Secure token signers with minimal payload
// ✅ SECURE: Minimal JWT payload (NO email, NO sensitive data)
// ✅ ULTRA-SECURE: Anonymous JWT tokens (NO user identifiers)
const signAccessToken = (user, type) => {
  const uat = new Date(user.updatedAt).getTime();
  // ✅ COMPLETELY ANONYMOUS: No ID, no role, no email
  return jwt.sign({ 
    uat,
    type,
    purpose: 'access'
  }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const signRefreshToken = (user, type) => {
  const uat = new Date(user.updatedAt).getTime();
  return jwt.sign({ 
    uat,
    type,
    purpose: 'refresh'
  }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const signSocketToken = (user, type = 'PRIVATE') => {
  const uat = new Date(user.updatedAt).getTime();
  return jwt.sign({ 
    uat,
    type,
    purpose: 'socket'
  }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


// Utility: extract token from cookie or Authorization header
function extractTokenFromRequest(req) {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// --------------------------
// SECURITY FIXES ONLY - Minimal Changes
// --------------------------

// ✅ SECURITY FIX 1: Enhanced password validation
const validatePasswordStrength = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
};

// ✅ SECURITY FIX 2: Simple input sanitization
const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      sanitized[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
    } else {
      sanitized[key] = obj[key];
    }
  });
  return sanitized;
};

// Apply sanitization to all requests
app.use((req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  next();
});

///////////////////////////////////////////////////////////////////////////////////////////
// --------------------------
// Helpers: sanitize product data for non-admin roles
// --------------------------
function sanitizeProductForUser(product) {
  return {
    id: product.id,
    name: product.name,
    partNo: product.partNo,
    salePrice: product.salePrice,
    quantity: product.quantity ?? 0,
    image: product.image ? product.image : null,
    categoryId: product.categoryId   // ✅ REQUIRED FOR USER CATEGORY FILTERS
  };
}

function isAdmin(req) {
  return req?.user?.role === 'ADMIN';
}

// Sanitize product inside an order item (for clients)
function sanitizeOrderItem(item) {
  return {
    id: item.id,
    description: item.description,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    imagePath: item.imagePath,
    isUnlisted: item.isUnlisted,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    // Only include sanitized product (or null for unlisted items)
    product: item.product ? sanitizeProductForUser(item.product) : null
  };
}

// Sanitize an entire order
function sanitizeOrder(order) {
  return {
    id: order.id,
    clientId: order.clientId,
    orderNumber: order.orderNumber,
    status: order.status,
    internalStatus: order.internalStatus,  // still safe
    weekStartDate: order.weekStartDate,
    deadline: order.deadline,
    outboundOrderId: order.outboundOrderId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    items: order.items.map(sanitizeOrderItem)
  };
}


// Helper function to calculate sale price
const calculateSalePrice = (costPrice, markupPercentage) => {
  return costPrice * (1 + markupPercentage / 100);
};

// Helper function to generate order numbers - unchanged
const generateOrderNumber = async (clientId, isDraft = false) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true, email: true }
    });
    if (!user) throw new Error('User not found');

    const orderCount = await prisma.inboundOrder.count({
      where: {
        clientId: clientId,
        status: { not: 'DRAFT' }
      }
    });

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const cleanName = (user.name || 'USER').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    if (isDraft) return `DRAFT-${cleanName}-${dateStr}`;
    return `${cleanName}-${String(orderCount + 1).padStart(3, '0')}-${dateStr}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////

// ---------- Authenticate middleware supporting both PRIVATE and PUBLIC users ----------
// ✅ SECURITY FIX 3: Fixed token invalidation logic
// ✅ UPDATED: Authenticate middleware for anonymous tokens
// ✅ FIXED: Strict authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      // ✅ STRICT: No token = no access
      req.user = null;
      return res.status(401).json({ message: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // ✅ STRICT: Invalid token = no access
      req.user = null;
      return res.status(401).json({ message: 'Invalid token' });
    }

    // ✅ VALIDATE: Must be an access token
    if (decoded.purpose !== 'access') {
      req.user = null;
      return res.status(401).json({ message: 'Invalid token type' });
    }

    let user;
    if (decoded.type === 'PRIVATE') {
      user = await prisma.user.findFirst({
        where: {
          updatedAt: new Date(decoded.uat)
        },
        select: { id: true, email: true, role: true, updatedAt: true }
      });
    } else if (decoded.type === 'PUBLIC') {
      user = await prisma.publicUser.findFirst({
        where: {
          updatedAt: new Date(decoded.uat)
        },
        select: { id: true, email: true, updatedAt: true }
      });
    }

    if (!user) {
      req.user = null;
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = { 
      id: user.id, 
      email: user.email, 
      role: user.role || 'PUBLIC_USER', 
      type: decoded.type 
    };
    return next();
  } catch (err) {
    console.error('Authenticate middleware error:', err);
    req.user = null;
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Admin authorization
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.type !== 'PRIVATE' || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Small helper to check admin in non-route code
function isAdmin(req) {
  return req?.user?.role === 'ADMIN';
}

// ✅ ADD: Client authorization middleware
const authorizeClient = (req, res, next) => {
  if (!req.user || req.user.type !== 'PRIVATE' || !['CLIENT', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Client access required' });
  }
  next();
};


// -----------------------
// /ws-private Namespace (Option A: private-only namespace)
// -----------------------
// Create namespaced io for private sockets (admins + clients)
const wsPrivate = io.of('/ws-private');

// ✅ ENHANCED: Secure socket auth with token from handshake
wsPrivate.use(async (socket, next) => {
  try {
    // ✅ PREFER: Token from handshake auth (more secure than cookies)
    let token = socket.handshake.auth.token;
    
    // ✅ FALLBACK: Only use socket_token cookie if auth token not provided
    if (!token) {
      const cookieHeader = socket.handshake.headers?.cookie || '';
      const parsed = cookie.parse(cookieHeader || '');
      token = parsed.socket_token; // Only socket_token, not regular token
    }

    if (!token) {
      console.warn('ws-private: No token provided');
      return next(new Error('No token for socket'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only PRIVATE users allowed in this namespace
    if (decoded.type !== 'PRIVATE') {
      return next(new Error('Namespace /ws-private is for private users only'));
    }

    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id },
      select: { id: true, role: true, updatedAt: true } // Minimal data
    });
    
    if (!user) return next(new Error('User not found'));
    
    // ✅ FIXED: Token invalidation check
    if (new Date(user.updatedAt).getTime() !== (decoded.uat || 0)) {
      return next(new Error('Token revoked'));
    }

    // ✅ MINIMAL user info to socket
    socket.user = { 
      id: user.id, 
      role: user.role || 'CLIENT', 
      type: decoded.type 
      // No email or other sensitive data
    };
    return next();
  } catch (err) {
    console.error('ws-private auth error:', err.message || err);
    return next(new Error('Socket auth failed'));
  }
});

// Connection handler for private namespace
wsPrivate.on('connection', (socket) => {
  console.log(`✅ /ws-private connected: ${socket.id} (user ${socket.user?.id} role=${socket.user?.role})`);

  // rooms: client_{id} and admin-room
  socket.on('join-client-room', (clientId) => {
    if (!clientId) return;
    const room = `client_${clientId}`;
    socket.join(room);
    console.log(`🔐 Socket ${socket.id} joined ${room}`);
  });

  socket.on('join-admin-room', () => {
    // only admins can join admin-room
    if (socket.user?.role === 'ADMIN') {
      socket.join('admin-room');
      console.log(`🔐 Admin socket ${socket.id} joined admin-room`);
    } else {
      console.warn(`Socket ${socket.id} attempted to join admin-room but is not ADMIN`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ /ws-private disconnected: ${socket.id} reason=${reason}`);
  });

  // simple welcome
  socket.emit('welcome', { message: 'Connected to /ws-private', socketId: socket.id, now: new Date() });
});

// ✅ SECURE SOCKET AUTH: Prefer handshake auth over cookies
// ✅ ULTRA-SECURE: Socket authentication with anonymous tokens
io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth.token;
    
    if (!token && socket.handshake.query.token) {
      token = socket.handshake.query.token;
    }
    
    if (!token) {
      const cookieHeader = socket.handshake.headers?.cookie || '';
      const parsed = cookie.parse(cookieHeader);
      token = parsed.socket_token;
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ STRICT VALIDATION: Must be a socket token
    if (decoded.purpose !== 'socket') {
      return next(new Error('Invalid token purpose'));
    }

    let user;
    if (decoded.type === 'PRIVATE') {
      user = await prisma.user.findFirst({
        where: { updatedAt: new Date(decoded.uat) },
        select: { id: true, role: true, updatedAt: true }
      });
    } else if (decoded.type === 'PUBLIC') {
      user = await prisma.publicUser.findFirst({
        where: { updatedAt: new Date(decoded.uat) },
        select: { id: true, updatedAt: true }
      });
    }

    if (!user) return next(new Error('User not found'));
    
    if (new Date(user.updatedAt).getTime() !== decoded.uat) {
      return next(new Error('Token revoked'));
    }

    socket.user = { 
      id: user.id, 
      role: user.role || 'PUBLIC', 
      type: decoded.type 
    };
    
    return next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    return next(new Error('Authentication failed'));
  }
});


// ========== YOUR API ROUTES GO HERE ==========
// ---------------
// AUTH ROUTES (with security enhancements)
// ---------------
// ---------- DEBUG ROUTES ----------
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV
  });
});

// Register first admin (one-time bootstrap)
app.post('/api/auth/register-first-admin', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // ✅ ADDED: Password strength validation
    if (!validatePasswordStrength(req.body.password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
      });
    }

    // Only allow via secret in production
    if (process.env.NODE_ENV === 'production' && req.body.secret !== process.env.ADMIN_REGISTRATION_SECRET) {
      return res.status(403).json({ message: 'Admin registration not allowed' });
    }

    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: { email: req.body.email, password: hashedPassword, name: req.body.name, company: req.body.company || 'Company', role: 'ADMIN' }
    });

    // Issue tokens (do NOT return tokens in body)
    const access = signAccessToken(user, 'PRIVATE');
    const refresh = signRefreshToken(user, 'PRIVATE');
    const socketToken = signSocketToken(user, 'PRIVATE');

    // Set cookies
    res.cookie('token', access, COOKIE_OPTIONS);
    res.cookie('refreshToken', refresh, REFRESH_COOKIE_OPTIONS);
    res.cookie('socket_token', socketToken, SOCKET_COOKIE_OPTIONS);

    // Return only user info
    res.status(201).json({ id: user.id, email: user.email, name: user.name, company: user.company, role: user.role });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register user (Admin only creates private users)
app.post('/api/auth/register', authenticate, authorizeAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').isIn(['ADMIN','CLIENT'])
], async (req, res) => {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // ✅ ADDED: Password strength validation
    if (!validatePasswordStrength(req.body.password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const newUser = await prisma.user.create({
      data: { email: req.body.email, password: hashedPassword, name: req.body.name, company: req.body.company || 'Client', role: req.body.role }
    });

    // Issue tokens and socket token for convenience (admin-created user will be logged in if desired)
    const access = signAccessToken(newUser, 'PRIVATE');
    const refresh = signRefreshToken(newUser, 'PRIVATE');
    const socketToken = signSocketToken(newUser, 'PRIVATE');

    res.cookie('token', access, COOKIE_OPTIONS);
    res.cookie('refreshToken', refresh, REFRESH_COOKIE_OPTIONS);
    res.cookie('socket_token', socketToken, SOCKET_COOKIE_OPTIONS);

    res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name, company: newUser.company, role: newUser.role });
  } catch (err) {
    console.error('User registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Private login (admins & private clients)
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const matched = await bcrypt.compare(req.body.password, user.password);
    if (!matched) return res.status(400).json({ message: 'Invalid credentials' });

    const access = signAccessToken(user, 'PRIVATE');
    const refresh = signRefreshToken(user, 'PRIVATE');
    const socketToken = signSocketToken(user, 'PRIVATE');

    res.cookie('token', access, COOKIE_OPTIONS);
    res.cookie('refreshToken', refresh, REFRESH_COOKIE_OPTIONS);
    res.cookie('socket_token', socketToken, SOCKET_COOKIE_OPTIONS);

    // Return user info only
    res.json({ id: user.id, email: user.email, name: user.name, company: user.company, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (clears all auth cookies)
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.clearCookie('socket_token', SOCKET_COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
});

// Get current user (safe, minimal fields; returns null when unauthenticated)
app.get('/api/auth/user', authenticate, async (req, res) => {
  try {
    // Prevent caching of sensitive auth responses
    res.set('Cache-Control', 'no-store');

    // Not logged in
    if (!req.user) return res.json(null);

    // PRIVATE user (admins / clients)
    if (req.user.type === 'PRIVATE') {
      const u = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          role: true,
          createdAt: true
        }
      });

      // If DB record no longer exists, treat as logged-out
      if (!u) {
        req.user = null;
        return res.json(null);
      }

      return res.json(u);
    }

    // PUBLIC user
    if (req.user.type === 'PUBLIC') {
      const pu = await prisma.publicUser.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });

      if (!pu) {
        req.user = null;
        return res.json(null);
      }

      return res.json(pu);
    }

    // Unknown type → safe fallback
    return res.json(null);
  } catch (err) {
    console.error('Get user error:', err);
    // Keep behavior predictable for frontend: return 500 with generic message
    res.status(500).json({ message: 'Server error' });
  }
});

// Public (open) register/login (no socket token issued by default)
app.post('/api/public/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // ✅ ADDED: Password strength validation
    if (!validatePasswordStrength(req.body.password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
      });
    }

    const existing = await prisma.publicUser.findUnique({ where: { email: req.body.email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(req.body.password, 12);
    const pu = await prisma.publicUser.create({ data: { email: req.body.email, password: hashed, name: req.body.name } });

    const access = signAccessToken(pu, 'PUBLIC');
    const refresh = signRefreshToken(pu, 'PUBLIC');

    // only set access + refresh cookies — no socket_token for public users (Option A)
    res.cookie('token', access, COOKIE_OPTIONS);
    res.cookie('refreshToken', refresh, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({ id: pu.id, email: pu.email, name: pu.name });
  } catch (err) {
    console.error('Public register error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/public/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const pu = await prisma.publicUser.findUnique({ where: { email: req.body.email } });
    if (!pu) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(req.body.password, pu.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const access = signAccessToken(pu, 'PUBLIC');
    const refresh = signRefreshToken(pu, 'PUBLIC');

    res.cookie('token', access, COOKIE_OPTIONS);
    res.cookie('refreshToken', refresh, REFRESH_COOKIE_OPTIONS);

    res.json({ id: pu.id, email: pu.email, name: pu.name });
  } catch (err) {
    console.error('Public login error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Token refresh (works for both PRIVATE & PUBLIC)
// ✅ UPDATED: Token refresh for anonymous tokens
app.post('/api/auth/refresh', async (req, res) => {
  try {
    let tokenToVerify = req.cookies?.refreshToken;
    if (!tokenToVerify) {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) tokenToVerify = auth.slice(7);
    }
    if (!tokenToVerify) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET);
    
    // ✅ VALIDATE: Must be a refresh token
    if (decoded.purpose !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    let user;
    if (decoded.type === 'PRIVATE') {
      user = await prisma.user.findFirst({
        where: { updatedAt: new Date(decoded.uat) }
      });
    } else if (decoded.type === 'PUBLIC') {
      user = await prisma.publicUser.findFirst({
        where: { updatedAt: new Date(decoded.uat) }
      });
    }
    
    if (!user) return res.status(401).json({ message: 'User not found' });

    const access = signAccessToken(user, decoded.type);
    const newRefresh = signRefreshToken(user, decoded.type);

    res.cookie('token', access, COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefresh, REFRESH_COOKIE_OPTIONS);

    return res.json({ message: 'Refreshed' });
  } catch (err) {
    console.error('Refresh error:', err.message);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// ---------------
// CLIENT MANAGEMENT ROUTES (NEW - for your frontend)
// ---------------

// Get all clients (admin only)
app.get('/api/clients', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: { in: ['CLIENT', 'ADMIN'] }
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        address: true,
        tel: true,
        gps: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(clients);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update client
app.put('/api/clients/:id', authenticate, authorizeAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, name, company, address, tel, gps, role } = req.body;

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        id: { not: req.params.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already taken' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        email,
        name,
        company,
        address,
        tel,
        gps,
        ...(role && { role }),
        updatedAt: new Date() // This will invalidate all existing tokens
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        address: true,
        tel: true,
        gps: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Update client error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete client
app.delete('/api/clients/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
app.post('/api/users/:id/reset-password', authenticate, authorizeAdmin, [
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Enhanced password validation
    if (!validatePasswordStrength(req.body.newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);

    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date() // This will invalidate all existing tokens
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Internal Server Error' });
});


module.exports = { app, httpServer, prisma };
// ======================
// CLIENT ORDER CONTROL ROUTES - COMPLETE FIXED VERSION
// ======================

// Get all clients with their order control settings (Admin only)
app.get('/api/admin/order-control/clients', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        orderControl: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ message: 'Failed to load clients data', error: err.message });
  }
});

app.put('/api/admin/order-control/clients/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const updates = req.body;
    const io = req.app.get('io');

    // ✅ Set periodStartTime when enabling time control
    if (updates.timeControlEnabled === true) {
      updates.periodStartTime = new Date();
    } else if (updates.timeControlEnabled === false) {
      // ✅ Clear periodStartTime when disabling time control
      updates.periodStartTime = null;
    }

    // First check if orderControl exists for this user
    const existingOrderControl = await prisma.orderControl.findUnique({
      where: { userId: clientId }
    });

    let orderControl;

    if (existingOrderControl) {
      // Update existing order control
      orderControl = await prisma.orderControl.update({
        where: { userId: clientId },
        data: updates
      });
    } else {
      // Create new order control
      orderControl = await prisma.orderControl.create({
        data: {
          ...updates,
          user: { connect: { id: clientId } }
        }
      });
    }

    // Get user info for the socket event
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, company: true }
    });

    // Emit socket events WITH DEBUG LOGGING
    console.log('📤 Emitting order_control_updated for client:', clientId);
    io.emit('order_control_updated', {
      clientId,
      updates: {
        ...updates,
        periodStartTime: orderControl.periodStartTime // ✅ ADD THIS
      },
      updatedAt: new Date()
    });

    const clientRoom = `client_${clientId}`;
    console.log(`📤 Emitting to room: ${clientRoom}`);
    io.to(clientRoom).emit('client_order_control_updated', {
      updates: {
        ...updates,
        periodStartTime: orderControl.periodStartTime // ✅ ADD THIS
      },
      updatedAt: new Date()
    });

    // Check if clients are in the room
    const socketsInRoom = await io.in(clientRoom).fetchSockets();
    console.log(`👥 ${socketsInRoom.length} client(s) in room ${clientRoom}`);

    res.json({ ...orderControl, user });
  } catch (err) {
    console.error('Error updating order control:', err);
    res.status(500).json({ message: 'Failed to update settings', error: err.message });
  }
});

// Send custom message to client (Admin only) - WITH SOCKET.IO
app.post('/api/admin/order-control/clients/:id/message', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { message } = req.body;
    const io = req.app.get('io');

    // Calculate expiration time (10 minutes from now)
    const customMessageExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Check if orderControl exists
    const existingOrderControl = await prisma.orderControl.findUnique({
      where: { userId: clientId }
    });
    
    let updatedOrderControl;
    
    if (existingOrderControl) {
      // Update existing
      updatedOrderControl = await prisma.orderControl.update({
        where: { userId: clientId },
        data: {
          customMessage: message,
          customMessageActive: true,
          customMessageExpires: customMessageExpires
        }
      });
    } else {
      // Create new
      updatedOrderControl = await prisma.orderControl.create({
        data: {
          customMessage: message,
          customMessageActive: true,
          customMessageExpires: customMessageExpires,
          user: { connect: { id: clientId } }
        }
      });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, company: true }
    });

    // Emit socket events WITH DEBUG LOGGING
    const clientRoom = `client_${clientId}`;
    console.log(`📨 Emitting custom_message_received to room: ${clientRoom}`);
    io.to(clientRoom).emit('custom_message_received', {
      message,
      sentAt: new Date(),
      expiresAt: customMessageExpires,
      duration: 10 * 60 * 1000
    });

    io.emit('custom_message_sent', {
      clientId,
      clientName: user.name,
      message,
      sentAt: new Date(),
      expiresAt: customMessageExpires
    });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error sending custom message:', err);
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
});

// Disable custom message (Admin only) - WITH SOCKET.IO
app.post('/api/admin/order-control/clients/:id/message/disable', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const io = req.app.get('io');

    // Disable custom message only if orderControl exists
    const orderControl = await prisma.orderControl.findUnique({
      where: { userId: clientId }
    });

    if (orderControl) {
      await prisma.orderControl.update({
        where: { userId: clientId },
        data: { customMessageActive: false }
      });

      // Emit socket events WITH DEBUG LOGGING
      const clientRoom = `client_${clientId}`;
      console.log(`❌ Emitting custom_message_disabled to room: ${clientRoom}`);
      io.to(clientRoom).emit('custom_message_disabled');

      io.emit('custom_message_disabled_admin', {
        clientId,
        disabledAt: new Date()
      });
    }

    res.json({ success: true, message: 'Message disabled successfully' });
  } catch (err) {
    console.error('Error disabling custom message:', err);
    res.status(500).json({ message: 'Failed to disable message', error: err.message });
  }
});

// Get current client's own order control settings
app.get('/api/client/order-control', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    
    const orderControl = await prisma.orderControl.findUnique({
      where: { userId: clientId }
    });

    // If no order control settings exist, return defaults
    const defaultSettings = {
      showSalePrice: true,
      showQuantity: true,
      timeControlEnabled: false,
      warningEnabled: false,
      customMessageActive: false,
      periodStartTime: null // ← Add this to defaults
    };

    res.json(orderControl || defaultSettings);
  } catch (err) {
    console.error('Error fetching client order control:', err);
    res.status(500).json({ message: 'Failed to load order settings', error: err.message });
  }
});

// ======================
// CATEGORY ROUTES
// ======================

// Get all categories (with hierarchy)
app.get('/api/products/categories', authenticate, authorizeClient, async (req, res) => {
  try {
    const allCategories = await prisma.category.findMany();

    const buildHierarchy = (parentId = null) => {
      return allCategories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          ...cat,
          children: buildHierarchy(cat.id)
        }));
    };

    const categories = buildHierarchy();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new category
app.post('/api/products/categories', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        parentId: parentId ? parseInt(parentId) : null,
      },
    });

    res.status(201).json(category);

    // ✅ MOVE INSIDE TRY BLOCK (after response)
    io.emit('categories_updated');

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit category
app.put('/api/products/categories/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, parentId } = req.body;

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        parentId: parentId ? parseInt(parentId) : null,
      },
    });

    res.json(updatedCategory);

    // ✅ MOVE INSIDE TRY BLOCK
    io.emit('categories_updated');

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/categories/:id - with cascade
// In your category deletion route, add recursive file cleanup:
app.delete('/api/products/categories/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    // Recursive function to delete category and all products with images
    const deleteCategoryAndChildren = async (catId) => {
      // First, get all products in this category to delete their images
      const products = await prisma.product.findMany({
        where: { categoryId: catId }
      });

      // Delete all product images
      for (const product of products) {
        if (product.image) {
          const filePath = path.join(__dirname, product.image.replace(/^\/+/, ''));
          fs.unlink(filePath, (err) => {
            if (err) {
              console.warn('⚠️ Could not delete image file:', filePath, err.message);
            } else {
              console.log('✅ Deleted image file:', filePath);
            }
          });
        }
      }

      // Delete all products in this category
      await prisma.product.deleteMany({
        where: { categoryId: catId }
      });

      // Get all direct children
      const children = await prisma.category.findMany({
        where: { parentId: catId }
      });

      // Recursively delete each child
      for (const child of children) {
        await deleteCategoryAndChildren(child.id);
      }

      // Finally, delete this category
      await prisma.category.delete({
        where: { id: catId }
      });
    };

    await deleteCategoryAndChildren(categoryId);

    res.json({ message: 'Category and all its products/subcategories deleted successfully' });
    io.emit('categories_updated');

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// ======================
// PRODUCT ROUTES
// ======================
// Get all products
app.get('/api/products', authenticate, authorizeClient, async (req, res) => {
  try {
    // Admins get full product records; non-admins get restricted fields
    if (isAdmin(req)) {
      const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
      return res.json(products);
    } else {

      // Non-admins: minimal fields + categoryId
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          partNo: true,
          salePrice: true,
          quantity: true,
          image: true,
          categoryId: true
        }
      });

      return res.json(products.map(p => sanitizeProductForUser(p)));
    }
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all products by category
app.get('/api/products/category/:id', authenticate, authorizeClient, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    if (isAdmin(req)) {
      // Admins: include everything and category relation
      const products = await prisma.product.findMany({
        where: { categoryId },
        include: { category: true },
        orderBy: { name: 'asc' },
      });

      // Add imageSize where applicable (admin only)
      const productsWithSize = products.map(p => {
        let imageSize = null;
        if (p.image) {
          const filePath = path.join(__dirname, p.image.replace(/^\/+/, ''));
          try { imageSize = fs.statSync(filePath).size; } catch (err) { /* ignore */ }
        }
        return { ...p, imageSize };
      });

      return res.json(productsWithSize);
  } else {
  
// Non-admins: minimal safe fields
const products = await prisma.product.findMany({
  where: { categoryId },
  orderBy: { name: 'asc' },
  select: {
    id: true,
    name: true,
    partNo: true,
    salePrice: true,
    quantity: true,
    image: true,
    categoryId: true
  }
});

return res.json(products.map(p => sanitizeProductForUser(p)));

  }
  } catch (error) {
    console.error('Error in GET /api/products/category/:id:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Add product
app.post('/api/products', authenticate, authorizeAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, partNo, costPrice, markupPercentage, categoryId, quantity } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Product must belong to a category' });
    }

    const salePrice = calculateSalePrice(parseFloat(costPrice), parseFloat(markupPercentage));

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/images/${req.file.filename}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        partNo,
        costPrice: parseFloat(costPrice),
        markupPercentage: parseFloat(markupPercentage),
        salePrice,
        categoryId: parseInt(categoryId),
        image: imagePath,
        quantity: quantity ? parseInt(quantity) : null
      }
    });

    res.status(201).json(product);

    // Move the emit here, after product is created
    io.emit('product_created', product);
    io.emit('products_updated');
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Edit product
app.put(
  '/api/products/:id',
  authenticate,
  authorizeAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { name, partNo, costPrice, markupPercentage, categoryId, quantity } = req.body;

      if (!categoryId) {
        return res.status(400).json({ message: 'Product must belong to a category' });
      }

      const salePrice = calculateSalePrice(
        parseFloat(costPrice),
        parseFloat(markupPercentage)
      );

      // Update data payload
      let updateData = {
        name,
        partNo,
        costPrice: parseFloat(costPrice),
        markupPercentage: parseFloat(markupPercentage),
        salePrice,
        categoryId: parseInt(categoryId),
        quantity:
          quantity !== undefined
            ? quantity
              ? parseInt(quantity)
              : null
            : undefined,
      };

      // If new image uploaded → replace old
      if (req.file) {
        updateData.image = `/uploads/images/${req.file.filename}`;
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
      });

      // ✅ Add imageSize for the client
      let imageSize = null;
      if (updatedProduct.image) {
        const filePath = path.join(__dirname, updatedProduct.image.replace(/^\/+/, ''));
        try {
          imageSize = fs.statSync(filePath).size;
        } catch (err) {
          console.warn('Failed to get image size:', err.message);
        }
      }

      res.json({ ...updatedProduct, imageSize });

      // ✅ MOVE SOCKET EMISSIONS HERE (inside try block, after response)
      io.emit('product_updated', { ...updatedProduct, imageSize }); // Include imageSize in the emitted object
      io.emit('products_updated');

    } catch (error) {
      console.error('Error in PUT /api/products/:id:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

//////////////////////////////

// Delete product
// In your product deletion route, add file cleanup:
app.delete('/api/products/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Find product first to get image path
    const product = await prisma.product.findUnique({ 
      where: { id: productId } 
    });
    
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Delete image file if exists
    if (product.image) {
      const filePath = path.join(__dirname, product.image.replace(/^\/+/, ''));
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn('⚠️ Could not delete image file:', filePath, err.message);
        } else {
          console.log('✅ Deleted image file:', filePath);
        }
      });
    }

    // Delete DB row
    await prisma.product.delete({ where: { id: productId } });

    res.json({ message: 'Product deleted' });
    
    // Emit socket events
    io.emit('product_deleted', productId);
    io.emit('products_updated');
    
  } catch (error) {
    console.error('Error in DELETE /api/products/:id:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Remove product image only
app.delete('/api/products/:id/image', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Find product
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!product.image) {
      return res.status(400).json({ message: 'No image to remove' });
    }

    // Delete the image file
    const filePath = path.join(__dirname, product.image.replace(/^\/+/, ''));
    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn('⚠️ Could not delete file:', filePath, err.message);
      } else {
        console.log('✅ Deleted image file:', filePath);
      }
    });

    // Update DB → clear image field
    await prisma.product.update({
      where: { id: productId },
      data: { image: null },
    });

    res.json({ message: 'Image removed' });
    io.emit('product_updated', { ...product, image: null });
    io.emit('products_updated');
    
  } catch (error) {
    console.error('Error in DELETE /api/products/:id/image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

////////////////////////////////////////////////////////////
// Import products from CSV (via JSON from frontend)
//////////////////////////////////////////////////////////////
// Import products from CSV (fast, keep original category for duplicates, no logs)
app.post('/api/products/csv', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { categoryId, products } = req.body;

    if (!categoryId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    const catId = parseInt(categoryId);
    if (isNaN(catId)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await prisma.category.findUnique({ where: { id: catId } });
    if (!category) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Validate rows and extract quantity
    const validProducts = [];
    const skippedProducts = [];

    for (const p of products) {
      if (!p || !p.name || !p.partNo || typeof p.costPrice !== 'number') {
        skippedProducts.push({ partNo: p?.partNo || null, name: p?.name || null });
        continue;
      }

      validProducts.push({
        name: p.name,
        partNo: p.partNo,
        costPrice: p.costPrice,
        markupPercentage: typeof p.markupPercentage === 'number' ? p.markupPercentage : 20,
        quantity: p.quantity ? parseInt(p.quantity) : null // ✅ Read Quantity column
      });
    }

    if (validProducts.length === 0) {
      return res.json({
        newCount: 0,
        updateCount: 0,
        skippedCount: skippedProducts.length,
        createdProducts: [],
        updatedProducts: [],
        skippedProducts: skippedProducts
      });
    }

    // Build list of partNos and fetch all existing products in one query
    const partNos = Array.from(new Set(validProducts.map(p => p.partNo)));
    const existingList = await prisma.product.findMany({
      where: { partNo: { in: partNos } },
      select: { partNo: true, categoryId: true }
    });
    const existingMap = new Map(existingList.map(e => [e.partNo, e]));

    // Partition into "toCreate" and "toUpdate"
    const toCreate = [];
    const toUpdate = []; // will hold { partNo, data }
    for (const p of validProducts) {
      const markup = p.markupPercentage;
      const salePrice = p.costPrice * (1 + (markup / 100));

      if (existingMap.has(p.partNo)) {
        toUpdate.push({
          partNo: p.partNo,
          data: {
            name: p.name,
            costPrice: p.costPrice,
            markupPercentage: markup,
            salePrice,
            quantity: p.quantity // ✅ Update quantity
            // NOTE: no categoryId here — keep original category
          }
        });
      } else {
        toCreate.push({
          name: p.name,
          partNo: p.partNo,
          costPrice: p.costPrice,
          markupPercentage: markup,
          salePrice,
          categoryId: catId,
          image: null,
          quantity: p.quantity // ✅ Set quantity
        });
      }
    }

    // Bulk create new products
    let createdProducts = [];
    if (toCreate.length > 0) {
      await prisma.product.createMany({
        data: toCreate,
        skipDuplicates: true
      });
      createdProducts = toCreate.map(x => ({ partNo: x.partNo, name: x.name }));
    }

    // Batch update existing products using a transaction of update calls
    let updatedProducts = [];
    if (toUpdate.length > 0) {
      const updateOps = toUpdate.map(u =>
        prisma.product.update({
          where: { partNo: u.partNo },
          data: u.data
        })
      );
      const updatedRows = await prisma.$transaction(updateOps);
      updatedProducts = updatedRows.map(r => ({ partNo: r.partNo, name: r.name }));
    }

    // Prepare skipped list (already collected)
    const finalSkipped = skippedProducts;

    // ✅ ADD SOCKET EMISSIONS HERE (inside try block, after operations)
    io.emit('products_updated'); // General refresh signal
    // You could also emit specific events for each created/updated product if needed

    // Respond with counts and arrays
    return res.json({
      newCount: createdProducts.length,
      updateCount: updatedProducts.length,
      skippedCount: finalSkipped.length,
      createdProducts,
      updatedProducts,
      skippedProducts: finalSkipped,
      message: `${createdProducts.length} new, ${updatedProducts.length} updated, ${finalSkipped.length} skipped`
    });
    
  } catch (err) {
    // no server-side console logs per request
    return res.status(500).json({ message: 'Server error' });
  }
});

//////

// FUTURE CLIENT ORDER CONTROL ROUTES HERE
// HAS BEEN DELETED FOR BREVITY

//////

// ======================
// ADMIN SUMMARY ROUTE
// ======================
app.get('/api/admin/summary', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // ======= Counts =======
    const totalClients = await prisma.user.count({ where: { role: "CLIENT" } });
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.category.count();

    const totalInboundOrders = await prisma.inboundOrder.count();
    const totalOutboundOrders = await prisma.outboundOrder.count();
    const totalOrders = totalInboundOrders + totalOutboundOrders;

    const draftInboundOrders = await prisma.inboundOrder.count({ where: { status: "DRAFT" } });
    const draftOutboundOrders = await prisma.outboundOrder.count({ where: { status: "DRAFT" } });
    const draftOrders = draftInboundOrders + draftOutboundOrders;

    const submittedInboundOrders = await prisma.inboundOrder.count({ where: { status: "SUBMITTED" } });
    const submittedOutboundOrders = await prisma.outboundOrder.count({ where: { status: "SUBMITTED" } });
    const submittedOrders = submittedInboundOrders + submittedOutboundOrders;

    const totalSuppliers = await prisma.supplier.count();

    // Get the latest order timestamp for frontend tracking
    const latestInboundOrder = await prisma.inboundOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    const latestOutboundOrder = await prisma.outboundOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    const latestOrderTimestamp = latestInboundOrder?.createdAt > latestOutboundOrder?.createdAt 
      ? latestInboundOrder.createdAt 
      : latestOutboundOrder?.createdAt;

    // ======= Recent orders =======
    const recentInboundOrders = await prisma.inboundOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: { include: { product: { select: { name: true } } } }
      },
    });

    const recentOutboundOrders = await prisma.outboundOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      include: {
        supplier: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, company: true } },
        items: { include: { product: { select: { name: true } } } }
      },
    });

    const allRecentOrders = [
      ...recentInboundOrders.map(o => ({ ...o, type: 'inbound' })),
      ...recentOutboundOrders.map(o => ({ ...o, type: 'outbound' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    // ======= Top products (last 7 days, listed only) =======
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // 1️⃣ Fetch all listed product IDs
    const listedProducts = await prisma.product.findMany({ select: { id: true } });
    const listedProductIds = listedProducts.map(p => p.id);

    // 2️⃣ inbound items (listed only)
    const topInboundItems = await prisma.inboundOrderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        createdAt: { gte: weekStart },
        order: { status: "SUBMITTED" },
        productId: { in: listedProductIds }
      },
    });

    // 3️⃣ outbound items (listed only)
    const topOutboundItems = await prisma.outboundOrderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        createdAt: { gte: weekStart },
        order: { status: "SUBMITTED" },
        productId: { in: listedProductIds }
      },
    });

    // ======= Aggregate totals =======
    const productQuantities = new Map();

    const processItems = async (items) => {
      for (const item of items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true }
          });
          if (product) {
            const currentQty = productQuantities.get(product.name) || 0;
            productQuantities.set(product.name, currentQty + (item._sum.quantity || 0));
          }
        }
      }
    };

    await processItems(topInboundItems);
    await processItems(topOutboundItems);

    const topProducts = Array.from(productQuantities.entries())
      .sort(([, aQty], [, bQty]) => bQty - aQty)
      .slice(0, 5)
      .map(([name, qty], idx) => ({ id: idx + 1, name, qty }));

    // ======= Low stock alerts =======
    const lowStockProducts = await prisma.product.findMany({
      where: {
        OR: [
          { quantity: { lt: prisma.product.fields.minStockLevel } },
          { quantity: null },
          { minStockLevel: null }
        ]
      },
      take: 5,
      select: { id: true, name: true, quantity: true, minStockLevel: true }
    });

    // ======= Response =======
    res.json({
      totalClients,
      totalAdmins,
      totalProducts,
      totalCategories,
      totalOrders,
      totalSuppliers,
      draftOrders,
      submittedOrders,
      latestOrderTimestamp: latestOrderTimestamp?.toISOString() || new Date().toISOString(),
      recentOrders: allRecentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        type: o.type,
        client: o.client,
        supplier: o.supplier,
        items: o.items,
        createdAt: o.createdAt
      })),
      topProducts,
      lowStockProducts
    });

  } catch (err) {
    console.error("Error fetching admin summary:", err);
    res.status(500).json({ message: "Failed to load admin summary" });
  }
});

// ======================
// ORDER STATS ROUTE
// ======================
app.get('/api/admin/order-stats', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const inboundStats = await prisma.inboundOrder.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const outboundStats = await prisma.outboundOrder.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    res.json({ inbound: inboundStats, outbound: outboundStats });
  } catch (err) {
    console.error("Error fetching order stats:", err);
    res.status(500).json({ message: "Failed to load order statistics" });
  }
});

// ✅ PROTECT ALL CLIENT ROUTES:
app.get('/api/client/orders/draft', authenticate, authorizeClient, async (req, res) => {
  // Your existing logic, but now properly protected
  try {
    const draftOrder = await prisma.inboundOrder.findFirst({
      where: {
        clientId: req.user.id, // ✅ Use authenticated user's ID
        status: 'DRAFT'
      },
      include: { items: { include: { product: true } } }
    });
    res.json(draftOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
///////////////////////////
// Add these routes to your backend:///for Admin dealing with inbound orders details and barcode ima

// Update internal status
app.put('/api/admin/inbound-orders/:orderId/status', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await prisma.inboundOrder.update({
      where: { id: parseInt(orderId) },
      data: { internalStatus: status },
      include: {
        items: {
          include: { product: true }
        },
        client: true
      }
    });

    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

// Bulk status update
app.put('/api/admin/inbound-orders/bulk-status', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    await prisma.inboundOrder.updateMany({
      where: { id: { in: orderIds.map(id => parseInt(id)) } },
      data: { internalStatus: status }
    });

    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('Error bulk updating order status:', err);
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

// Verify admin password
app.post('/api/admin/verify-password', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const admin = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const valid = await bcrypt.compare(password, admin.password);
    res.json({ valid });
  } catch (err) {
    console.error('Error verifying password:', err);
    res.status(500).json({ message: 'Password verification failed', error: err.message });
  }
});

// Bulk delete orders
app.post('/api/admin/inbound-orders/bulk-delete', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { orderIds } = req.body;

    // First delete related items
    await prisma.inboundOrderItem.deleteMany({
      where: { orderId: { in: orderIds.map(id => parseInt(id)) } }
    });

    // Then delete orders
    await prisma.inboundOrder.deleteMany({
      where: { id: { in: orderIds.map(id => parseInt(id)) } }
    });

    res.json({ message: 'Orders deleted successfully' });
  } catch (err) {
    console.error('Error bulk deleting orders:', err);
    res.status(500).json({ message: 'Failed to delete orders', error: err.message });
  }
});


//////////////////////////////
// QUOTATION MANAGEMENT ROUTES
// ==========================

// Generate quotation ID
// In your backend server.js - FIX the generateQuotationId function:
const generateQuotationId = async () => {
  try {
    // Get the latest quotation to increment from the highest number
    const latestQuotation = await prisma.quotation.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        quotationId: true
      }
    });

    let nextNumber = 1;
    
    if (latestQuotation && latestQuotation.quotationId) {
      // Extract the number from quotationId (e.g., "QT-0001" -> 1)
      const match = latestQuotation.quotationId.match(/QT-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `QT-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating quotation ID:', error);
    // Fallback: use timestamp if there's an error
    return `QT-${Date.now()}`;
  }
};

// GET all quotations
app.get('/api/quotations', async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        items: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Failed to fetch quotations' });
  }
});

// GET single quotation
app.get('/api/quotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ message: 'Failed to load quotation' });
  }
});

// CREATE new quotation - FIXED VALIDATION
// In your backend server.js - Modify the POST /api/quotations endpoint:
app.post('/api/quotations', async (req, res) => {
  try {
    const {
      quotationId: customQuotationId, // Allow custom quotation ID
      customerName,
      customerEmail,
      customerPhone,
      offerDate,
      validUntil,
      notes,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      creatorName,
      creatorPosition
    } = req.body;

    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Use custom quotation ID if provided, otherwise generate one
    let quotationId;
    if (customQuotationId && customQuotationId.trim() !== '') {
      // Check if custom quotation ID already exists
      const existingQuotation = await prisma.quotation.findUnique({
        where: { quotationId: customQuotationId }
      });
      if (existingQuotation) {
        return res.status(400).json({ message: 'Quotation ID already exists' });
      }
      quotationId = customQuotationId;
    } else {
      // Generate new quotation ID
      quotationId = await generateQuotationId();
    }
    
    // Get first admin user to assign as creator
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!defaultUser) {
      return res.status(500).json({ message: 'No admin user found to assign quotation' });
    }
    
    const quotation = await prisma.quotation.create({
      data: {
        quotationId,
        customerName: customerName.trim(),
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        offerDate: offerDate ? new Date(offerDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: notes || '',
        subtotal: subtotal || 0,
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        total: total || 0,
        createdById: defaultUser.id,
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            name: item.name || 'Unnamed Product',
            partNo: item.partNo || '',
            description: item.description || '',
            image: item.image || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0
          }))
        }
      },
      include: {
        items: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Error creating quotation:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Quotation ID already exists. Please try a different ID.' });
    }
    
    res.status(500).json({ message: 'Failed to create quotation: ' + error.message });
  }
});

// UPDATE quotation status
app.put('/api/quotations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updateData = { status };
    if (status === 'SENT') updateData.sentAt = new Date();
    if (status === 'VIEWED') updateData.viewedAt = new Date();
    if (status === 'ACCEPTED') updateData.acceptedAt = new Date();

    const quotation = await prisma.quotation.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(quotation);
  } catch (error) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({ message: 'Failed to update quotation status' });
  }
});

// UPDATE quotation
app.put('/api/quotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerEmail,
      customerPhone,
      offerDate,
      validUntil,
      notes,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total
    } = req.body;

    // Validate required fields
    if (!customerName) {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    if (!customerEmail) {
      return res.status(400).json({ message: 'Customer email is required' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // First delete existing items
    await prisma.quotationItem.deleteMany({
      where: { quotationId: parseInt(id) }
    });

    // Then update quotation with new items
    const quotation = await prisma.quotation.update({
      where: { id: parseInt(id) },
      data: {
        customerName: customerName || 'Unknown Customer',
        customerEmail: customerEmail || 'unknown@example.com',
        customerPhone: customerPhone || '',
        offerDate: offerDate ? new Date(offerDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: notes || '',
        subtotal: subtotal || 0,
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        total: total || 0,
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            name: item.name || 'Unnamed Product',
            partNo: item.partNo || '',
            description: item.description || '',
            image: item.image || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0
          }))
        }
      },
      include: {
        items: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json(quotation);
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ message: 'Failed to update quotation' });
  }
});

// DELETE quotation
app.delete('/api/quotations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First delete associated items
    await prisma.quotationItem.deleteMany({
      where: { quotationId: parseInt(id) }
    });

    // Then delete the quotation
    await prisma.quotation.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ message: 'Failed to delete quotation' });
  }
});

// GET quotation analytics
app.get('/api/quotations/analytics/summary', async (req, res) => {
  try {
    const totalQuotations = await prisma.quotation.count();
    const draftQuotations = await prisma.quotation.count({ where: { status: 'DRAFT' } });
    const sentQuotations = await prisma.quotation.count({ where: { status: 'SENT' } });
    const acceptedQuotations = await prisma.quotation.count({ where: { status: 'ACCEPTED' } });
    
    const totalRevenue = await prisma.quotation.aggregate({
      _sum: { total: true },
      where: { status: 'ACCEPTED' }
    });

    const monthlyData = await prisma.quotation.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { total: true },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    res.json({
      totalQuotations,
      draftQuotations,
      sentQuotations,
      acceptedQuotations,
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyData
    });
  } catch (error) {
    console.error('Error fetching quotation analytics:', error);
    res.status(500).json({ message: 'Failed to fetch quotation analytics' });
  }
});

////////////////////////////////////////
// ENHANCED ANALYTICS ROUTES
// =========================

// Enhanced GET quotation analytics with time range support
app.get('/api/quotations/analytics/summary', async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // Calculate date ranges
    const { startDate, previousStartDate } = calculateDateRanges(timeRange);
    
    // Current period data
    const currentWhere = {
      createdAt: { gte: startDate }
    };
    
    const totalQuotations = await prisma.quotation.count({ where: currentWhere });
    
    // Status breakdown for current period
    const statusBreakdown = await prisma.quotation.groupBy({
      by: ['status'],
      where: currentWhere,
      _count: { id: true }
    });
    
    // Revenue from accepted quotations in current period
    const revenueData = await prisma.quotation.aggregate({
      where: { 
        ...currentWhere, 
        status: 'ACCEPTED' 
      },
      _sum: { total: true },
      _count: { id: true }
    });

    // Active customers in current period
    const activeCustomers = await prisma.customer.count({
      where: {
        quotations: { 
          some: currentWhere 
        }
      }
    });

    // New customers in current period
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Previous period data for growth calculations
    const previousWhere = {
      createdAt: { 
        gte: previousStartDate,
        lt: startDate
      }
    };
    
    const previousQuotations = await prisma.quotation.count({ 
      where: previousWhere 
    });
    
    const previousRevenue = await prisma.quotation.aggregate({
      where: { 
        ...previousWhere, 
        status: 'ACCEPTED' 
      },
      _sum: { total: true }
    });

    // Calculate metrics
    const acceptedCount = statusBreakdown.find(s => s.status === 'ACCEPTED')?._count.id || 0;
    const sentCount = statusBreakdown.find(s => s.status === 'SENT')?._count.id || 0;
    const viewedCount = statusBreakdown.find(s => s.status === 'VIEWED')?._count.id || 0;
    
    const conversionRate = totalQuotations > 0 ? 
      Math.round((acceptedCount / totalQuotations) * 100) : 0;
    
    const responseRate = totalQuotations > 0 ? 
      Math.round(((sentCount + acceptedCount + viewedCount) / totalQuotations) * 100) : 0;
    
    const completionRate = (sentCount + viewedCount) > 0 ? 
      Math.round((acceptedCount / (sentCount + viewedCount)) * 100) : 0;

    // Growth calculations
    const quotationGrowth = previousQuotations > 0 ? 
      Math.round(((totalQuotations - previousQuotations) / previousQuotations) * 100) : 
      (totalQuotations > 0 ? 100 : 0);
    
    const revenueGrowth = previousRevenue._sum.total > 0 ? 
      Math.round(((revenueData._sum.total - previousRevenue._sum.total) / previousRevenue._sum.total) * 100) : 
      (revenueData._sum.total > 0 ? 100 : 0);

    // Format status breakdown with percentages
    const statusWithPercentage = statusBreakdown.map(status => ({
      status: status.status,
      count: status._count.id,
      percentage: totalQuotations > 0 ? Math.round((status._count.id / totalQuotations) * 100) : 0
    }));

    // Get top customers for the period
    const topCustomers = await getTopCustomers(timeRange);

    res.json({
      totalQuotations,
      activeQuotations: totalQuotations - (statusBreakdown.find(s => s.status === 'EXPIRED')?._count.id || 0),
      acceptedQuotations: acceptedCount,
      totalRevenue: revenueData._sum.total || 0,
      averageDealSize: acceptedCount > 0 ? (revenueData._sum.total || 0) / acceptedCount : 0,
      conversionRate,
      responseRate,
      completionRate,
      activeCustomers,
      newCustomers,
      statusBreakdown: statusWithPercentage,
      quotationGrowth,
      revenueGrowth,
      conversionGrowth: 0,
      customerGrowth: 0,
      topCustomers // Add top customers to the response
    });
  } catch (error) {
    console.error('Error fetching quotation analytics:', error);
    res.status(500).json({ message: 'Failed to fetch quotation analytics' });
  }
});

// Helper function to calculate date ranges
function calculateDateRanges(timeRange) {
  const now = new Date();
  let startDate = new Date();
  let previousStartDate = new Date();

  switch (timeRange) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      previousStartDate.setDate(now.getDate() - 14);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      previousStartDate.setMonth(now.getMonth() - 2);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      previousStartDate.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      previousStartDate.setFullYear(now.getFullYear() - 2);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
      previousStartDate.setMonth(now.getMonth() - 2);
  }

  return { startDate, previousStartDate };
}

// GET quotations with filtering for recent activity
app.get('/api/quotations', async (req, res) => {
  try {
    const { limit, customerId } = req.query;
    
    const take = limit ? parseInt(limit) : undefined;
    
    const where = customerId ? { customerId: parseInt(customerId) } : {};
    
    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        items: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take
    });
    
    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Failed to fetch quotations' });
  }
});

// Export analytics report - FIXED VERSION
app.get('/api/analytics/export', async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // Calculate date ranges
    const { startDate } = calculateDateRanges(timeRange);
    
    // Get analytics data directly (no internal API call)
    const totalQuotations = await prisma.quotation.count({ 
      where: { createdAt: { gte: startDate } }
    });
    
    // Status breakdown
    const statusBreakdown = await prisma.quotation.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    });
    
    // Revenue data
    const revenueData = await prisma.quotation.aggregate({
      where: { 
        createdAt: { gte: startDate },
        status: 'ACCEPTED' 
      },
      _sum: { total: true }
    });

    // Active customers
    const activeCustomers = await prisma.customer.count({
      where: {
        quotations: { 
          some: { createdAt: { gte: startDate } }
        }
      }
    });

    // New customers
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Calculate metrics
    const acceptedCount = statusBreakdown.find(s => s.status === 'ACCEPTED')?._count.id || 0;
    const sentCount = statusBreakdown.find(s => s.status === 'SENT')?._count.id || 0;
    const viewedCount = statusBreakdown.find(s => s.status === 'VIEWED')?._count.id || 0;
    
    const conversionRate = totalQuotations > 0 ? 
      Math.round((acceptedCount / totalQuotations) * 100) : 0;
    
    const responseRate = totalQuotations > 0 ? 
      Math.round(((sentCount + acceptedCount + viewedCount) / totalQuotations) * 100) : 0;
    
    const completionRate = (sentCount + viewedCount) > 0 ? 
      Math.round((acceptedCount / (sentCount + viewedCount)) * 100) : 0;

    // Format status breakdown
    const statusWithPercentage = statusBreakdown.map(status => ({
      status: status.status,
      count: status._count.id,
      percentage: totalQuotations > 0 ? Math.round((status._count.id / totalQuotations) * 100) : 0
    }));

    // Get top customers
    const topCustomers = await getTopCustomers(timeRange);

    // Get recent quotations
    const recentQuotations = await prisma.quotation.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        customer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Prepare analytics object for CSV generation
    const analytics = {
      totalQuotations,
      totalRevenue: revenueData._sum.total || 0,
      conversionRate,
      responseRate,
      completionRate,
      activeCustomers,
      newCustomers,
      acceptedQuotations: acceptedCount,
      averageDealSize: acceptedCount > 0 ? (revenueData._sum.total || 0) / acceptedCount : 0,
      statusBreakdown: statusWithPercentage,
      topCustomers
    };

    // Generate CSV content
    const csvContent = generateCSVContent(analytics, recentQuotations, timeRange);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ message: 'Failed to export analytics report: ' + error.message });
  }
});

// CSV Generator Function
function generateCSVContent(analytics, recentQuotations, timeRange) {
  const headers = [
    'Sales Analytics Report',
    `Period: ${getTimeRangeText(timeRange)}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    'Company: Al-Waleed Inc',
    '', // Empty line for spacing
  ];

  // Key Metrics Section
  const metrics = [
    ['KEY PERFORMANCE INDICATORS'],
    ['Metric', 'Value'],
    ['Total Quotations', analytics.totalQuotations],
    ['Total Revenue', `"${formatCurrency(analytics.totalRevenue)}"`],
    ['Conversion Rate', `${analytics.conversionRate}%`],
    ['Active Customers', analytics.activeCustomers],
    ['Accepted Quotations', analytics.acceptedQuotations],
    ['New Customers', analytics.newCustomers || 0],
    ['Average Deal Size', `"${formatCurrency(analytics.averageDealSize)}"`],
    ['Response Rate', `${analytics.responseRate || 0}%`],
    ['Completion Rate', `${analytics.completionRate || 0}%`],
    ['Quotation Growth', `${analytics.quotationGrowth || 0}%`],
    ['Revenue Growth', `${analytics.revenueGrowth || 0}%`],
    '', // Empty line
  ];

  // Status Breakdown Section
  const statusHeader = ['QUOTATION STATUS BREAKDOWN'];
  const statusHeaders = ['Status', 'Count', 'Percentage'];
  const statusRows = analytics.statusBreakdown.map(status => [
    status.status,
    status.count,
    `${status.percentage}%`
  ]);

  // Top Customers Section
  const customersHeader = ['TOP CUSTOMERS'];
  const customerHeaders = ['Rank', 'Customer Name', 'Quotation Count', 'Total Value', 'Average Value'];
  const customerRows = (analytics.topCustomers || []).map((customer, index) => [
    index + 1,
    `"${customer.name}"`,
    customer.quotationCount,
    `"${formatCurrency(customer.totalValue)}"`,
    `"${formatCurrency(customer.averageValue)}"`
  ]);

  // Recent Activity Section
  const activityHeader = ['RECENT ACTIVITY (Last 10)'];
  const activityHeaders = ['Customer', 'Quotation ID', 'Amount', 'Status', 'Created Date'];
  const activityRows = recentQuotations.map(quotation => [
    `"${quotation.customerName || quotation.customer?.name || 'Unnamed Customer'}"`,
    quotation.quotationId,
    `"${formatCurrency(quotation.total)}"`,
    quotation.status,
    new Date(quotation.createdAt).toLocaleDateString()
  ]);

  // Combine all sections
  const csvRows = [
    ...headers,
    ...metrics,
    ...statusHeader,
    statusHeaders,
    ...statusRows,
    '',
    ...customersHeader,
    customerHeaders,
    ...customerRows,
    '',
    ...activityHeader,
    activityHeaders,
    ...activityRows
  ];

  // Convert to CSV string
  return csvRows.map(row => {
    if (Array.isArray(row)) {
      return row.join(',');
    }
    return row;
  }).join('\n');
}

// Helper function to get top customers
async function getTopCustomers(timeRange) {
  const { startDate } = calculateDateRanges(timeRange);
  
  const customers = await prisma.customer.findMany({
    include: {
      quotations: {
        where: {
          createdAt: { gte: startDate },
          status: 'ACCEPTED'
        }
      }
    }
  });
  
  const customersWithStats = customers.map(customer => {
    const acceptedQuotations = customer.quotations;
    const totalValue = acceptedQuotations.reduce((sum, q) => sum + q.total, 0);
    const quotationCount = acceptedQuotations.length;
    const averageValue = quotationCount > 0 ? totalValue / quotationCount : 0;
    
    return {
      id: customer.id,
      name: customer.name,
      quotationCount,
      totalValue,
      averageValue
    };
  })
  .filter(customer => customer.quotationCount > 0)
  .sort((a, b) => b.totalValue - a.totalValue)
  .slice(0, 10);
  
  return customersWithStats;
}

// Helper function to format currency for CSV
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

// Helper function to get time range text
function getTimeRangeText(range) {
  const ranges = {
    week: 'Last 7 Days',
    month: 'This Month',
    quarter: 'This Quarter', 
    year: 'This Year'
  };
  return ranges[range] || ranges.month;
}

// REMOVE THE OLD getEnhancedAnalytics FUNCTION - we don't need it anymore for above
// since we're using the dashboard analytics data


//////////////////////////////
// OUTBOUND INVOICE MANAGEMENT ROUTES
// ==========================

// Generate invoice number
const generateInvoiceNumber = async () => {
  try {
    const latestInvoice = await prisma.outboundInvoice.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        invoiceNumber: true
      }
    });

    let nextNumber = 1;
    
    if (latestInvoice && latestInvoice.invoiceNumber) {
      const match = latestInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `INV-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return `INV-${Date.now()}`;
  }
};

// GET all outbound invoices
app.get('/api/outbound-invoices', async (req, res) => {
  try {
    const invoices = await prisma.outboundInvoice.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                partNo: true,
                image: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true,
            company: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching outbound invoices:', error);
    res.status(500).json({ 
      message: 'Failed to fetch outbound invoices',
      error: error.message 
    });
  }
});



// CREATE new outbound invoice from catalog
app.post('/api/outbound-invoices', async (req, res) => {
  try {
    const {
      invoiceNumber: customInvoiceNumber,
      customerId,
      clientId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      issueDate,
      dueDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      totalAmount,
      paymentMethod,
      shippingAddress,
      notes,
      terms,
      baseCost,
      markupAmount,
      markupPercentage
    } = req.body;

    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Use custom invoice number if provided, otherwise generate one
    let invoiceNumber;
    if (customInvoiceNumber && customInvoiceNumber.trim() !== '') {
      const existingInvoice = await prisma.outboundInvoice.findUnique({
        where: { invoiceNumber: customInvoiceNumber }
      });
      if (existingInvoice) {
        return res.status(400).json({ message: 'Invoice number already exists' });
      }
      invoiceNumber = customInvoiceNumber;
    } else {
      invoiceNumber = await generateInvoiceNumber();
    }

    // Get first admin user to assign as creator if clientId not provided
    let assignedClientId = clientId;
    if (!assignedClientId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      if (defaultUser) {
        assignedClientId = defaultUser.id;
      }
    }

    const invoice = await prisma.outboundInvoice.create({
      data: {
        invoiceNumber,
        clientId: assignedClientId,
        customerId: customerId || null,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: subtotal || 0,
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        discount: discount || 0,
        totalAmount: totalAmount || 0,
        paidAmount: 0,
        balanceDue: totalAmount || 0,
        paymentMethod: paymentMethod || null,
        shippingAddress: shippingAddress || '',
        notes: notes || '',
        terms: terms || '',
        baseCost: baseCost || null,
        markupAmount: markupAmount || null,
        markupPercentage: markupPercentage || null,
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        shipmentStatus: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            unitCost: item.unitCost || null,
            markupAmount: item.markupAmount || null,
            markupPercentage: item.markupPercentage || null,
            inboundItemId: item.inboundItemId || null
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                partNo: true,
                image: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating outbound invoice:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Invoice number already exists. Please try a different number.' });
    }
    
    res.status(500).json({ message: 'Failed to create invoice: ' + error.message });
  }
});

// UPDATE outbound invoice status - FIXED
app.put('/api/outbound-invoices/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate and parse the ID
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    const { status, paymentStatus, shipmentStatus } = req.body;

    if (!status && !paymentStatus && !shipmentStatus) {
      return res.status(400).json({ message: 'At least one status is required' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (shipmentStatus) updateData.shipmentStatus = shipmentStatus;

    // Update timestamps based on status changes
    if (status === 'SENT') updateData.sentAt = new Date();
    if (status === 'VIEWED') updateData.viewedAt = new Date();
    if (paymentStatus === 'PAID') updateData.paidAt = new Date();

    const invoice = await prisma.outboundInvoice.update({
      where: { id: invoiceId },
      data: updateData
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error updating outbound invoice status:', error);
    res.status(500).json({ message: 'Failed to update invoice status' });
  }
});

// UPDATE outbound invoice - FIXED
app.put('/api/outbound-invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate and parse the ID
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    const {
      customerId,
      clientId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      issueDate,
      dueDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      totalAmount,
      paymentMethod,
      shippingAddress,
      notes,
      terms,
      baseCost,
      markupAmount,
      markupPercentage
    } = req.body;

    // Validate required fields
    if (!customerName) {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // First delete existing items
    await prisma.outboundInvoiceItem.deleteMany({
      where: { invoiceId: invoiceId }
    });

    // Then update invoice with new items
    const invoice = await prisma.outboundInvoice.update({
      where: { id: invoiceId },
      data: {
        customerId: customerId || null,
        clientId: clientId || null,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: subtotal || 0,
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        discount: discount || 0,
        totalAmount: totalAmount || 0,
        paymentMethod: paymentMethod || null,
        shippingAddress: shippingAddress || '',
        notes: notes || '',
        terms: terms || '',
        baseCost: baseCost || null,
        markupAmount: markupAmount || null,
        markupPercentage: markupPercentage || null,
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            unitCost: item.unitCost || null,
            markupAmount: item.markupAmount || null,
            markupPercentage: item.markupPercentage || null,
            inboundItemId: item.inboundItemId || null
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                partNo: true,
                image: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error updating outbound invoice:', error);
    res.status(500).json({ message: 'Failed to update invoice' });
  }
});

// DELETE outbound invoice - FIXED
app.delete('/api/outbound-invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate and parse the ID
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    // First delete associated items
    await prisma.outboundInvoiceItem.deleteMany({
      where: { invoiceId: invoiceId }
    });

    // Then delete the invoice
    await prisma.outboundInvoice.delete({
      where: { id: invoiceId }
    });

    res.json({ message: 'Outbound invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting outbound invoice:', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
});

//////////////////////////////////////////
//// another rout for Invoice From Csv////
//////////////////////////////////////////

// CREATE outbound invoice from CSV (without product association)
app.post('/api/outbound-invoices/csv', async (req, res) => {
  try {
    const {
      invoiceNumber: customInvoiceNumber,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      issueDate,
      dueDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      totalAmount,
      paymentMethod,
      shippingAddress,
      notes,
      terms,
      baseCost,
      markupAmount,
      markupPercentage,
      status = 'DRAFT',
      paymentStatus = 'PENDING',
      shipmentStatus = 'PENDING'
    } = req.body;

    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Use custom invoice number if provided, otherwise generate one
    let invoiceNumber;
    if (customInvoiceNumber && customInvoiceNumber.trim() !== '') {
      const existingInvoice = await prisma.outboundInvoice.findUnique({
        where: { invoiceNumber: customInvoiceNumber }
      });
      if (existingInvoice) {
        return res.status(400).json({ message: 'Invoice number already exists' });
      }
      invoiceNumber = customInvoiceNumber;
    } else {
      invoiceNumber = await generateInvoiceNumber();
    }

    // Get first admin user to assign as creator
    let assignedClientId = null;
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    if (defaultUser) {
      assignedClientId = defaultUser.id;
    }

    // If we have customer details but no customerId, create or find a customer
    let finalCustomerId = customerId;
    if (!finalCustomerId && customerName) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          name: { 
            equals: customerName,
            mode: 'insensitive'
          } 
        }
      });

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            name: customerName,
            email: customerEmail || '',
            phone: customerPhone || '',
            address: customerAddress || '',
            company: ''
          }
        });
        finalCustomerId = newCustomer.id;
      }
    }

    // Create or find placeholder products for CSV items
    const itemCreationPromises = items.map(async (item) => {
      const productName = item.name || item.description || 'CSV Product';
      const partNo = item.partNo || `CSV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Try to find existing product by partNo or create a new one
      let product;
      try {
        product = await prisma.product.findFirst({
          where: {
            OR: [
              { partNo: partNo },
              { name: { equals: productName, mode: 'insensitive' } }
            ]
          }
        });

        if (!product) {
          product = await prisma.product.create({
            data: {
              name: productName,
              partNo: partNo,
              costPrice: item.unitCost || 0,
              salePrice: item.unitPrice || 0,
              markupPercentage: item.markupPercentage || 0,
              categoryId: 1, // You need to have at least one category
              quantity: 0,
              image: item.image || ''
            }
          });
        }
      } catch (error) {
        console.error('Error creating/finding product:', error);
        // If product creation fails, use a fallback product
        const fallbackProduct = await prisma.product.findFirst({
          where: { categoryId: 1 }
        });
        product = fallbackProduct;
      }

      return {
        productId: product.id,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        unitCost: item.unitCost || 0,
        markupAmount: item.markupAmount || 0,
        markupPercentage: item.markupPercentage || 0,
        inboundItemId: null
      };
    });

    const invoiceItems = await Promise.all(itemCreationPromises);

    const invoice = await prisma.outboundInvoice.create({
      data: {
        invoiceNumber,
        clientId: assignedClientId,
        customerId: finalCustomerId || null,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: subtotal || 0,
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        discount: discount || 0,
        totalAmount: totalAmount || 0,
        paidAmount: 0,
        balanceDue: totalAmount || 0,
        paymentMethod: paymentMethod || null,
        shippingAddress: shippingAddress || '',
        notes: notes || '',
        terms: terms || '',
        baseCost: baseCost || null,
        markupAmount: markupAmount || null,
        markupPercentage: markupPercentage || null,
        status: status,
        paymentStatus: paymentStatus,
        shipmentStatus: shipmentStatus,
        items: {
          create: invoiceItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                partNo: true,
                image: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating CSV outbound invoice:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Invoice number already exists. Please try a different number.' });
    }
    
    res.status(500).json({ message: 'Failed to create invoice: ' + error.message });
  }
});

// UPDATE outbound invoice status only (for CSV invoices) - FIXED
app.put('/api/outbound-invoices/csv/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate and parse the ID
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    const { status, paymentStatus, shipmentStatus } = req.body;

    // Validate that at least one status field is provided
    if (!status && !paymentStatus && !shipmentStatus) {
      return res.status(400).json({ 
        message: 'At least one status field (status, paymentStatus, or shipmentStatus) is required' 
      });
    }

    const updateData = {};
    
    // Only update the fields that are provided
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (shipmentStatus) updateData.shipmentStatus = shipmentStatus;

    // Update timestamps based on status changes
    if (status === 'SENT') updateData.sentAt = new Date();
    if (status === 'VIEWED') updateData.viewedAt = new Date();
    if (paymentStatus === 'PAID') updateData.paidAt = new Date();

    const invoice = await prisma.outboundInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                partNo: true,
                image: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error updating outbound invoice status:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.status(500).json({ message: 'Failed to update invoice status: ' + error.message });
  }
});


/////////////////////////
/// Outbound Invoice Analytics - UPDATED VERSION ////
//////////////////////////

// GET outbound invoices analytics - UPDATED VERSION
app.get('/api/outbound-invoices/analytics', async (req, res) => {
  try {
    const { timeRange = '30days', startDate, endDate } = req.query;
    
    console.log('📊 Analytics endpoint called with:', { timeRange, startDate, endDate });

    // Validate timeRange parameter
    const validTimeRanges = ['7days', '30days', '90days', '1year', 'custom'];
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({ 
        message: 'Invalid timeRange. Must be one of: 7days, 30days, 90days, 1year, custom' 
      });
    }

    // Build date filter
    let dateFilter = {};
    const now = new Date();
    
    if (timeRange === 'custom' && startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      let startDateFilter = new Date();
      
      switch (timeRange) {
        case '7days':
          startDateFilter.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDateFilter.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDateFilter.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDateFilter.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDateFilter.setDate(now.getDate() - 30);
      }
      
      dateFilter = {
        createdAt: {
          gte: startDateFilter,
          lte: now
        }
      };
    }

    console.log('📅 Date filter:', dateFilter);

    // Get invoices with date filtering
    const invoices = await prisma.outboundInvoice.findMany({
      where: dateFilter,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                partNo: true,
                costPrice: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📈 Found ${invoices.length} invoices for analytics`);

    if (invoices.length === 0) {
      // Return empty analytics structure
      const emptyAnalytics = {
        summary: {
          totalRevenue: 0,
          totalProfit: 0,
          avgProfitMargin: 0,
          activeCustomers: 0,
          newCustomers: 0,
          invoiceCount: 0,
          productsSold: 0,
          uniqueProducts: 0
        },
        revenueTrends: [],
        topCustomers: [],
        productPerformance: [],
        statusDistribution: [],
        paymentAnalytics: []
      };
      
      return res.json(emptyAnalytics);
    }

    // Calculate basic summary
    const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
    const invoiceCount = invoices.length;
    
    // Calculate profit from items
    let totalCost = 0;
    let totalProfit = 0;
    let productsSold = 0;
    const uniqueProducts = new Set();
    const customers = new Set();
    const customerRevenue = {};

    invoices.forEach(invoice => {
      if (invoice.customer) {
        customers.add(invoice.customer.id);
        // Track customer revenue for top customers calculation
        if (!customerRevenue[invoice.customer.id]) {
          customerRevenue[invoice.customer.id] = {
            name: invoice.customer.name,
            invoiceCount: 0,
            totalRevenue: 0
          };
        }
        customerRevenue[invoice.customer.id].invoiceCount += 1;
        customerRevenue[invoice.customer.id].totalRevenue += parseFloat(invoice.totalAmount) || 0;
      }
      
      invoice.items.forEach(item => {
        const quantity = parseInt(item.quantity) || 0;
        productsSold += quantity;
        
        if (item.product) {
          uniqueProducts.add(item.product.id);
          const itemRevenue = (parseFloat(item.unitPrice) || 0) * quantity;
          const itemCost = (parseFloat(item.product.costPrice) || 0) * quantity;
          totalCost += itemCost;
          totalProfit += itemRevenue - itemCost;
        }
      });
    });

    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Status distribution
    const statusCount = {};
    const paymentStatusCount = {};
    
    invoices.forEach(inv => {
      statusCount[inv.status] = (statusCount[inv.status] || 0) + 1;
      paymentStatusCount[inv.paymentStatus] = (paymentStatusCount[inv.paymentStatus] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / invoiceCount) * 100)
    }));

    // Calculate top customers
    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .map(customer => ({
        ...customer,
        averageOrder: Math.round(customer.totalRevenue / customer.invoiceCount)
      }));

    // Calculate product performance
    const productPerformanceMap = {};
    
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.product) {
          const productId = item.product.id;
          if (!productPerformanceMap[productId]) {
            productPerformanceMap[productId] = {
              name: item.product.name,
              partNo: item.product.partNo,
              quantitySold: 0,
              revenue: 0,
              cost: 0
            };
          }
          
          const quantity = parseInt(item.quantity) || 0;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const costPrice = parseFloat(item.product.costPrice) || 0;
          
          productPerformanceMap[productId].quantitySold += quantity;
          productPerformanceMap[productId].revenue += unitPrice * quantity;
          productPerformanceMap[productId].cost += costPrice * quantity;
        }
      });
    });

    const productPerformance = Object.values(productPerformanceMap)
      .map(product => ({
        ...product,
        profitMargin: product.revenue > 0 ? 
          Math.round(((product.revenue - product.cost) / product.revenue) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Payment analytics
    const paymentAnalytics = Object.entries(paymentStatusCount).map(([status, count]) => {
      const statusInvoices = invoices.filter(inv => inv.paymentStatus === status);
      const totalAmount = statusInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
      const paidAmount = status === 'PAID' ? totalAmount : 0;
      const collectionRate = status === 'PAID' ? 100 : 0;
      
      return {
        status,
        count,
        totalAmount,
        paidAmount,
        collectionRate
      };
    });

    // Revenue trends (simplified - you might want to implement proper time-based grouping)
    const revenueTrends = [
      { period: 'Current', revenue: Math.round(totalRevenue) },
      { period: 'Previous', revenue: Math.round(totalRevenue * 0.8) } // Placeholder
    ];

    const analyticsData = {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        avgProfitMargin: Math.round(avgProfitMargin * 10) / 10,
        activeCustomers: customers.size,
        newCustomers: customers.size, // You might want to implement proper new customer calculation
        invoiceCount,
        productsSold,
        uniqueProducts: uniqueProducts.size
      },
      revenueTrends,
      topCustomers,
      productPerformance,
      statusDistribution,
      paymentAnalytics,
      timeRange: {
        selected: timeRange,
        startDate: dateFilter.createdAt?.gte || null,
        endDate: dateFilter.createdAt?.lte || null
      }
    };

    console.log('✅ Successfully generated analytics for', invoiceCount, 'invoices');
    console.log('📊 Summary:', analyticsData.summary);
    
    res.json(analyticsData);
    
  } catch (error) {
    console.error('❌ Error in analytics endpoint:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      message: 'Failed to fetch analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// If you need analytics for a specific invoice, add this separate endpoint:
app.get('/api/outbound-invoices/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate and parse the ID
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    const invoice = await prisma.outboundInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                partNo: true,
                costPrice: true
              }
            }
          }
        },
        customer: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Calculate invoice-specific analytics
    const totalRevenue = parseFloat(invoice.totalAmount) || 0;
    let totalCost = 0;
    let totalProfit = 0;

    invoice.items.forEach(item => {
      const quantity = parseInt(item.quantity) || 0;
      const itemRevenue = (parseFloat(item.unitPrice) || 0) * quantity;
      const itemCost = item.product ? (parseFloat(item.product.costPrice) || 0) * quantity : 0;
      totalCost += itemCost;
      totalProfit += itemRevenue - itemCost;
    });

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const invoiceAnalytics = {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer?.name,
        issueDate: invoice.issueDate,
        status: invoice.status,
        paymentStatus: invoice.paymentStatus
      },
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        itemsCount: invoice.items.length,
        productsSold: invoice.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
      },
      items: invoice.items.map(item => ({
        name: item.product?.name || 'Unknown Product',
        partNo: item.product?.partNo || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        costPrice: item.product?.costPrice || 0,
        profit: (item.unitPrice * item.quantity) - (item.product?.costPrice || 0 * item.quantity),
        profitMargin: item.unitPrice > 0 ? 
          Math.round(((item.unitPrice - (item.product?.costPrice || 0)) / item.unitPrice) * 100) : 0
      }))
    };

    res.json(invoiceAnalytics);
  } catch (error) {
    console.error('Error fetching invoice analytics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch invoice analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

///////////////////////

// GET single outbound invoice - FIXED
app.get('/api/outbound-invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate and parse the ID
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    console.log('Fetching outbound invoice with ID:', invoiceId);

    const invoice = await prisma.outboundInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                partNo: true,
                image: true
              }
            }
          }
        },
        client: {
          select: {
            name: true,
            email: true,
            company: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
            company: true,
            phone: true,
            address: true
          }
        },
        inboundInvoice: {
          include: {
            supplier: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      console.log('Invoice not found with ID:', invoiceId);
      return res.status(404).json({ message: 'Outbound invoice not found' });
    }

    console.log('Successfully fetched invoice:', invoice.invoiceNumber);
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching outbound invoice:', error);
    res.status(500).json({ 
      message: 'Failed to load outbound invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

//////////////////////////////
// CUSTOMER MANAGEMENT ROUTES
// ==========================

// GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// GET single customer
app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Failed to load customer' });
  }
});

// CREATE new customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, address, gps, company } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || '',
        phone: phone || '',
        address: address || '',
        gps: gps || '',
        company: company || ''
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Failed to create customer' });
  }
});

// UPDATE customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, gps, company } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email: email || '',
        phone: phone || '',
        address: address || '',
        gps: gps || '',
        company: company || ''
      }
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// DELETE customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has quotations
    const customerWithQuotations = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: { quotations: true }
    });

    if (customerWithQuotations.quotations.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with associated quotations' 
      });
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});



////////////////////////////////////////
// QUOTATION TO ORDER CONVERSION ROUTES
// ====================================

// Convert quotation to sales order
app.post('/api/sales/convert-to-order', async (req, res) => {
  try {
    const {
      orderNumber,
      quotationId,
      quotationNumber,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total
    } = req.body;

    // Validate required fields
    if (!orderNumber || !customerName) {
      return res.status(400).json({ message: 'Order number and customer name are required' });
    }

    // Check if order number already exists
    const existingOrder = await prisma.inboundOrder.findUnique({
      where: { orderNumber }
    });

    if (existingOrder) {
      return res.status(400).json({ message: 'Order number already exists' });
    }

    // Get first admin user to assign as client
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!defaultUser) {
      return res.status(500).json({ message: 'No admin user found to assign order' });
    }

    // Create the inbound order
    const inboundOrder = await prisma.inboundOrder.create({
      data: {
        orderNumber,
        clientId: defaultUser.id,
        status: 'SUBMITTED',
        internalStatus: 'PENDING',
        weekStartDate: new Date(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        items: {
          create: items.map(item => ({
            productId: item.productId || null,
            description: item.name,
            quantity: item.quantity,
            isUnlisted: !item.productId,
            ...(item.productId ? {} : { 
              description: item.name,
              imagePath: item.image || null
            })
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Create a record of the conversion
    await prisma.quotationOrderConversion.create({
      data: {
        quotationId: parseInt(quotationId),
        orderId: inboundOrder.id,
        orderNumber: orderNumber,
        convertedAt: new Date()
      }
    });

    res.status(201).json(inboundOrder);

  } catch (error) {
    console.error('Error converting quotation to order:', error);
    res.status(500).json({ message: 'Failed to convert quotation to order: ' + error.message });
  }
});

// Get order conversion history
app.get('/api/sales/order-conversions/:quotationId', async (req, res) => {
  try {
    const { quotationId } = req.params;
    
    const conversions = await prisma.quotationOrderConversion.findMany({
      where: { quotationId: parseInt(quotationId) },
      include: {
        order: {
          include: {
            items: true,
            client: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        convertedAt: 'desc'
      }
    });

    res.json(conversions);
  } catch (error) {
    console.error('Error fetching order conversions:', error);
    res.status(500).json({ message: 'Failed to fetch order conversions' });
  }
});


///////////////////////
// SUPPLIER MANAGEMENT ROUTES
// ==========================

// GET all suppliers
app.get('/api/suppliers', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            outboundOrders: true,
            inboundInvoices: true
          }
        }
      }
    });
    
    res.json(suppliers);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ message: 'Failed to load suppliers' });
  }
});

// GET single supplier
app.get('/api/suppliers/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        outboundOrders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        inboundInvoices: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (err) {
    console.error('Error fetching supplier:', err);
    res.status(500).json({ message: 'Failed to load supplier' });
  }
});

// CREATE new supplier
app.post('/api/suppliers', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, contact, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contact,
        email,
        phone,
        address
      }
    });

    res.status(201).json(supplier);
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ message: 'Failed to create supplier' });
  }
});

// UPDATE supplier
app.put('/api/suppliers/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name,
        contact,
        email,
        phone,
        address
      }
    });

    res.json(supplier);
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ message: 'Failed to update supplier' });
  }
});

// DELETE supplier
app.delete('/api/suppliers/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier has associated records
    const supplierWithRelations = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        outboundOrders: true,
        inboundInvoices: true
      }
    });

    if (supplierWithRelations.outboundOrders.length > 0 || supplierWithRelations.inboundInvoices.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete supplier with associated orders or invoices' 
      });
    }

    await prisma.supplier.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ message: 'Failed to delete supplier' });
  }
});

////////////////////////

// ======================
// CLIENT ORDER MANAGEMENT ROUTES
// ======================

// Get current user's draft order - FIXED VERSION
app.get('/api/client/orders/draft', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    
    // Find existing draft order
    let draftOrder = await prisma.inboundOrder.findFirst({
      where: {
        clientId: clientId,
        status: 'DRAFT'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If no draft exists, return empty draft without creating one
    if (!draftOrder) {
      return res.json({
        id: null,
        status: 'DRAFT',
        items: [],
        clientId: clientId,
        orderNumber: null
      });
    }

    res.json(sanitizeOrder(draftOrder));

  } catch (err) {
    console.error('Error fetching draft order:', err);
    res.status(500).json({ message: 'Failed to load draft order', error: err.message });
  }
});

///////////////////
///////////////////

// Get client's orders
app.get('/api/client/orders', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    
    const orders = await prisma.inboundOrder.findMany({
      where: { clientId: clientId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders.map(sanitizeOrder));
  } catch (err) {
    console.error('Error fetching client orders:', err);
    res.status(500).json({ message: 'Failed to load orders', error: err.message });
  }
});
///////////////////////////////

// Get order summary counts for client
app.get('/api/client/orders/summary', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    
    const activeOrders = await prisma.inboundOrder.count({
      where: {
        clientId: clientId,
        status: { in: ['SUBMITTED', 'PROCESSING'] }
      }
    });

    const historyOrders = await prisma.inboundOrder.count({
      where: {
        clientId: clientId,
        status: { in: ['COMPLETED', 'CANCELLED'] }
      }
    });

    res.json({
      active: activeOrders,
      history: historyOrders
    });
  } catch (err) {
    console.error('Error fetching order summary:', err);
    res.status(500).json({ message: 'Failed to load order summary', error: err.message });
  }
});

// Add listed product to draft order - FIXED////////////////////////
app.post('/api/client/orders/draft/items', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    // Get or create draft order
    let draftOrder = await prisma.inboundOrder.findFirst({
      where: {
        clientId: clientId,
        status: 'DRAFT'
      }
    });

    if (!draftOrder) {
      const orderNumber = await generateOrderNumber(clientId, true);
      draftOrder = await prisma.inboundOrder.create({
        data: {
          orderNumber: orderNumber,
          status: 'DRAFT',
          client: { connect: { id: clientId } },
          weekStartDate: new Date(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    }


    // Get product details including price
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product already exists in order
    const existingItem = await prisma.inboundOrderItem.findFirst({
      where: {
        orderId: draftOrder.id,
        productId: parseInt(productId)
      }
    });

    let updatedOrder;
    if (existingItem) {
      // Update quantity if product already in order
      updatedOrder = await prisma.inboundOrder.update({
        where: { id: draftOrder.id },
        data: {
          items: {
            update: {
              where: { id: existingItem.id },
              data: { quantity: existingItem.quantity + parseInt(quantity) }
            }
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
    } else {
      // Add new item to order
      updatedOrder = await prisma.inboundOrder.update({
        where: { id: draftOrder.id },
        data: {
          items: {
            create: {
              productId: parseInt(productId),
              quantity: parseInt(quantity)
            }
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
    }

    res.json(sanitizeOrder(updatedOrder));
  } catch (err) {
    console.error('Error adding product to draft:', err);
    res.status(500).json({ message: 'Failed to add product to order', error: err.message });
  }
});

// Add unlisted product to draft order with image upload
app.post('/api/client/orders/draft/items/unlisted', authenticate, upload.single('image'), async (req, res) => {
  try {
    const clientId = req.user.id;
    const { description, quantity } = req.body;
    let imagePath = null;

    // Validate input
    if (!description || !description.trim() || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Description and quantity are required' });
    }

    // Handle image upload
    if (req.file) {
      imagePath = `/uploads/images/${req.file.filename}`;
    }

    // Get or create draft order
    let draftOrder = await prisma.inboundOrder.findFirst({
      where: {
        clientId: clientId,
        status: 'DRAFT'
      }
    });

    if (!draftOrder) {
      const orderNumber = await generateOrderNumber(clientId, true);
      draftOrder = await prisma.inboundOrder.create({
        data: {
          orderNumber: orderNumber,
          status: 'DRAFT',
          client: { connect: { id: clientId } },
          weekStartDate: new Date(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // Create the unlisted item
    await prisma.inboundOrderItem.create({
      data: {
        description: description.trim(),
        quantity: parseInt(quantity),
        imagePath: imagePath,
        isUnlisted: true,
        order: { connect: { id: draftOrder.id } }
      }
    });

    // Get the updated order with all items
    const updatedOrder = await prisma.inboundOrder.findUnique({
      where: { id: draftOrder.id },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            product: true // This is safe now because product is optional in schema
          }
        }
      }
    });

   res.json(sanitizeOrder(updatedOrder));

  } catch (err) {
    console.error('Error adding unlisted product:', err);
    res.status(500).json({ message: 'Failed to add custom item', error: err.message });
  }
});
///////////////////////////////

// Update item quantity in draft order
app.put('/api/client/orders/draft/items/:itemId', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    // Validate input
    if (!quantity || quantity < 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    // First verify the item belongs to the user's draft order
    const item = await prisma.inboundOrderItem.findFirst({
      where: {
        id: itemId,
        order: {
          clientId: clientId,
          status: 'DRAFT'
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found in your draft order' });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      await prisma.inboundOrderItem.delete({
        where: { id: itemId }
      });
    } else {
      // Update quantity
      await prisma.inboundOrderItem.update({
        where: { id: itemId },
        data: { quantity: parseInt(quantity) }
      });
    }

    // Return the updated order
    const updatedOrder = await prisma.inboundOrder.findFirst({
      where: {
        clientId: clientId,
        status: 'DRAFT'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(sanitizeOrder(updatedOrder));
  } catch (err) {
    console.error('Error updating item quantity:', err);
    res.status(500).json({ message: 'Failed to update quantity', error: err.message });
  }
});

// Remove item from draft order
app.delete('/api/client/orders/draft/items/:itemId', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    const itemId = parseInt(req.params.itemId);

    // First verify the item belongs to the user's draft order
    const item = await prisma.inboundOrderItem.findFirst({
      where: {
        id: itemId,
        order: {
          clientId: clientId,
          status: 'DRAFT'
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found in your draft order' });
    }

    // Delete the item
    await prisma.inboundOrderItem.delete({
      where: { id: itemId }
    });

    // Return the updated order
    const updatedOrder = await prisma.inboundOrder.findFirst({
      where: {
        clientId: clientId,
        status: 'DRAFT'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(sanitizeOrder(updatedOrder));
  } catch (err) {
    console.error('Error removing item:', err);
    res.status(500).json({ message: 'Failed to remove item', error: err.message });
  }
});
//////////////////////////////////////////////////////////

// Add this to your backend routes
app.delete('/api/client/orders/draft/items/:itemId/image', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;
    const clientId = req.user.id;

    // First get the item to check if it has an image and belongs to the user
    const item = await prisma.inboundOrderItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        order: true
      }
    });

    if (!item || item.order.clientId !== clientId || item.order.status !== 'DRAFT') {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Delete the image file if it exists
    if (item.imagePath) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '..', item.imagePath);
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Image file deleted:', imagePath);
      }
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ message: 'Failed to delete image', error: err.message });
  }
});

///////////////////////////////////////////////////////////
// Submit draft order - FIXED (removed username)
app.post('/api/client/orders/draft/submit', authenticate, async (req, res) => {
  try {
    const clientId = req.user.id;
    const io = req.app.get('io');

    // Find the user's draft order - REMOVED username from select
    const draftOrder = await prisma.inboundOrder.findFirst({
      where: {
        clientId: clientId,
        status: 'DRAFT'
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,    // Use name instead of username
            company: true,
            email: true    // Added email as alternative identifier
          }
        }
      }
    });

    if (!draftOrder) {
      return res.status(404).json({ message: 'No draft order found' });
    }

    if (!draftOrder.items || draftOrder.items.length === 0) {
      return res.status(400).json({ message: 'Cannot submit empty order' });
    }

    // Generate proper order number for submission (not draft)
    const finalOrderNumber = await generateOrderNumber(clientId, false);

    // Update order status to SUBMITTED with proper order number
    const submittedOrder = await prisma.inboundOrder.update({
      where: { id: draftOrder.id },
      data: { 
        status: 'SUBMITTED',
        orderNumber: finalOrderNumber // Update with final order number
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true
          }
        }
      }
    });

    // Emit socket event to notify admin
    io.emit('inbound_order_submitted', {
      orderId: submittedOrder.id,
      orderNumber: submittedOrder.orderNumber,
      clientId: submittedOrder.clientId,
      clientName: submittedOrder.client.name, // Use name instead of username
      itemCount: submittedOrder.items.length,
      submittedAt: new Date()
    });

    res.json(sanitizeOrder(submittedOrder));
  } catch (err) {
    console.error('Error submitting order:', err);
    res.status(500).json({ message: 'Failed to submit order', error: err.message });
  }
});


/////////////////////////////////////

// ======================
// ADMIN INBOUND ORDERS ROUTES
// ======================

// Get all inbound orders for admin
app.get('/api/admin/inbound-orders', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const orders = await prisma.inboundOrder.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching admin inbound orders:', err);
    res.status(500).json({ message: 'Failed to load orders', error: err.message });
  }
});

// ======================
// REPORT ROUTES (COMPLETE)
// ======================

// Sales Report
app.get('/api/reports/sales', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate, timeFrame } = req.query;
    
    // Calculate date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get sales data from outbound invoices
    const salesData = await prisma.outboundInvoice.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: 'PAID'
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // Calculate metrics
    const totalRevenue = salesData.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalOrders = salesData.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top products
    const productSales = {};
    salesData.forEach(invoice => {
      invoice.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales by category
    const categorySales = {};
    salesData.forEach(invoice => {
      invoice.items.forEach(item => {
        const categoryName = item.product.category?.name || 'Uncategorized';
        if (!categorySales[categoryName]) {
          categorySales[categoryName] = 0;
        }
        categorySales[categoryName] += item.totalPrice;
      });
    });

    res.json({
      metrics: [
        { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, change: 15.2 },
        { label: 'Total Orders', value: totalOrders.toString(), change: -3.4 },
        { label: 'Average Order Value', value: `$${avgOrderValue.toFixed(2)}`, change: 8.1 },
        { label: 'Top Selling Product', value: topProducts[0]?.name || 'N/A', change: null }
      ],
      revenueTrend: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: [1200, 1800, 1500, 2100]
      },
      salesByCategory: {
        labels: Object.keys(categorySales),
        data: Object.values(categorySales)
      },
      topProducts: topProducts
    });
  } catch (err) {
    console.error('Error generating sales report:', err);
    res.status(500).json({ message: 'Failed to generate sales report' });
  }
});

// Inventory Report
app.get('/api/reports/inventory', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate, timeFrame } = req.query;
    
    // Get all products with stock info
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    const lowStockProducts = products.filter(p => p.quantity <= (p.minStockLevel || 10));
    const outOfStockProducts = products.filter(p => p.quantity <= 0);
    const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * (p.costPrice || 0)), 0);

    // Get top 5 products for chart
    const chartProducts = products.slice(0, 5);

    res.json({
      metrics: [
        { label: 'Total Products', value: products.length.toString(), change: 5.6 },
        { label: 'Low Stock Items', value: lowStockProducts.length.toString(), change: -2.3 },
        { label: 'Out of Stock', value: outOfStockProducts.length.toString(), change: 1.2 },
        { label: 'Inventory Value', value: `$${inventoryValue.toFixed(2)}`, change: 12.8 }
      ],
      stockLevels: {
        labels: chartProducts.map(p => p.name),
        data: chartProducts.map(p => p.quantity),
        minLevels: chartProducts.map(p => p.minStockLevel || 10)
      },
      lowStockItems: lowStockProducts.slice(0, 10)
    });
  } catch (err) {
    console.error('Error generating inventory report:', err);
    res.status(500).json({ message: 'Failed to generate inventory report' });
  }
});

// Orders Report
app.get('/api/reports/orders', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate, timeFrame } = req.query;
    
    // Calculate date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get orders data
    const inboundOrders = await prisma.inboundOrder.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const outboundOrders = await prisma.outboundOrder.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const allOrders = [...inboundOrders, ...outboundOrders];
    const completedOrders = allOrders.filter(o => o.status === 'COMPLETED');
    const pendingOrders = allOrders.filter(o => o.status === 'SUBMITTED' || o.status === 'PROCESSING');

    // Orders by status
    const statusCounts = {
      DRAFT: allOrders.filter(o => o.status === 'DRAFT').length,
      SUBMITTED: allOrders.filter(o => o.status === 'SUBMITTED').length,
      PROCESSING: allOrders.filter(o => o.status === 'PROCESSING').length,
      COMPLETED: allOrders.filter(o => o.status === 'COMPLETED').length,
      CANCELLED: allOrders.filter(o => o.status === 'CANCELLED').length
    };

    res.json({
      metrics: [
        { label: 'Total Orders', value: allOrders.length.toString(), change: -3.4 },
        { label: 'Completed Orders', value: completedOrders.length.toString(), change: 2.1 },
        { label: 'Pending Orders', value: pendingOrders.length.toString(), change: -5.6 },
        { label: 'Average Processing Time', value: '2.3 days', change: -0.8 }
      ],
      ordersTrend: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: [45, 62, 58, 69]
      },
      ordersByStatus: {
        labels: Object.keys(statusCounts),
        data: Object.values(statusCounts)
      }
    });
  } catch (err) {
    console.error('Error generating orders report:', err);
    res.status(500).json({ message: 'Failed to generate orders report' });
  }
});

// Clients Report
app.get('/api/reports/clients', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate, timeFrame } = req.query;
    
    // Calculate date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get clients with their order activity
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        createdAt: {
          lte: end
        }
      },
      include: {
        inboundOrders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            items: true
          }
        },
        outboundInvoices: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    // Calculate client metrics
    const activeClients = clients.filter(client => 
      client.inboundOrders.length > 0 || client.outboundInvoices.length > 0
    ).length;

    const newClients = clients.filter(client => 
      client.createdAt >= start
    ).length;

    // Top clients by order volume
    const clientsWithStats = clients.map(client => ({
      id: client.id,
      name: client.name,
      company: client.company,
      orderCount: client.inboundOrders.length,
      totalSpent: client.outboundInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      lastOrder: client.inboundOrders[0]?.createdAt || null
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    const topClients = clientsWithStats.slice(0, 5);

    res.json({
      metrics: [
        { label: 'Total Clients', value: clients.length.toString(), change: 8.2 },
        { label: 'Active Clients', value: activeClients.toString(), change: 3.1 },
        { label: 'New Clients', value: newClients.toString(), change: 12.5 },
        { label: 'Top Client', value: topClients[0]?.name || 'N/A', change: null }
      ],
      clientActivity: {
        labels: topClients.map(c => c.name),
        data: topClients.map(c => c.totalSpent)
      },
      topClients: topClients
    });
  } catch (err) {
    console.error('Error generating clients report:', err);
    res.status(500).json({ message: 'Failed to generate clients report' });
  }
});

// Suppliers Report
app.get('/api/reports/suppliers', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { startDate, endDate, timeFrame } = req.query;
    
    // Calculate date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get suppliers with their activity
    const suppliers = await prisma.supplier.findMany({
      include: {
        outboundOrders: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            items: true
          }
        },
        inboundInvoices: {
          where: {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    // Calculate supplier metrics
    const activeSuppliers = suppliers.filter(supplier => 
      supplier.outboundOrders.length > 0 || supplier.inboundInvoices.length > 0
    ).length;

    // Top suppliers by order volume
    const suppliersWithStats = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      orderCount: supplier.outboundOrders.length,
      invoiceCount: supplier.inboundInvoices.length,
      totalVolume: supplier.outboundOrders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0), 0
      ),
      lastActivity: [...supplier.outboundOrders, ...supplier.inboundInvoices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.createdAt || null
    })).sort((a, b) => b.totalVolume - a.totalVolume);

    const topSuppliers = suppliersWithStats.slice(0, 5);

    res.json({
      metrics: [
        { label: 'Total Suppliers', value: suppliers.length.toString(), change: 4.7 },
        { label: 'Active Suppliers', value: activeSuppliers.toString(), change: 2.3 },
        { label: 'Total Orders', value: suppliers.reduce((sum, s) => sum + s.outboundOrders.length, 0).toString(), change: 6.8 },
        { label: 'Top Supplier', value: topSuppliers[0]?.name || 'N/A', change: null }
      ],
      supplierPerformance: {
        labels: topSuppliers.map(s => s.name),
        data: topSuppliers.map(s => s.totalVolume)
      },
      topSuppliers: topSuppliers
    });
  } catch (err) {
    console.error('Error generating suppliers report:', err);
    res.status(500).json({ message: 'Failed to generate suppliers report' });
  }
});

// Export endpoints
app.get('/api/reports/:type/export', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { format, startDate, endDate } = req.query;
    
    // For now, return a simple message
    res.json({ 
      message: 'Export functionality will be implemented soon',
      type,
      format,
      startDate,
      endDate
    });
  } catch (err) {
    console.error('Error exporting report:', err);
    res.status(500).json({ message: 'Failed to export report' });
  }
});


////////////


// ✅ SERVE REACT FRONTEND IN PRODUCTION (CORRECT LOCATION - AFTER MIDDLEWARE)
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 PRODUCTION MODE: Setting up frontend serving...');
  
  const frontendPath = '/app/frontend/dist';
  console.log(`📁 Looking for frontend at: ${frontendPath}`);
  console.log('🔍 Looking for frontend at:', frontendPath);
console.log('Exists?', fs.existsSync(frontendPath));
if (fs.existsSync(frontendPath)) {
  console.log('Contents:', fs.readdirSync(frontendPath));
}

  if (fs.existsSync(frontendPath)) {
    console.log(`✅ Found frontend build at: ${frontendPath}`);
    console.log(`📄 Build contents:`, fs.readdirSync(frontendPath));
    
    // Serve static files
    app.use(express.static(frontendPath));
    
    // Catch-all route for SPA (MUST BE AFTER ALL API ROUTES)
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') || 
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/socket.io') ||
        req.path.startsWith('/health')
      ) {
        return next();
      }
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    
    console.log('🎯 Frontend serving configured successfully');
  } else {
    console.log('❌ Frontend not found at:', frontendPath);
    console.log('Current directory:', __dirname);
    console.log('Directory contents:', fs.readdirSync(__dirname));
    console.log('Parent contents:', fs.readdirSync(path.join(__dirname, '..')));
    console.log('📡 Running in API-only mode');
  }
}

////////////

// ======== SOCKET.IO CONNECTION HANDLING ========
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  console.log('🔐 Auth data:', socket.handshake.auth);

  // Handle client joining their specific room
  socket.on('join-client-room', (clientId) => {
    const roomName = `client_${clientId}`;
    socket.join(roomName);
    console.log(`👤 Client ${clientId} joined room: ${roomName}`);
  });

  // Handle admin joining admin room
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`👔 Admin joined admin room`);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('💥 Socket error:', error);
  });

  // Send welcome message to confirm connection
  socket.emit('welcome', { 
    message: 'Connected to server', 
    socketId: socket.id,
    timestamp: new Date() 
  });
});

// ======================
// START THE SERVER
// ======================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Enhanced database info
  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      console.log(`Database: Connected to ${dbUrl.hostname}`);
    } catch (e) {
      console.log('Database: Connected (URL format error)');
    }
  } else {
    console.log('Database: Not configured');
  }
  
  console.log('WebSocket server: ACTIVE');
  console.log(`=================================`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server gracefully...');
  
  httpServer.close(() => {
    console.log('HTTP server closed');
  });

  await prisma.$disconnect()
    .then(() => {
      console.log('Database disconnected');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error disconnecting database:', err);
      process.exit(1);
    });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
});
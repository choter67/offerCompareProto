import passport from "passport";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { Strategy as AppleStrategy } from "passport-apple";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(crypto.scrypt);

// Password hashing function
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Password verification function
async function verifyPassword(storedPassword: string | null, suppliedPassword: string): Promise<boolean> {
  if (!storedPassword) return false;
  
  const [hashedPassword, salt] = storedPassword.split(".");
  const hashedBuf = Buffer.from(hashedPassword, "hex");
  const suppliedBuf = await scryptAsync(suppliedPassword, salt, 64) as Buffer;
  
  // Compare using a timing-safe function to prevent timing attacks
  try {
    return hashedBuf.length === suppliedBuf.length && 
      crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    return false;
  }
}

export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "offercompare-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: false,
      sameSite: "lax"
    },
    store: storage.sessionStore
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure local strategy for username/password authentication
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      // Get user by username
      const user = await storage.getUserByUsername(username);
      
      // Check if user exists and password is correct
      if (!user || !(await verifyPassword(user.password, password))) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // Configure Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await storage.getUserByGoogleId(profile.id);
        
        if (!user) {
          // Check if email is already registered
          const email = profile.emails?.[0].value;
          if (email) {
            user = await storage.getUserByEmail(email);
            
            if (user) {
              // Link Google ID to existing account
              user = await storage.updateUserStripeInfo(user.id, profile.id);
            } else {
              // Create new user
              user = await storage.createUser({
                username: profile.displayName,
                email,
                googleId: profile.id,
                password: null
              });
            }
          } else {
            return done(new Error("No email found in Google profile"), null);
          }
        }
        
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));
  }

  // Configure Apple OAuth
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
      callbackURL: "/api/auth/apple/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await storage.getUserByAppleId(profile.id);
        
        if (!user) {
          // Check if email is already registered
          const email = profile.emails?.[0].value;
          if (email) {
            user = await storage.getUserByEmail(email);
            
            if (user) {
              // Link Apple ID to existing account
              user = await storage.updateUserStripeInfo(user.id, profile.id);
            } else {
              // Create new user
              user = await storage.createUser({
                username: profile.displayName || `User-${crypto.randomBytes(4).toString('hex')}`,
                email,
                appleId: profile.id,
                password: null
              });
            }
          } else {
            return done(new Error("No email found in Apple profile"), null);
          }
        }
        
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));
  }

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Authentication routes
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
  }));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/auth/apple", passport.authenticate("apple"));

  app.get("/api/auth/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/auth" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        googleId: null,
        appleId: null,
      });
      
      // Auto login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    
    res.json(req.user);
  });
}

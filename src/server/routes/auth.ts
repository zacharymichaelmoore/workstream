import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const authRouter = Router();

// Helper: create a client scoped to the user's token
function userClient(token: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// Simple email regex for basic validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Signup
authRouter.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const admin = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await admin.auth.signUp({
    email,
    password,
    options: { data: { name: name.trim() } },
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({
    user: data.user,
    session: data.session,
  });
});

// Signin
authRouter.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const admin = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({
    user: data.user,
    session: data.session,
  });
});

// Signout
authRouter.post('/api/auth/signout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  const client = userClient(token);
  await client.auth.signOut();
  res.json({ ok: true });
});

// Get current user profile
authRouter.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  const admin = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
  res.json({ user, profile });
});

// Refresh session
authRouter.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  const admin = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await admin.auth.refreshSession({ refresh_token });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ session: data.session, user: data.user });
});

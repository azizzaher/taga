import express from 'express';
import cookieParser from 'cookie-parser';
import registerRoute from './routes/register.js';
import loginRoute from './routes/login.js';
import sessionRoute from './routes/session.js';
import adminRoute from './routes/admin.js';
import plansRoute from './routes/plans.js';
import profileRoute from './routes/profile.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ROUTES
app.use('/api/auth', registerRoute);
app.use('/api/auth', loginRoute);
app.use('/api/auth', sessionRoute);
app.use('/api/admin', adminRoute);
app.use('/api/plans', plansRoute);
app.use('/api/profile', profileRoute);

app.use('/api', (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}.` });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  if (err.type === 'entity.too.large')
    return res.status(413).json({ error: 'The request body is too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

export default app;

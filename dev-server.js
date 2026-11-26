import app from './server/index.js';

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running at http://localhost:${port}`));
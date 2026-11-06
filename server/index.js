const path = require('node:path');
const express = require('express');
const api = require('./routes/api');

const app = express();
const port = Number(process.env.PORT) || 3000;
const portfolioRoot = path.join(__dirname, '..');

app.use(express.json({ limit: '20kb' }));
app.use('/api', api);
app.use('/ritual', express.static(path.join(__dirname, '..', 'public')));
app.get('/ritual', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.use('/assets', express.static(path.join(portfolioRoot, 'assets')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(portfolioRoot, 'styles.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(portfolioRoot, 'script.js')));
app.get('*', (req, res) => res.sendFile(path.join(portfolioRoot, 'index.html')));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'invalid JSON body' });
  console.error(error);
  return res.status(500).json({ error: 'internal server error' });
});

if (require.main === module) app.listen(port, () => console.log(`Tracker running at http://localhost:${port}`));

module.exports = app;

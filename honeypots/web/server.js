import express from 'express';
import morgan from 'morgan';

const PORT = process.env.PORT || 80;
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

const app = express();

// --- Middleware ---
app.use(morgan(':date[iso] :remote-addr ":method :url" :status — :user-agent'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Fake Vulnerable Pages ---

// Homepage — appears to be a real site
app.get('/', (req, res) => {
  res.send(`
    <!doctype html>
    <html><head><title>Acme Corp — Internal Portal</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:Arial,sans-serif;max-width:600px;margin:80px auto;text-align:center;background:#f5f5f5}
    h1{color:#333}form{background:#fff;padding:24px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    input{display:block;width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:4px}
    button{background:#0070f3;color:#fff;border:none;padding:10px 24px;border-radius:4px;cursor:pointer}
    .error{color:#e00;font-size:14px;margin-top:8px}</style></head>
    <body>
      <h1>Acme Corp Internal Portal</h1>
      <form method="POST" action="/login">
        <h2>Sign In</h2>
        <input type="text" name="username" placeholder="Username" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">Log In</button>
      </form>
      <p style="margin-top:16px;font-size:12px;color:#999">Authorized personnel only. All access is logged.</p>
    </body></html>
  `);
});

// Login — always "fails" but logs credentials
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Log to backend
  reportAttack({
    sourceIp: req.ip,
    attackType: 'credential_stuffing',
    protocol: 'HTTP',
    port: 80,
    payload: { username, password },
  });

  // Always return "invalid credentials" — keeps them trying
  res.send(`
    <!doctype html>
    <html><head><title>Login Failed — Acme Corp</title>
    <style>body{font-family:Arial;max-width:400px;margin:80px auto;text-align:center}
    .error{color:#e00;background:#fee;padding:16px;border-radius:4px}</style></head>
    <body>
      <div class="error">Invalid username or password.</div>
      <p><a href="/">Try again</a></p>
    </body></html>
  `);
});

// Fake admin panel
app.get('/admin', (req, res) => {
  reportAttack({
    sourceIp: req.ip,
    attackType: 'web_exploit',
    protocol: 'HTTP',
    port: 80,
    payload: { path: '/admin' },
  });

  res.status(403).send(`
    <!doctype html>
    <html><head><title>403 — Acme Corp</title>
    <style>body{font-family:Arial;max-width:400px;margin:80px auto;text-align:center}
    h1{color:#e00}</style></head>
    <body><h1>403 Forbidden</h1><p>Access denied. This incident has been reported.</p></body></html>
  `);
});

// Fake API endpoint (appears vulnerable)
app.all('/api/v1/users', (req, res) => {
  reportAttack({
    sourceIp: req.ip,
    attackType: 'web_exploit',
    protocol: 'HTTP',
    port: 80,
    payload: { method: req.method, path: '/api/v1/users', query: req.query },
  });

  res.json({ error: 'unauthorized', message: 'Valid API key required' });
});

// Fake .env file
app.get('/.env', (req, res) => {
  reportAttack({
    sourceIp: req.ip,
    attackType: 'web_exploit',
    protocol: 'HTTP',
    port: 80,
    payload: { path: '/.env' },
  });

  res.status(403).send(`# Access denied — attempt logged\nDB_HOST=localhost\nDB_PASS=***REDACTED***\n`);
});

// phpMyAdmin honeytrap
app.all('/phpmyadmin/*', (req, res) => {
  reportAttack({
    sourceIp: req.ip,
    attackType: 'sql_injection',
    protocol: 'HTTP',
    port: 80,
    payload: { path: req.path },
  });

  res.status(403).send('Access denied.');
});

// Wordpress admin trap
app.all('/wp-admin/*', (req, res) => {
  reportAttack({
    sourceIp: req.ip,
    attackType: 'credential_stuffing',
    protocol: 'HTTP',
    port: 80,
    payload: { path: req.path },
  });

  res.status(200).send(`
    <!doctype html>
    <html><head><title>WordPress › Log In</title>
    <style>body{font-family:Arial;max-width:320px;margin:60px auto;background:#f0f0f1}
    form{background:#fff;padding:24px;border:1px solid #c3c4c7}
    input{display:block;width:100%;padding:8px;margin:6px 0;border:1px solid #8c8f94}
    button{display:block;width:100%;padding:8px;background:#2271b1;color:#fff;border:none;margin-top:10px;cursor:pointer}</style></head>
    <body>
      <form method="POST" action="/wp-login.php">
        <input type="text" name="log" placeholder="Username or Email" />
        <input type="password" name="pwd" placeholder="Password" />
        <button type="submit">Log In</button>
      </form>
    </body></html>
  `);
});

// WP login
app.post('/wp-login.php', (req, res) => {
  const { log, pwd } = req.body;
  reportAttack({
    sourceIp: req.ip,
    attackType: 'credential_stuffing',
    protocol: 'HTTP',
    port: 80,
    payload: { username: log, password: pwd, target: 'wordpress' },
  });
  res.redirect('/wp-admin/');
});

// Catch-all — log anything else
app.all('*', (req, res) => {
  reportAttack({
    sourceIp: req.ip,
    attackType: 'port_scan',
    protocol: 'HTTP',
    port: 80,
    payload: { method: req.method, path: req.path, headers: req.headers },
  });

  res.status(404).send('Not Found');
});

// --- Reporting ---
function reportAttack(data) {
  try {
    fetch(`${BACKEND_URL}/api/honeypot/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {}); // silently ignore if backend is down
  } catch {}
}

// --- Start ---
app.listen(PORT, () => {
  console.log(`[Web Honeypot] Listening on port ${PORT}`);
  console.log(`[Web Honeypot] Reporting to ${BACKEND_URL}`);
});

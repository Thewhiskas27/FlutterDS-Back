require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: process.env.DB_USER, 
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à MySQL:', err);
    return;
  }
  console.log('Connecté à MySQL');
});

// 🔐 Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, password_hash],
    (err) => {
      if (err) return res.status(500).json({ error: 'Utilisateur déjà existant ou erreur serveur' });
      res.status(201).json({ message: 'Utilisateur enregistré' });
    }
  );
});

// Connexion
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash); // ✅ FIXED: use bcrypt.compare

    if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ userId: user.id }, '0c6337cac0523c47', { expiresIn: '1h' });
    res.json({ token });
  });
});

// MiddleWare
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, '0c6337cac0523c47', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Route réservations avec jwt

app.post('/reservations', authenticate, (req, res) => {
  const { name, numberOfPeople, date, time } = req.body;

  // Convert time to a DateTime object
  const requestedStart = new Date(`${date}T${time}`);
  const requestedEnd = new Date(requestedStart.getTime() + 30 * 60000); // +30 minutes

  // Query to check for overlapping reservations
  const sql = `
    SELECT * FROM reservations
    WHERE date = ?
    AND (
      (TIME(?) BETWEEN time AND ADDTIME(time, '00:30:00')) OR
      (TIME(?) BETWEEN time AND ADDTIME(time, '00:30:00'))
    )
  `;

  db.query(sql, [date, time, time], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      return res.status(409).json({ error: 'Ce créneau est déjà réservé. Veuillez choisir un autre horaire.' });
    }

    // If no conflict, insert the reservation
    const insertSql = 'INSERT INTO reservations (name, number_of_people, date, time) VALUES (?, ?, ?, ?)';
    db.query(insertSql, [name, numberOfPeople, date, time], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Réservation enregistrée', id: result.insertId });
    });
  });
});

// Route des temps disponibles au cas où c'est déjà pris

app.get('/available-slots', (req, res) => {
  const { date } = req.query;

  const openingHour = 12;
  const closingHour = 22;
  const slotInterval = 5; // minutes
  const reservationDuration = 29; // minutes

  const allSlots = [];
  for (let hour = openingHour; hour < closingHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotInterval) {
      const slot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      allSlots.push(slot);
    }
  }

  db.query('SELECT time FROM reservations WHERE date = ?', [date], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const takenSlots = results.map(r => r.time.slice(0, 5)); // 'HH:MM'

    // Build a set of blocked slots (each reservation blocks 30 minutes)
    const blockedSlots = new Set();
    for (const time of takenSlots) {
      const [hour, minute] = time.split(':').map(Number);
      const start = new Date(0, 0, 0, hour, minute);
      for (let i = 0; i < reservationDuration; i += slotInterval) {
        const blocked = new Date(start.getTime() + i * 60000);
        const blockedStr = `${blocked.getHours().toString().padStart(2, '0')}:${blocked.getMinutes().toString().padStart(2, '0')}`;
        blockedSlots.add(blockedStr);
      }
    }

    const availableSlots = allSlots.filter(slot => !blockedSlots.has(slot));
    res.json({ availableSlots });
  });
});

app.listen(3000, () => {
  console.log('API en cours d’exécution sur http://localhost:3000');
});
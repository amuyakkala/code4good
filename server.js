const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'dist'), { maxAge: '1d' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Connect to MongoDB
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Missing environment variables');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Schemas
const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  schedule: { type: String, required: true },
  reminders: [Date],
});

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  contactDetails: { type: String, required: true },
  medicalHistory: { type: String, required: true },
  moodLogs: [String],
  medications: [medicationSchema],
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }, // e.g., 'nurse', 'doctor', 'patient'
});

const Patient = mongoose.model('Patient', patientSchema);
const User = mongoose.model('User', userSchema);

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send({ error: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ error: 'Token invalid' });
    req.user = user;
    next();
  });
};

// API Endpoints

// Register a new user
app.post('/api/register', [
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty(),
  body('role').isIn(['nurse', 'doctor', 'patient'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).send({ error: 'Failed to register user' });
  }
});

// Login
app.post('/api/login', [
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user == null) return res.status(400).send({ error: 'Invalid username or password' });

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(400).send({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).send({ error: 'Failed to login' });
  }
});

// Add a new patient (for authorized roles)
app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'nurse') {
      return res.status(403).send({ error: 'Access forbidden: Only nurses can add patients' });
    }

    const { name, age, contactDetails, medicalHistory } = req.body;
    if (!name || !age || !contactDetails || !medicalHistory) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).send({ patient });
  } catch (error) {
    console.error('Error saving patient:', error.message);
    res.status(500).send({ error: 'Failed to save patient' });
  }
});

// Fetch all patients (accessible by any authenticated user)
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find();
    res.send(patients);
  } catch (error) {
    console.error('Error fetching patients:', error.message);
    res.status(500).send({ error: 'Failed to fetch patients' });
  }
});

// Add medication to a patient (for authorized roles)
app.post('/api/patients/:id/medications', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'nurse') {
      return res.status(403).send({ error: 'Access forbidden: Only nurses can add medications' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    const { name, dosage, schedule } = req.body;
    if (!name || !dosage || !schedule) {
      return res.status(400).send({ error: 'Missing required medication fields' });
    }

    patient.medications.push(req.body);
    await patient.save();
    res.status(201).send(patient);
  } catch (error) {
    console.error('Error adding medication:', error.message);
    res.status(500).send({ error: 'Failed to add medication' });
  }
});

// Fetch medications for a patient (accessible by any authenticated user)
app.get('/api/patients/:id/medications', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    res.send(patient.medications);
  } catch (error) {
    console.error('Error fetching medications:', error.message);
    res.status(500).send({ error: 'Failed to fetch medications' });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.name === 'SyntaxError' && err.status === 400 && err.body) {
    return res.status(400).send({ error: 'Invalid JSON' });
  }
  console.error(err.stack);
  res.status(500).send({ error: 'Internal Server Error' });
});

// Serve the React application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

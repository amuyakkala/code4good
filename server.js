const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const { generateSummary, generateRecommendations } = require('./llm');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS
app.use(express.static(path.join(__dirname, 'dist')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Schema
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

const Patient = mongoose.model('Patient', patientSchema);

// API Endpoints
app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();

    const summary = await generateSummary(req.body);
    const recommendations = await generateRecommendations(req.body);
    res.status(201).send({ patient, summary, recommendations });
  } catch (error) {
    console.error('Error saving patient:', error);
    res.status(500).send({ error: 'Failed to save patient' });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.send(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).send({ error: 'Failed to fetch patients' });
  }
});

app.post('/api/patients/:id/medications', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }

    patient.medications.push(req.body);
    await patient.save();
    res.status(201).send(patient);
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).send({ error: 'Failed to add medication' });
  }
});

app.get('/api/patients/:id/medications', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    res.send(patient.medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).send({ error: 'Failed to fetch medications' });
  }
});

// Serve the React application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

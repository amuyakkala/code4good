const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const { generateSummary, generateRecommendations } = require('./llm');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

mongoose.connect('mongodb://localhost:27017/patient-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  contactDetails: String,
  medicalHistory: String,
  moodLogs: [String],
  medications: [
    {
      name: String,
      dosage: String,
      schedule: String,
      reminders: [Date],
    },
  ],
});

const Patient = mongoose.model('Patient', patientSchema);

app.post('/api/patients', async (req, res) => {
  const patient = new Patient(req.body);
  await patient.save();

  const summary = await generateSummary(req.body);
  const recommendations = await generateRecommendations(req.body);
  res.status(201).send({ patient, summary, recommendations });
});

app.get('/api/patients', async (req, res) => {
  const patients = await Patient.find();
  res.send(patients);
});

app.post('/api/patients/:id/medications', async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  patient.medications.push(req.body);
  await patient.save();
  res.status(201).send(patient);
});

app.get('/api/patients/:id/medications', async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  res.send(patient.medications);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

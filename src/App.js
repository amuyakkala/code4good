import React, { useState } from 'react';

const App = () => {
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    contactDetails: '',
    medicalHistory: '',
    moodLogs: [],
    medications: [{ name: '', dosage: '', schedule: '', reminders: [] }],
  });

  // Handle input changes for the patient
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  // Handle changes to medication fields
  const handleMedicationChange = (index, e) => {
    const { name, value } = e.target;
    setPatient((prev) => {
      const medications = [...prev.medications];
      medications[index] = { ...medications[index], [name]: value };
      return { ...prev, medications };
    });
  };

  // Handle changes to reminder fields
  const handleReminderChange = (medIndex, reminderIndex, e) => {
    const { value } = e.target;
    setPatient((prev) => {
      const medications = [...prev.medications];
      medications[medIndex].reminders[reminderIndex] = value;
      return { ...prev, medications };
    });
  };

  // Add a new reminder field
  const addReminder = (index) => {
    setPatient((prev) => {
      const medications = [...prev.medications];
      medications[index].reminders.push('');
      return { ...prev, medications };
    });
  };

  // Add a new medication entry
  const addMedication = () => {
    setPatient((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', schedule: '', reminders: [] }],
    }));
  };

  // Remove a medication entry
  const removeMedication = (index) => {
    setPatient((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', patient); // Debug log

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response from server:', data);
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
  };

  return (
    <div>
      <h1>Patient Profile</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={patient.name}
          onChange={handleChange}
          placeholder="Name"
        />
        <input
          type="number"
          name="age"
          value={patient.age}
          onChange={handleChange}
          placeholder="Age"
        />
        <input
          type="text"
          name="contactDetails"
          value={patient.contactDetails}
          onChange={handleChange}
          placeholder="Contact Details"
        />
        <textarea
          name="medicalHistory"
          value={patient.medicalHistory}
          onChange={handleChange}
          placeholder="Medical History"
        />
        <h3>Medications</h3>
        {patient.medications.map((med, index) => (
          <div key={index}>
            <input
              type="text"
              name="name"
              value={med.name}
              onChange={(e) => handleMedicationChange(index, e)}
              placeholder="Medication Name"
            />
            <input
              type="text"
              name="dosage"
              value={med.dosage}
              onChange={(e) => handleMedicationChange(index, e)}
              placeholder="Dosage"
            />
            <input
              type="text"
              name="schedule"
              value={med.schedule}
              onChange={(e) => handleMedicationChange(index, e)}
              placeholder="Schedule"
            />
            <h4>Reminders</h4>
            {med.reminders.map((reminder, reminderIndex) => (
              <input
                key={reminderIndex}
                type="datetime-local"
                value={reminder}
                onChange={(e) => handleReminderChange(index, reminderIndex, e)}
              />
            ))}
            <button type="button" onClick={() => addReminder(index)}>
              Add Reminder
            </button>
            <button type="button" onClick={() => removeMedication(index)}>
              Remove Medication
            </button>
          </div>
        ))}
        <button type="button" onClick={addMedication}>
          Add Medication
        </button>
        <button type="submit">Save Patient</button>
      </form>
    </div>
  );
};

export default App;

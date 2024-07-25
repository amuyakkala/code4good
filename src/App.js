import React, { useState } from 'react';

const App = () => {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '' });
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    contactDetails: '',
    medicalHistory: '',
    moodLogs: [],
    medications: [{ name: '', dosage: '', schedule: '', reminders: [] }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleInputChange = (e, stateUpdater, data) => {
    const { name, value } = e.target;
    stateUpdater((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicationChange = (index, e) => {
    const { name, value } = e.target;
    setPatient((prev) => {
      const medications = [...prev.medications];
      medications[index] = { ...medications[index], [name]: value };
      return { ...prev, medications };
    });
  };

  const handleReminderChange = (medIndex, reminderIndex, e) => {
    const { value } = e.target;
    setPatient((prev) => {
      const medications = [...prev.medications];
      medications[medIndex].reminders[reminderIndex] = value;
      return { ...prev, medications };
    });
  };

  const addReminder = (index) => {
    setPatient((prev) => {
      const medications = [...prev.medications];
      medications[index].reminders.push('');
      return { ...prev, medications };
    });
  };

  const addMedication = () => {
    setPatient((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', schedule: '', reminders: [] }],
    }));
  };

  const removeMedication = (index) => {
    setPatient((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(patient),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server Error: ${errorData.error}`);
      }

      const data = await response.json();
      console.log('Patient saved successfully:', data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e, url, data, authCallback) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server Error: ${errorData.error}`);
      }

      const responseData = await response.json();
      localStorage.setItem('token', responseData.token);
      await authCallback();
      setUser({ ...responseData, role: 'nurse' }); // Adjust role assignment as needed
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      {user ? (
        <>
          <h1>Patient Profile</h1>
          {user.role === 'nurse' && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  name="name"
                  value={patient.name}
                  onChange={(e) => handleInputChange(e, setPatient, patient)}
                  placeholder="Name"
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="number"
                  name="age"
                  value={patient.age}
                  onChange={(e) => handleInputChange(e, setPatient, patient)}
                  placeholder="Age"
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  name="contactDetails"
                  value={patient.contactDetails}
                  onChange={(e) => handleInputChange(e, setPatient, patient)}
                  placeholder="Contact Details"
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <textarea
                  name="medicalHistory"
                  value={patient.medicalHistory}
                  onChange={(e) => handleInputChange(e, setPatient, patient)}
                  placeholder="Medical History"
                  style={{ width: '100%', padding: '8px', minHeight: '100px' }}
                />
              </div>
              <h3>Medications</h3>
              {patient.medications.map((med, index) => (
                <div key={index} style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    name="name"
                    value={med.name}
                    onChange={(e) => handleMedicationChange(index, e)}
                    placeholder="Medication Name"
                    style={{ width: '100%', padding: '8px' }}
                  />
                  <input
                    type="text"
                    name="dosage"
                    value={med.dosage}
                    onChange={(e) => handleMedicationChange(index, e)}
                    placeholder="Dosage"
                    style={{ width: '100%', padding: '8px' }}
                  />
                  <input
                    type="text"
                    name="schedule"
                    value={med.schedule}
                    onChange={(e) => handleMedicationChange(index, e)}
                    placeholder="Schedule"
                    style={{ width: '100%', padding: '8px' }}
                  />
                  <h4>Reminders</h4>
                  {med.reminders.map((reminder, reminderIndex) => (
                    <input
                      key={reminderIndex}
                      type="datetime-local"
                      value={reminder}
                      onChange={(e) => handleReminderChange(index, reminderIndex, e)}
                      style={{ display: 'block', marginBottom: '10px' }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addReminder(index)}
                    style={{ marginRight: '10px' }}
                  >
                    Add Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    style={{ marginRight: '10px' }}
                  >
                    Remove Medication
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMedication}
                style={{ marginRight: '10px' }}
              >
                Add Medication
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Patient'}
              </button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
          )}
          {user.role === 'doctor' && <p>Doctor functionality not implemented yet.</p>}
          {user.role === 'patient' && <p>Patient functionality not implemented yet.</p>}
        </>
      ) : (
        <>
          <h1>{isRegistering ? 'Register' : 'Login'}</h1>
          {isRegistering ? (
            <form onSubmit={(e) => handleAuth(e, '/api/register', registerData, handleLogin)}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={(e) => handleInputChange(e, setRegisterData, registerData)}
                  placeholder="Username"
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={(e) => handleInputChange(e, setRegisterData, registerData)}
                  placeholder="Password"
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => setIsRegistering(false)}>
                  Login
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={(e) => handleAuth(e, '/api/login', loginData, () => Promise.resolve())}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  name="username"
                  value={loginData.username}
                  onChange={(e) => handleInputChange(e, setLoginData, loginData)}
                  placeholder="Username"
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={(e) => handleInputChange(e, setLoginData, loginData)}
                  placeholder="Password"
                  style={{ width: '100%', padding: '8px' }}
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <p>
                Don't have an account?{' '}
                <button type="button" onClick={() => setIsRegistering(true)}>
                  Register
                </button>
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default App;

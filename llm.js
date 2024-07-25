const { OpenAI } = require('openai'); // Note: Check if this import matches your package version

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateSummary = async (patientData) => {
  const response = await openai.completions.create({
    model: 'text-davinci-003',
    prompt: `Generate a detailed summary for the following patient data:\n${JSON.stringify(patientData)}`,
    max_tokens: 150,
  });
  return response.choices[0].text;
};

const generateRecommendations = async (patientData) => {
  const response = await openai.completions.create({
    model: 'text-davinci-003',
    prompt: `Based on the following patient data, provide personalized recommendations for mental health and medication management:\n${JSON.stringify(patientData)}`,
    max_tokens: 150,
  });
  return response.choices[0].text;
};

module.exports = { generateSummary, generateRecommendations };

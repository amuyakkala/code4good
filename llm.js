const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateSummary(input) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Updated model name
      messages: [
        { role: 'user', content: `Generate a summary for: ${input.medicalHistory}` },
      ],
      max_tokens: 150,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

async function generateRecommendations(input) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Updated model name
      messages: [
        { role: 'user', content: `Generate recommendations for: ${input.medicalHistory}` },
      ],
      max_tokens: 150,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

module.exports = { generateSummary, generateRecommendations };

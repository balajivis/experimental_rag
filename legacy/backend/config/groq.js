import Groq from 'groq-sdk/index.mjs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;

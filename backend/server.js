const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// API key check endpoint
app.get('/api/check-api-key', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = apiKey && apiKey !== 'your_gemini_api_key_here';
  res.json({ configured: isConfigured });
});

// Routes
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfFile = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfFile);
    const extractedText = pdfData.text;

    // Store the extracted text in the request for the next middleware
    req.extractedText = extractedText;
    
    res.json({
      message: 'PDF uploaded and text extracted successfully',
      filename: req.file.filename,
      extractedText: extractedText
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Error processing PDF' });
  }
});

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.error('Error: Gemini API key not properly configured');
      return res.status(500).json({ error: 'API key not properly configured. Please add your Gemini API key to the .env file.' });
    }

    console.log('Making request to Gemini API...');
    
    // Call Google Gemini API to generate quiz questions
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Generate a quiz based on the following text. Create 5 multiple-choice questions (MCQs), 3 true/false questions, and 2 fill-in-the-blank questions. Format the response as a JSON object with the following structure: 
                  {
                    "mcq": [
                      {
                        "question": "Question text",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": "Correct option"
                      }
                    ],
                    "trueFalse": [
                      {
                        "question": "Question text",
                        "correctAnswer": true/false
                      }
                    ],
                    "fillInTheBlank": [
                      {
                        "question": "Question text with _____ for the blank",
                        "correctAnswer": "Answer for the blank"
                      }
                    ]
                  }
                  
                  Here is the text to base the quiz on: ${text.substring(0, 5000)}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        }
      );

      console.log('Received response from Gemini API');
      
      // Extract the generated quiz from the response
      if (!response.data || !response.data.candidates || !response.data.candidates[0] || 
          !response.data.candidates[0].content || !response.data.candidates[0].content.parts || 
          !response.data.candidates[0].content.parts[0]) {
        console.error('Error: Unexpected API response structure', JSON.stringify(response.data));
        return res.status(500).json({ error: 'Unexpected API response structure' });
      }
      
      const generatedContent = response.data.candidates[0].content.parts[0].text;
      console.log('Generated content:', generatedContent.substring(0, 200) + '...');
      
      // Extract the JSON part from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      let quizData;
      
      if (jsonMatch) {
        try {
          quizData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed quiz data');
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          return res.status(500).json({ error: 'Failed to parse quiz data from API response' });
        }
      } else {
        console.error('Error: No JSON object found in the API response');
        return res.status(500).json({ error: 'No JSON object found in the API response' });
      }

      res.json(quizData);
    } catch (apiError) {
      console.error('Error calling Gemini API:', apiError.message);
      if (apiError.response) {
        console.error('API response:', apiError.response.data);
      }
      return res.status(500).json({ error: 'Error calling Gemini API: ' + apiError.message });
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Error generating quiz' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
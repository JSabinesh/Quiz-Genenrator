# PDF Quiz Generator

A full-stack application that allows users to upload a PDF, extract text from it, and generate quiz questions using the Google Gemini API. The questions include multiple-choice questions (MCQs), true/false questions, and fill-in-the-blank questions, returned in structured JSON format.

## Features

- PDF upload and text extraction
- Quiz generation using Google Gemini API
- Multiple question types (MCQ, True/False, Fill-in-the-blank)
- Responsive UI with React and Bootstrap

## Tech Stack

### Backend
- Node.js
- Express.js
- pdf-parse (for PDF text extraction)
- axios (for API calls)

### Frontend
- React
- React Bootstrap
- Axios

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Replace `your_gemini_api_key_here` with your actual Google Gemini API key.

   **Important**: You need to obtain a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). If you don't have a valid API key, the quiz generation feature will not work.

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## How to Use

1. Upload a PDF file using the file input on the home page.
2. The application will extract text from the PDF and display it.
3. Click on "Generate Quiz" to create quiz questions based on the extracted text.
4. View and interact with the generated quiz questions.

## API Endpoints

- `POST /api/upload` - Upload a PDF file and extract text
- `POST /api/generate-quiz` - Generate quiz questions from text

## Notes

- The application uses the Google Gemini API for generating quiz questions. You need to obtain an API key from the Google AI Studio.
- The quiz generation may take some time depending on the length of the extracted text and the API response time.
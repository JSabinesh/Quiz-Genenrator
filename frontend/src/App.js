import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  
  // Check if API key is configured when component mounts
  useEffect(() => {
    const checkApiKeyStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/check-api-key');
        setApiKeyConfigured(response.data.configured);
      } catch (error) {
        // If the endpoint doesn't exist or returns an error, assume API key is not configured
        setApiKeyConfigured(false);
      }
    };
    
    checkApiKeyStatus();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setExtractedText(response.data.extractedText);
      setActiveTab('text');
      setLoading(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error uploading file. Please try again.');
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!extractedText) {
      setError('No text available. Please upload a PDF first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/generate-quiz', {
        text: extractedText
      });

      setQuiz(response.data);
      setActiveTab('quiz');
      setLoading(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
      
      // Display more detailed error message from the backend if available
      const errorMessage = error.response && error.response.data && error.response.data.error
        ? `Error: ${error.response.data.error}`
        : 'Error generating quiz. Please try again.';
      
      setError(errorMessage);
      setLoading(false);
    }
  };


  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-4">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h1 className="text-center mb-4">PDF Quiz Generator</h1>
              
              {!apiKeyConfigured && (
                <Alert variant="warning">
                  <strong>API Key Not Configured:</strong> The Google Gemini API key is not properly configured. 
                  Please add your API key to the <code>backend/.env</code> file to enable quiz generation. 
                  You can get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.
                </Alert>
              )}
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="upload" title="Upload PDF">
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Select a PDF file</Form.Label>
                      <Form.Control 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileChange} 
                      />
                    </Form.Group>
                    <Button 
                      variant="primary" 
                      onClick={handleUpload}
                      disabled={!file || loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          {' '}Loading...
                        </>
                      ) : (
                        'Upload and Extract Text'
                      )}
                    </Button>
                  </Form>
                </Tab>
                
                <Tab eventKey="text" title="Extracted Text" disabled={!extractedText}>
                  <div className="mb-3">
                    <h5>Extracted Text</h5>
                    <div className="border p-3 bg-light" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{extractedText}</pre>
                    </div>
                  </div>
                  <Button 
                    variant="success" 
                    onClick={handleGenerateQuiz}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        {' '}Generating Quiz...
                      </>
                    ) : (
                      'Generate Quiz'
                    )}
                  </Button>
                </Tab>
                
                <Tab eventKey="quiz" title="Quiz" disabled={!quiz}>
                  {quiz && (
                    <div>
                      <h4 className="mb-4">Generated Quiz</h4>
                      
                      <h5 className="mt-4">Multiple Choice Questions</h5>
                      {quiz.mcq.map((q, index) => (
                        <Card key={`mcq-${index}`} className="mb-3">
                          <Card.Body>
                            <Card.Title>Question {index + 1}</Card.Title>
                            <Card.Text>{q.question}</Card.Text>
                            <Form>
                              {q.options.map((option, optIndex) => (
                                <Form.Check
                                  key={`option-${optIndex}`}
                                  type="radio"
                                  id={`q${index}-opt${optIndex}`}
                                  label={option}
                                  name={`question-${index}`}
                                  className={option === q.correctAnswer ? 'text-success fw-bold' : ''}
                                />
                              ))}
                            </Form>
                            <div className="mt-2 text-success">
                              <strong>Correct Answer:</strong> {q.correctAnswer}
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      
                      <h5 className="mt-4">True/False Questions</h5>
                      {quiz.trueFalse.map((q, index) => (
                        <Card key={`tf-${index}`} className="mb-3">
                          <Card.Body>
                            <Card.Title>Question {index + 1}</Card.Title>
                            <Card.Text>{q.question}</Card.Text>
                            <Form>
                              <Form.Check
                                type="radio"
                                id={`q${index}-true`}
                                label="True"
                                name={`tf-question-${index}`}
                                className={q.correctAnswer === true ? 'text-success fw-bold' : ''}
                              />
                              <Form.Check
                                type="radio"
                                id={`q${index}-false`}
                                label="False"
                                name={`tf-question-${index}`}
                                className={q.correctAnswer === false ? 'text-success fw-bold' : ''}
                              />
                            </Form>
                            <div className="mt-2 text-success">
                              <strong>Correct Answer:</strong> {q.correctAnswer ? 'True' : 'False'}
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      
                      <h5 className="mt-4">Fill in the Blank Questions</h5>
                      {quiz.fillInTheBlank.map((q, index) => (
                        <Card key={`fib-${index}`} className="mb-3">
                          <Card.Body>
                            <Card.Title>Question {index + 1}</Card.Title>
                            <Card.Text>{q.question}</Card.Text>
                            <div className="mt-2 text-success">
                              <strong>Correct Answer:</strong> {q.correctAnswer}
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      
                      <div className="d-flex justify-content-between mt-4">
                        <Button variant="secondary" onClick={() => setActiveTab('text')}>
                          Back to Text
                        </Button>
                        <Button variant="primary" onClick={() => {
                          setFile(null);
                          setExtractedText('');
                          setQuiz(null);
                          setActiveTab('upload');
                        }}>
                          Start Over
                        </Button>
                      </div>
                    </div>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default App;

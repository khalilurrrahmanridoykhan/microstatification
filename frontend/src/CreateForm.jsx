import React, { useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Row, Col, Collapse, Form } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { BACKEND_URL } from './config';
import { toast } from 'sonner';

const CreateForm = () => {
  const location = useLocation();
  const { projectId } = location.state || {}; // Handle undefined state
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState([{ type: 'text', name: '', label: '', required: false, options: ['Option 1', 'Option 2'], subQuestions: [], parameters: '', hint: '', default: '', appearance: '', guidance_hint: '', hxl: '' }]);  // Initialize with one empty question
  const [showModal, setShowModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [openSettings, setOpenSettings] = useState({});

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'label') {
      const label = value;
      const name = label.toLowerCase().replace(/\s+/g, '_');
      newQuestions[index]['label'] = label;
      newQuestions[index]['name'] = name;
    } else if (field === 'parameters') {
      const [start, end, step] = value.split(';').map(param => param.split('=')[1]);
      newQuestions[index]['parameters'] = `start=${start};end=${end};step=${step}`;
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { type: 'text', name: '', label: '', required: false, options: ['Option 1', 'Option 2'], subQuestions: [], parameters: '', hint: '', default: '', appearance: '', guidance_hint: '', hxl: '' }]);
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleAddSubQuestion = (questionIndex) => {
    const newQuestions = [...questions];
    const list_id = newQuestions[questionIndex].list_id;
    newQuestions[questionIndex].subQuestions.push({
      type: `select_one ${list_id}`,
      name: newQuestions[questionIndex].name,
      label: '',
      required: false,
      appearance: 'list-nolabel',
      options: [...newQuestions[questionIndex].options]  // Use the same options for sub-questions
    });
    setQuestions(newQuestions);
  };

  const handleSubQuestionChange = (questionIndex, subQuestionIndex, field, value) => {
    const newQuestions = [...questions];
    if (field === 'label') {
      const label = value;
      const name = label.toLowerCase().replace(/\s+/g, '_');
      newQuestions[questionIndex].subQuestions[subQuestionIndex]['label'] = label;
      newQuestions[questionIndex].subQuestions[subQuestionIndex]['name'] = name;
    } else {
      newQuestions[questionIndex].subQuestions[subQuestionIndex][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleSubOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    newQuestions[questionIndex].subQuestions.forEach(subQuestion => {
      subQuestion.options[optionIndex] = value;
    });
    setQuestions(newQuestions);
  };

  const handleAddSubOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    newQuestions[questionIndex].subQuestions.forEach(subQuestion => {
      subQuestion.options.push('');
    });
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    // Validate that all questions have a label
    questions.forEach((question, index) => {
      if (!question.label.trim()) {
        newErrors[index] = 'Label for Question cannot be empty.';
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({}); // Clear any previous errors
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.post(`${BACKEND_URL}/api/projects/${projectId}/create_form/`, { name, questions }, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      toast.success('Form created and files generated successfully');
      console.log('File URL:', response.data.file_url);  // Log the file URL
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const handleShowModal = (index) => {
    setCurrentQuestionIndex(index);
    setShowModal(true);
  };

  const handleSelectType = (type) => {
    const newQuestions = [...questions];
    if (type === 'rating') {
      const list_id = generateRandomId();
      newQuestions[currentQuestionIndex] = {
        type: 'rating',
        name: '',
        label: '',
        required: false,
        list_id: list_id,
        options: ['Option 1', 'Option 2'],
        subQuestions: []
      };
    } else if (type === 'range') {
      newQuestions[currentQuestionIndex] = {
        type: 'range',
        name: '',
        label: '',
        required: false,
        parameters: 'start=0;end=10;step=1'
      };
    } else {
      newQuestions[currentQuestionIndex].type = type;
    }
    setQuestions(newQuestions);
    setShowModal(false);
  };

  const handleRequiredChange = (index) => {
    const newQuestions = [...questions];
    newQuestions[index].required = !newQuestions[index].required;
    setQuestions(newQuestions);
  };

  const generateRandomId = (length = 7) => {
    return Math.random().toString(36).substring(2, 2 + length);
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const reorderedQuestions = Array.from(questions);
    const [removed] = reorderedQuestions.splice(result.source.index, 1);
    reorderedQuestions.splice(result.destination.index, 0, removed);
    setQuestions(reorderedQuestions);
  };

  const toggleSettings = (index, section) => {
    setOpenSettings((prev) => {
      const newState = { ...prev };
      if (section) {
        newState[index] = {
          ...newState[index],
          [section]: !newState[index]?.[section],
        };
      } else {
        newState[index] = {
          ...newState[index],
          open: !newState[index]?.open,
        };
      }
      return newState;
    });
  };

  return (
    <div className="container mt-5">
      <h2>Create Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Questions:</label>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {questions.map((question, index) => (
                    <Draggable key={index} draggableId={String(index)} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2"
                          style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '4px', padding: '10px' }}
                        >
                          <div style={{ cursor: 'grab', backgroundColor: '#d1ecf1', padding: '5px', borderRadius: '4px' }}>
                            <i className="fas fa-grip-vertical"></i> Drag to reorder
                          </div>
                          <input
                            type="text"
                            className="form-control mb-2"
                            value={question.type}
                            onClick={() => handleShowModal(index)}
                            placeholder={`Type for Question ${index + 1}`}
                            readOnly
                          />
                          <input
                            type="text"
                            className="form-control mb-2"
                            value={question.label}
                            onChange={(e) => handleQuestionChange(index, 'label', e.target.value)}
                            placeholder={`Label for Question ${index + 1}`}
                          />
                          {errors[index] && <p className="text-danger">{errors[index]}</p>}
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={question.required}
                              onChange={() => handleRequiredChange(index)}
                            />
                            <label className="form-check-label">Required</label>
                          </div>
                          <button type="button" className="btn btn-secondary" onClick={() => toggleSettings(index)}>Settings</button>
                          <Collapse in={openSettings[index]}>
                            <div className="mt-3">
                              <div className="mb-3">
                                <label className="form-label">Data column name:</label>
                                <input type="text" className="form-control" value={question.name} onChange={(e) => handleQuestionChange(index, 'name', e.target.value)} />
                              </div>
                              <div className="mb-3">
                                <label className="form-label">Guidance hint:</label>
                                <input type="text" className="form-control" value={question.guidance_hint} onChange={(e) => handleQuestionChange(index, 'guidance_hint', e.target.value)} />
                              </div>
                              <div className="mb-3">
                                <label className="form-label">Mandatory response:</label>
                                <Form.Select value={question.required ? 'yes' : 'no'} onChange={(e) => handleQuestionChange(index, 'required', e.target.value === 'yes')}>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </Form.Select>
                              </div>
                              <div className="mb-3">
                                <label className="form-label">Default response:</label>
                                <input type="text" className="form-control" value={question.default} onChange={(e) => handleQuestionChange(index, 'default', e.target.value)} />
                              </div>
                              <div className="mb-3">
                                <label className="form-label">Appearance (advanced):</label>
                                <Form.Select value={question.appearance} onChange={(e) => handleQuestionChange(index, 'appearance', e.target.value)}>
                                  {question.type === 'select_one' ? (
                                    <>
                                      <option value="select">Select</option>
                                      <option value="minimal">Minimal</option>
                                      <option value="autocomplete">Autocomplete</option>
                                      <option value="quick">Quick</option>
                                      <option value="horizontal-compact">Horizontal-compact</option>
                                      <option value="horizontal">Horizontal</option>
                                      <option value="likert">Likert</option>
                                      <option value="compact">Compact</option>
                                      <option value="quickcompact">Quickcompact</option>
                                      <option value="label">Label</option>
                                      <option value="list-nolabel">List-nolabel</option>
                                      <option value="other">Other</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="select">Select</option>
                                      <option value="multiline">Multiline</option>
                                      <option value="numbers">Numbers</option>
                                      <option value="other">Other</option>
                                    </>
                                  )}
                                </Form.Select>
                              </div>
                              {question.type === 'select_one' && (
                                <>
                                  <div className="mb-3">
                                    <label className="form-label">Parameters:</label>
                                    <div className="form-check">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={question.parameters.includes('randomize=true')}
                                        onChange={(e) => handleQuestionChange(index, 'parameters', `randomize=${e.target.checked};seed=${question.parameters.split(';')[1]?.split('=')[1] || ''}`)}
                                      />
                                      <label className="form-check-label">Randomize</label>
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <label className="form-label">Seed:</label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={question.parameters.split(';')[1]?.split('=')[1] || ''}
                                      onChange={(e) => handleQuestionChange(index, 'parameters', `randomize=${question.parameters.includes('randomize=true')};seed=${e.target.value}`)}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </Collapse>
                          {(question.type.startsWith('select_one') || question.type.startsWith('select_multiple')) && (
                            <div className="mb-3">
                              <label className="form-label">Options:</label>
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="mb-2">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                </div>
                              ))}
                              <button type="button" className="btn btn-secondary" onClick={() => handleAddOption(index)}>Add Option</button>
                            </div>
                          )}
                          {question.type === 'rating' && (
                            <div className="mb-3">
                              <label className="form-label">Options:</label>
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="mb-2">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={option}
                                    onChange={(e) => handleSubOptionChange(index, optionIndex, e.target.value)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                </div>
                              ))}
                              <button type="button" className="btn btn-secondary" onClick={() => handleAddSubOption(index)}>Add Option</button>
                              <label className="form-label">Sub-Questions:</label>
                              {question.subQuestions.map((subQuestion, subIndex) => (
                                <div key={subIndex} className="mb-2">
                                  <input
                                    type="text"
                                    className="form-control mb-2"
                                    value={subQuestion.type}
                                    readOnly
                                  />
                                  <input
                                    type="text"
                                    className="form-control mb-2"
                                    value={subQuestion.label}
                                    onChange={(e) => handleSubQuestionChange(index, subIndex, 'label', e.target.value)}
                                    placeholder={`Label for Sub-Question ${subIndex + 1}`}
                                  />
                                  <div className="form-check">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={subQuestion.required}
                                      onChange={() => handleRequiredChange(index)}
                                    />
                                    <label className="form-check-label">Required</label>
                                  </div>
                                </div>
                              ))}
                              <button type="button" className="btn btn-secondary" onClick={() => handleAddSubQuestion(index)}>Add Sub-Question</button>
                            </div>
                          )}
                          {question.type === 'range' && (
                            <div className="mb-3">
                              <label className="form-label">Parameters:</label>
                              <div className="mb-2">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Start"
                                  value={questions[index].parameters.split(';')[0].split('=')[1]}
                                  onChange={(e) => handleQuestionChange(index, 'parameters', `start=${e.target.value};end=${questions[index].parameters.split(';')[1].split('=')[1]};step=${questions[index].parameters.split(';')[2].split('=')[1]}`)}
                                />
                              </div>
                              <div className="mb-2">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="End"
                                  value={questions[index].parameters.split(';')[1].split('=')[1]}
                                  onChange={(e) => handleQuestionChange(index, 'parameters', `start=${questions[index].parameters.split(';')[0].split('=')[1]};end=${e.target.value};step=${questions[index].parameters.split(';')[2].split('=')[1]}`)}
                                />
                              </div>
                              <div className="mb-2">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Step"
                                  value={questions[index].parameters.split(';')[2].split('=')[1]}
                                  onChange={(e) => handleQuestionChange(index, 'parameters', `start=${questions[index].parameters.split(';')[0].split('=')[1]};end=${questions[index].parameters.split(';')[1].split('=')[1]};step=${e.target.value}`)}
                                />
                              </div>
                            </div>
                          )}
                          <button type="button" className="btn btn-danger" onClick={() => handleDeleteQuestion(index)}>Delete Question</button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <button type="button" className="btn btn-secondary" onClick={handleAddQuestion}>Add Question</button>
        </div>
        <button type="submit" className="btn btn-primary">Create Form</button>
      </form>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Question Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {[
              'select_one',
              'text',
              'integer',
              'date',
              'time',
              'datetime',
              'geopoint',
              'geotrace',
              'geoshape',
              'decimal',
              'select_multiple',
              'image',
              'audio',
              'video',
              'note',
              'barcode',
              'acknowledge',
              'rating',
              'range'
            ].map((type, index) => (
              <Col key={type} xs={6} md={3} className="mb-2">
                <div className="list-group-item" onClick={() => handleSelectType(type)} style={{ cursor: 'pointer' }}>
                  {type}
                </div>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CreateForm;
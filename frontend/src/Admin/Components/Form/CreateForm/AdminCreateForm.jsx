import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Question from './AdminQuestion';
import QuestionTypeModal from './AdminQuestionTypeModal';
import { BsEyeFill } from 'react-icons/bs';
import { IoExpand } from "react-icons/io5";
import { BiAddToQueue } from "react-icons/bi";
import { LiaProjectDiagramSolid } from "react-icons/lia";
import { FaSlidersH, FaTimes, FaQuestionCircle } from "react-icons/fa";
import { BACKEND_URL } from '../../../../config';


const CreateForm = () => {
  const { projectId } = useParams(); // Retrieve projectId from URL parameters
  // const location = useLocation();
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [openSettings, setOpenSettings] = useState({});

  const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'label') {
      const label = value;
      let name = label.toLowerCase().replace(/[^a-z0-9-._:]/g, '_');
      if (!/^[a-z:_]/.test(name)) {
        name = `_${name}`;
      }
      newQuestions[index]['label'] = label;
      newQuestions[index]['name'] = name;
    } else if (field === 'parameters') {
      if (newQuestions[index].type === 'image') {
        newQuestions[index]['parameters'] = `max-pixels=${value.split('=')[1]}`;
      } else if (newQuestions[index].type === 'select_one' || newQuestions[index].type === 'select_multiple') {
        const [randomize, seed] = value.split(';').map(param => param.split('=')[1]);
        newQuestions[index]['parameters'] = `randomize=${randomize};seed=${seed}`;
      } else {
        newQuestions[index][field] = value;
      }
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      type: '',
      label: '',
      required: false,
      name: '',
      guidance_hint: '',
      default: '',
      appearance: '',
      parameters: '',
      options: [],
      subQuestions: [],
      relevant: '',
      constraint_message: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ name: '', label: '' });
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    setQuestions(newQuestions);
  };

  const handleAddSubQuestion = (questionIndex) => {
    const newQuestions = [...questions];
    const subQuestionIndex = newQuestions[questionIndex].subQuestions.length;
    const list_id = newQuestions[questionIndex].list_id;

    const subQuestionName = `_${subQuestionIndex + 1}${getOrdinalSuffix(subQuestionIndex + 1)}_choice`;

    // Generate the constraint for the new sub-question
    let constraint = '';
    for (let i = 0; i < subQuestionIndex; i++) {
      if (constraint) {
        constraint += ' and ';
      }
      const existingSubQuestionName = newQuestions[questionIndex].subQuestions[i].name;
      constraint += `\${${existingSubQuestionName}} != \${${subQuestionName}}`;
    }

    newQuestions[questionIndex].subQuestions.push({
      index: subQuestionIndex,
      type: `select_one ${list_id}`,
      name: subQuestionName,
      label: '',
      required: false,
      appearance: 'list-nolabel',
      options: [],
      constraint: constraint
    });
    setQuestions(newQuestions);
  };

  const handleSubQuestionChange = (questionIndex, subQuestionIndex, field, value) => {
    const newQuestions = [...questions];
    if (field === 'label') {
      const label = value;
      const name = label.toLowerCase().replace(/\s+/g, '_');
      newQuestions[questionIndex].subQuestions[subQuestionIndex] = {
        ...newQuestions[questionIndex].subQuestions[subQuestionIndex],
        label: label,
        name: name
      };
    } else {
      newQuestions[questionIndex].subQuestions[subQuestionIndex] = {
        ...newQuestions[questionIndex].subQuestions[subQuestionIndex],
        [field]: value
      };
    }
    setQuestions(newQuestions);
  };

  const handleDeleteSubQuestion = (questionIndex, subQuestionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].subQuestions.splice(subQuestionIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) {
      newErrors['name'] = 'Form name cannot be empty.';
    }
    questions.forEach((question, index) => {
      if (!question.label.trim()) {
        newErrors[index] = 'Label for Question cannot be empty.';
      }
      if (question.type === 'rating') {
        question.subQuestions.forEach((subQuestion, subIndex) => {
          if (!subQuestion.label.trim()) {
            newErrors[`${index}-${subIndex}`] = `Label for Sub-Question ${subIndex + 1} cannot be empty.`;
          }
        });
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.post(`${BACKEND_URL}/api/projects/${projectId}/create_form/`, { name, questions }, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      alert('Form created and files generated successfully');
      console.log('File URL:', response.data.file_url);
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const toggleSettings = (index) => {
    setOpenSettings((prev) => ({ ...prev, [index]: !prev[index] }));
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
        options: [
          { name: '', label: '' },
          { name: '', label: '' }
        ],
        subQuestions: [],
        constraint_message: 'Items cannot be selected more than once'
      };

      // Add sub-questions with constraints
      for (let i = 0; i < 3; i++) {
        const subQuestionName = `_${i + 1}${getOrdinalSuffix(i + 1)}_choice`;
        let constraint = '';
        for (let j = 0; j < i; j++) {
          if (constraint) {
            constraint += ' and ';
          }
          const existingSubQuestionName = `_${j + 1}${getOrdinalSuffix(j + 1)}_choice`;
          constraint += `\${${subQuestionName}} != \${${existingSubQuestionName}}`;
        }
        newQuestions[currentQuestionIndex].subQuestions.push({
          index: i,
          type: `select_one ${list_id}`,
          name: subQuestionName,
          label: '',
          required: false,
          appearance: 'list-nolabel',
          options: [],
          constraint: constraint
        });
      }
    } else if (type === 'select_one' || type === 'select_multiple') {
      const randomId = generateRandomId(7);
      newQuestions[currentQuestionIndex] = {
        type: `${type} ${randomId}`,
        name: '',
        label: '',
        required: false,
        options: [
          { name: '', label: '' },
          { name: '', label: '' }
        ],
        subQuestions: []
      };
    } else {
      newQuestions[currentQuestionIndex].type = type;
    }
    setQuestions(newQuestions);
    setShowModal(false);
  };

  const getOrdinalSuffix = (n) => {
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
  };

  const moveQuestion = (dragIndex, hoverIndex) => {
    const draggedQuestion = questions[dragIndex];
    const newQuestions = [...questions];
    newQuestions.splice(dragIndex, 1);
    newQuestions.splice(hoverIndex, 0, draggedQuestion);
    setQuestions(newQuestions);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mt-5">
        <div className='flex flex-col sm:flex-row justify-between items-center '>
          <p className='tab-button active inline-block text-[20px] mb-4'>Create form</p>

          <div className=' flex flex-col md:flex-row gap-4'>
            <div className='flex gap-3'>

              <button>
                <BsEyeFill className='w-6 h-6' />
              </button>
              <button>
                <IoExpand className='w-6 h-6' />
              </button>
              <button>
                <BiAddToQueue className='w-6 h-6' />
              </button>
              <button>
                <LiaProjectDiagramSolid className='w-6 h-6' />
              </button>
            </div>

            <div>
              <LayoutAndSettingPopUp/>

            </div>

          </div>


        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">form name:</label>
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
            {errors['name'] && <p className="text-danger">{errors['name']}</p>}
          </div>
          <div className="mb-3">
            <label className="form-label">Questions:</label>
            {questions.map((question, index) => (
              <Question
                key={index}
                question={question}
                index={index}
                moveQuestion={moveQuestion}
                handleQuestionChange={handleQuestionChange}
                handleDeleteQuestion={handleDeleteQuestion}
                toggleSettings={toggleSettings}
                openSettings={openSettings}
                handleAddOption={handleAddOption}
                handleOptionChange={handleOptionChange}
                handleAddSubQuestion={handleAddSubQuestion}
                handleSubQuestionChange={handleSubQuestionChange}
                handleDeleteSubQuestion={handleDeleteSubQuestion}
                handleShowModal={handleShowModal}
                errors={errors}
                allQuestions={questions}
              />
            ))}
            <button type="button" className="btn btn-secondary w-full" onClick={handleAddQuestion}>Add Question</button>
          </div>
          <button type="submit" className="btn btn-primary">Create Form</button>
        </form>

        <QuestionTypeModal
          show={showModal}
          onHide={() => setShowModal(false)}
          onSelectType={handleSelectType}
        />
      </div>
    </DndProvider>
  );
};

export default CreateForm;




function LayoutAndSettingPopUp() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [enableAudio, setEnableAudio] = useState(false);

  const toggleSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleAudioToggle = () => {
    setEnableAudio(!enableAudio);
  };

  return (
    <div>

      <button
        onClick={toggleSettings}
        className="flex items-center bg-[var(--primary2)]  text-white p-2 rounded-lg text-sm hover:text-gray-800"
      >
        <FaSlidersH className="mr-2" /> Layout and setting
      </button>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#f0f0f0] p-3 rounded-lg w-80 max-h-[90vh] overflow-y-auto relative">
            {/* Panel Header */}
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-800">Frame</span>
              <button onClick={closeSettings} className="text-gray-600 hover:text-gray-800">
                <FaTimes />
              </button>
            </div>

            {/* Form Style */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-gray-600 font-semibold text-sm mb-1">
                Form Style
                <FaQuestionCircle title="Select the form style that you would like to use." className="text-blue-600 ml-1 cursor-pointer" />
              </div>
              <div className="relative">
                <select className="w-full border rounded p-2 text-sm appearance-none bg-white">
                  <option>Grid theme</option>
                  <option>Default - single page</option>
                  <option>Grid theme with headings in ALL CAPS</option>
                  <option>Multiple pages</option>
                  <option>Grid theme + Multiple pages</option>
                  <option>Grid theme + Multiple pages + headings in ALL CAPS</option>
                </select>
                <div className="absolute right-3 top-3 text-gray-500 text-xs pointer-events-none">
                  ▼
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mb-4">
              <div className="text-gray-600 font-semibold text-sm mb-1">Metadata</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                {[
                  "start time", "username", "end time", "phone number",
                  "today", "device id", "audit", "start geopoint early"
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked={idx < 2} className="w-3 h-3" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>

              {/* Audit Settings */}
              <div className="mt-2">
                <label className="flex items-center text-gray-600 text-xs mb-1">
                  Audit settings
                  <FaQuestionCircle title="Enter audit settings here" className="text-blue-600 ml-1 cursor-pointer" />
                </label>
                <input
                  type="text"
                  placeholder="Enter audit settings here"
                  className="w-full border rounded p-2 text-xs"
                />
              </div>
            </div>

            {/* Background Audio */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-gray-600 font-semibold text-sm mb-1">
                Background audio
                <FaQuestionCircle title="This functionality is available in Collect version 1.30 and above" className="text-blue-600 ml-1 cursor-pointer" />
              </div>

              <div className="text-blue-600 text-[10px] mb-2">
                This functionality is available in Collect version 1.30 and above
              </div>

              <label className="flex items-center text-xs text-gray-700 cursor-pointer mb-2">
                <div className="relative inline-block w-7 h-4 mr-2">
                  <input
                    type="checkbox"
                    checked={enableAudio}
                    onChange={handleAudioToggle}
                    className="opacity-0 w-0 h-0"
                  />
                  <span className="absolute top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all before:absolute before:bg-white before:rounded-full before:h-3 before:w-3 before:top-0.5 before:left-0.5 before:transition-all" style={{
                    backgroundColor: enableAudio ? "#4caf50" : undefined,
                    ...(enableAudio && {
                      boxShadow: "0 0 2px #4caf50"
                    }),
                  }} />
                </div>
                This survey will be recorded
              </label>

              {/* Audio Quality */}
              {enableAudio && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Audio quality</div>
                  <select className="w-full border rounded p-2 text-sm">
                    <option>Voice only</option>
                    <option>Normal</option>
                    <option>High</option>
                  </select>
                </div>
              )}
            </div>

          </div>
        </div>
      )}


    </div>
  )
}


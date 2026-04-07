import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Question from "../../Components/Form/CreateForm/Question";
import QuestionTypeModal from "../../Components/Form/CreateForm/QuestionTypeModal";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

const EditForm = () => {
  const { projectId, formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    questions: [],
    all_questions: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [openSettings, setOpenSettings] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(`${BACKEND_URL}/api/forms/${formId}`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setForm(response.data);
        setIsEditing(true); // Set isEditing to true when form data is fetched
      } catch (error) {
        console.error("Error fetching form:", error);
      }
    };

    fetchForm();
  }, [formId]);

  const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...form.questions];
    if (field === "label") {
      const label = value;
      let name = label.toLowerCase().replace(/[^a-z0-9-._:]/g, "_");
      if (!/^[a-z:_]/.test(name)) {
        name = `_${name}`;
      }
      newQuestions[index]["label"] = label;
      newQuestions[index]["name"] = name;
    } else if (field === "parameters") {
      if (newQuestions[index].type === "image") {
        newQuestions[index]["parameters"] = `max-pixels=${value.split("=")[1]}`;
      } else if (
        newQuestions[index].type === "select_one" ||
        newQuestions[index].type === "select_multiple"
      ) {
        const [randomize, seed] = value
          .split(";")
          .map((param) => param.split("=")[1]);
        newQuestions[index][
          "parameters"
        ] = `randomize=${randomize};seed=${seed}`;
      } else {
        newQuestions[index][field] = value;
      }
    } else {
      newQuestions[index][field] = value;
    }
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleAddQuestion = () => {
    setForm((prevForm) => ({
      ...prevForm,
      questions: [
        ...(prevForm.questions || []),
        {
          id: `${prevForm.questions.length + 1}`,
          type: "text",
          name: "",
          label: "",
          required: false,
          options: [],
          subQuestions: [],
          parameters: "",
          hint: "",
          default: "",
          appearance: "",
          guidance_hint: "",
          hxl: "",
          filterEnabled: false,
          filterQuestionId: "",
          filterOptionValues: [],
          optionFilterMap: {},
        },
      ],
    }));
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = [...form.questions];
    newQuestions.splice(index, 1);
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...form.questions];
    newQuestions[questionIndex].options.push({ name: "", label: "" });
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...form.questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleAddSubQuestion = (questionIndex) => {
    const newQuestions = [...form.questions];
    const subQuestionIndex = newQuestions[questionIndex].subQuestions.length;
    const list_id = newQuestions[questionIndex].list_id;

    const subQuestionName = `_${subQuestionIndex + 1}${getOrdinalSuffix(
      subQuestionIndex + 1
    )}_choice`;

    // Generate the constraint for the new sub-question
    let constraint = "";
    for (let i = 0; i < subQuestionIndex; i++) {
      if (constraint) {
        constraint += " and ";
      }
      const existingSubQuestionName =
        newQuestions[questionIndex].subQuestions[i].name;
      constraint += `\${${existingSubQuestionName}} != \${${subQuestionName}}`;
    }

    newQuestions[questionIndex].subQuestions.push({
      index: subQuestionIndex,
      type: `select_one ${list_id}`,
      name: subQuestionName,
      label: "",
      required: false,
      appearance: "list-nolabel",
      options: [],
      constraint: constraint,
    });
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleSubQuestionChange = (
    questionIndex,
    subQuestionIndex,
    field,
    value
  ) => {
    const newQuestions = [...form.questions];
    if (field === "label") {
      const label = value;
      const name = label.toLowerCase().replace(/\s+/g, "_");
      newQuestions[questionIndex].subQuestions[subQuestionIndex] = {
        ...newQuestions[questionIndex].subQuestions[subQuestionIndex],
        label: label,
        name: name,
      };
    } else {
      newQuestions[questionIndex].subQuestions[subQuestionIndex] = {
        ...newQuestions[questionIndex].subQuestions[subQuestionIndex],
        [field]: value,
      };
    }
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleDeleteSubQuestion = (questionIndex, subQuestionIndex) => {
    const newQuestions = [...form.questions];
    newQuestions[questionIndex].subQuestions.splice(subQuestionIndex, 1);
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors["name"] = "Form name cannot be empty.";
    }
    form.questions.forEach((question, index) => {
      if (!question.label.trim()) {
        newErrors[index] = "Label for Question cannot be empty.";
      }
      if (question.type === "rating") {
        question.subQuestions.forEach((subQuestion, subIndex) => {
          if (!subQuestion.label.trim()) {
            newErrors[`${index}-${subIndex}`] = `Label for Sub-Question ${
              subIndex + 1
            } cannot be empty.`;
          }
        });
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({}); // Clear any previous errors

    const payload = {
      name: form.name,
      questions: form.questions,
      all_questions: form.all_questions,
      project: projectId,
    };
    console.log("Request Payload:", payload); // Log the request payload

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.put(
        `${BACKEND_URL}/api/forms/${formId}/`,
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      toast.success("Form updated successfully");
      navigate(`/projects/${projectId}/forms`);
    } catch (error) {
      console.error("Error updating form:", error);
      if (error.response) {
        console.error("Server Response:", error.response.data); // Log the server response
      }
      toast.error("Failed to update form");
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
    const newQuestions = [...form.questions];
    if (type === "rating") {
      const list_id = generateRandomId();
      newQuestions[currentQuestionIndex] = {
        type: "rating",
        name: "",
        label: "",
        required: false,
        list_id: list_id,
        options: [
          { name: "", label: "" },
          { name: "", label: "" },
        ],
        subQuestions: [],
        constraint_message: "Items cannot be selected more than once",
      };

      // Add sub-questions with constraints
      for (let i = 0; i < 3; i++) {
        const subQuestionName = `_${i + 1}${getOrdinalSuffix(i + 1)}_choice`;
        let constraint = "";
        for (let j = 0; j < i; j++) {
          if (constraint) {
            constraint += " and ";
          }
          const existingSubQuestionName = `_${j + 1}${getOrdinalSuffix(
            j + 1
          )}_choice`;
          constraint += `\${${subQuestionName}} != \${${existingSubQuestionName}}`;
        }
        newQuestions[currentQuestionIndex].subQuestions.push({
          index: i,
          type: `select_one ${list_id}`,
          name: subQuestionName,
          label: "",
          required: false,
          appearance: "list-nolabel",
          options: [],
          constraint: constraint,
        });
      }
    } else if (type === "select_one" || type === "select_multiple") {
      const randomId = generateRandomId(7);
      newQuestions[currentQuestionIndex] = {
        type: `${type} ${randomId}`,
        name: "",
        label: "",
        required: false,
        options: [
          { name: "", label: "" },
          { name: "", label: "" },
        ],
        subQuestions: [],
      };
    } else {
      newQuestions[currentQuestionIndex].type = type;
    }
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
    setShowModal(false);
  };

  const getOrdinalSuffix = (n) => {
    if (n === 1) return "st";
    if (n === 2) return "nd";
    if (n === 3) return "rd";
    return "th";
  };

  const moveQuestion = (dragIndex, hoverIndex) => {
    const newQuestions = [...form.questions];
    const [draggedQuestion] = newQuestions.splice(dragIndex, 1);
    newQuestions.splice(hoverIndex, 0, draggedQuestion);
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  return (
    <div className="container mt-5">
      <h2>Edit Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          {errors["name"] && <p className="text-danger">{errors["name"]}</p>}
        </div>
        <div className="mb-3">
          <label className="form-label">Questions:</label>
          <DndProvider backend={HTML5Backend}>
            {form.questions && form.questions.length > 0 ? (
              form.questions.map((question, index) => (
                <Question
                  key={question.id}
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
                  allQuestions={form.all_questions}
                  isEditing={isEditing}
                  projectId={projectId}
                  formId={formId}
                />
              ))
            ) : (
              <p>No questions available</p>
            )}
          </DndProvider>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddQuestion}
          >
            Add Question
          </button>
        </div>
        <button type="submit" className="btn btn-primary">
          Update Form
        </button>
      </form>

      <QuestionTypeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSelectType={handleSelectType}
      />
    </div>
  );
};

export default EditForm;

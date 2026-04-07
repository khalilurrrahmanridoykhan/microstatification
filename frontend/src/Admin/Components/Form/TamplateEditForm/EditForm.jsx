import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Question from "./Question";
import QuestionTypeModal from "./QuestionTypeModal";
import { toast } from "sonner";
import { useRef } from "react";
import { BACKEND_URL } from "../../../../config";
import { FaQuestionCircle } from "react-icons/fa";

const EditForm = ({ isTemplateRoute = true }) => {
  const { projectId, formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    questions: [],
    all_questions: [],
    form_style: "default",
  });
  const [showModal, setShowModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [openSettings, setOpenSettings] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [hoverSlot, setHoverSlot] = useState(null);
  const [showPatientQuestionPanel, setShowPatientQuestionPanel] =
    useState(false);
  const [selectedQuestionKeys, setSelectedQuestionKeys] = useState(
    () => new Set()
  );
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadTakingLong, setIsLoadTakingLong] = useState(false);
  const [formLoadError, setFormLoadError] = useState("");
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [isSaveTakingLong, setIsSaveTakingLong] = useState(false);
  const [backendValidationResult, setBackendValidationResult] = useState(null);

  // Default patient identification question template
  const patientIdentificationQuestions = [
    {
      _uuid: "patient_id_type_question",
      id: "patient_id_type_question",
      type: "select_one patient_id_types",
      label: "Patient ID Type",
      name: "patient_id_type",
      required: true,
      guidance_hint: "Select the type of identification you will provide",
      default: "",
      appearance: "",
      parameters: "",
      options: [
        {
          name: "nid",
          label: "NID (National ID)",
          _uuid: "nid_option",
        },
        {
          name: "birth_certificate",
          label: "Birth Certificate ID",
          _uuid: "birth_certificate_option",
        },
      ],
      subQuestions: [],
      relevant: "",
      constraint_message: "Please select ID type",
      constraint: ". != ''",
      hint: "Choose the type of identification document you will use for this patient.",
      trigger: "",
      calculation: "",
    },
    {
      _uuid: "patient_id_number_question",
      id: "patient_id_number_question",
      type: "integer",
      label: "Patient Identification Number",
      name: "user_identification_11_9943_01976848561",
      required: true,
      guidance_hint: "Enter the patient identification number",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message:
        "For NID, enter exactly 10, 13, or 17 digits. For Birth Certificate, enter exactly 17 digits.",
      constraint:
        "(${patient_id_type} = 'nid' and regex(., '^[0-9]{10}$|^[0-9]{13}$|^[0-9]{17}$')) or (${patient_id_type} = 'birth_certificate' and regex(., '^[0-9]{17}$')) or (${patient_id_type} != 'nid' and ${patient_id_type} != 'birth_certificate')",
      hint: "Enter the actual ID number based on the type selected above. This will be used to identify and manage patient records in the system.",
      trigger: "",
      calculation: "",
      constraintType: "custom",
    },
  ];

  // collapsed state per question index - all collapsed by default
  const [collapsed, setCollapsed] = useState({}); // { [index]: boolean }

  // Initialize all questions as collapsed when form loads
  useEffect(() => {
    if (form.questions && form.questions.length > 0) {
      const initialCollapsedState = {};
      form.questions.forEach((_, index) => {
        initialCollapsedState[index] = true; // true = collapsed
      });
      setCollapsed(initialCollapsedState);
    }
  }, [form.questions.length]);

  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const questionRefs = useRef({});

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtTop(true);
  };
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtTop(false);
  };

  const formatQuestionErrorMessage = (item) => {
    const parts = [];
    if (item?.message) {
      parts.push(item.message);
    }
    if (item?.field) {
      parts.push(`Field: ${item.field}`);
    }
    if (Array.isArray(item?.suggestions) && item.suggestions.length > 0) {
      parts.push(`Suggestions: ${item.suggestions.join(", ")}`);
    }
    return parts.join(" | ");
  };

  const jumpToQuestion = (questionIndex) => {
    if (!Number.isInteger(questionIndex) || questionIndex < 0) {
      return;
    }
    setCollapsed((prev) => ({ ...prev, [questionIndex]: false }));
    setTimeout(() => {
      const target = questionRefs.current[questionIndex];
      if (target?.scrollIntoView) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  const applyBackendValidationPayload = (payload) => {
    if (!payload || payload.valid !== false) {
      setBackendValidationResult(null);
      return false;
    }

    setBackendValidationResult(payload);
    const incomingQuestionErrors = Array.isArray(payload.question_errors)
      ? payload.question_errors
      : [];

    if (!incomingQuestionErrors.length) {
      return true;
    }

    const mappedErrors = {};
    const affectedQuestionIndexes = new Set();

    incomingQuestionErrors.forEach((item) => {
      const questionIndex = Number(item?.question_index);
      if (!Number.isInteger(questionIndex) || questionIndex < 0) {
        return;
      }

      affectedQuestionIndexes.add(questionIndex);

      const message = formatQuestionErrorMessage(item);
      if (!message) {
        return;
      }

      const hasSubQuestion =
        Number.isInteger(item?.subquestion_index) && item.subquestion_index >= 0;
      const questionKey = questionIndex;
      const subQuestionKey = hasSubQuestion
        ? `${questionIndex}-${item.subquestion_index}`
        : questionKey;

      mappedErrors[subQuestionKey] = mappedErrors[subQuestionKey]
        ? `${mappedErrors[subQuestionKey]} | ${message}`
        : message;

      if (hasSubQuestion) {
        const parentMessage = `Sub-question issue: ${message}`;
        mappedErrors[questionKey] = mappedErrors[questionKey]
          ? `${mappedErrors[questionKey]} | ${parentMessage}`
          : parentMessage;
      }
    });

    if (Object.keys(mappedErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...mappedErrors }));
      setCollapsed((prev) => {
        const next = { ...prev };
        affectedQuestionIndexes.forEach((index) => {
          next[index] = false;
        });
        return next;
      });
    }

    return true;
  };

  // Collapse toggle for a question
  const toggleCollapseAt = (index) => {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Ensure all questions have a unique _uuid for React keys and DnD
  useEffect(() => {
    if (form.questions && form.questions.length > 0) {
      setForm((prevForm) => ({
        ...prevForm,
        questions: prevForm.questions.map((q) => ({
          _uuid: q._uuid || generateRandomId(),
          ...q,
        })),
      }));
    }
    // eslint-disable-next-line
  }, [form.questions.length]);

  useEffect(() => {
    if (!isFormLoading) return undefined;

    setLoadingProgress(0);
    setIsLoadTakingLong(false);

    const loadStartedAt = Date.now();
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 95) return prev;
        const elapsedMs = Date.now() - loadStartedAt;
        const step = elapsedMs < 2000 ? 8 : elapsedMs < 5000 ? 4 : 1;
        return Math.min(95, prev + step);
      });
    }, 350);

    const longLoadTimeout = setTimeout(() => {
      setIsLoadTakingLong(true);
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(longLoadTimeout);
    };
  }, [isFormLoading]);

  useEffect(() => {
    if (!isFormSaving) return undefined;

    setSavingProgress(0);
    setIsSaveTakingLong(false);

    const startedAt = Date.now();
    const progressInterval = setInterval(() => {
      setSavingProgress((prev) => {
        if (prev >= 95) return prev;
        const elapsedMs = Date.now() - startedAt;
        const step = elapsedMs < 2000 ? 10 : elapsedMs < 6000 ? 4 : 1;
        return Math.min(95, prev + step);
      });
    }, 300);

    const longSaveTimeout = setTimeout(() => {
      setIsSaveTakingLong(true);
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(longSaveTimeout);
    };
  }, [isFormSaving]);

  useEffect(() => {
    const fetchForm = async () => {
      setIsFormLoading(true);
      setLoadingProgress(0);
      setIsLoadTakingLong(false);
      setFormLoadError("");
      setErrors({});
      setBackendValidationResult(null);
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(
          `${BACKEND_URL}/api/forms/${formId}/`,
          {
            params: { include_submissions: "false" },
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        setForm({
          ...response.data,
          questions: (response.data.questions || []).map((q) => ({
            _uuid: q._uuid || generateRandomId(),
            ...q,
          })),
        });

        try {
          const validationResponse = await axios.get(
            `${BACKEND_URL}/api/forms/${formId}/validate/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          applyBackendValidationPayload(validationResponse.data);
        } catch (validationError) {
          console.error("Error validating existing form:", validationError);
        }

        setLoadingProgress(100);
        setIsEditing(true);
      } catch (error) {
        console.error("Error fetching form:", error);
        setFormLoadError("Failed to load form data. Please refresh and try again.");
      } finally {
        setIsFormLoading(false);
      }
    };
    fetchForm();
    // eslint-disable-next-line
  }, [formId]);

  // Ultra-stable ID generator
  const genId = () => Math.random().toString(36).slice(2, 11);
  const ensureId = (q) => {
    if (!q) return q;
    if (!q.id) q.id = genId();
    if (!q._uuid) q._uuid = q.id;
    q.id = String(q.id);
    q._uuid = String(q._uuid);
    return q;
  };

  // Deep clone and ensure unique IDs for duplication
  function deepCloneQuestion(q, allUsedNames) {
    const usedNames = new Set(allUsedNames);
    const clone = JSON.parse(JSON.stringify(q));
    clone.id = genId();
    clone._uuid = genId();
    if (clone.name) {
      let candidate = clone.name;
      let n = 2;
      while (usedNames.has(candidate)) {
        candidate = `${clone.name}_${n}`;
        n++;
      }
      usedNames.add(candidate);
      clone.name = candidate;
    }
    // If type is select_one or select_multiple, assign new id in type string
    if (
      typeof clone.type === "string" &&
      (clone.type.startsWith("select_one ") ||
        clone.type.startsWith("select_multiple "))
    ) {
      const parts = clone.type.split(/\s+/);
      if (parts.length === 2) {
        parts[1] = genId();
        clone.type = parts.join(" ");
      }
    }
    // Options: assign new _uuid and ensure unique names
    if (Array.isArray(clone.options)) {
      clone.options = clone.options.map((opt, i) => {
        const optClone = { ...opt };
        optClone._uuid = genId();
        if (optClone.name) {
          let candidate = optClone.name;
          let n = 2;
          while (usedNames.has(candidate)) {
            candidate = `${optClone.name}_${n}`;
            n++;
          }
          usedNames.add(candidate);
          optClone.name = candidate;
        }
        return optClone;
      });
    }
    // SubQuestions: assign new names and update type id if select_one/select_multiple
    if (Array.isArray(clone.subQuestions)) {
      clone.subQuestions = clone.subQuestions.map((sq) => {
        const sqClone = { ...sq };
        sqClone.id = genId();
        sqClone._uuid = genId();
        if (sqClone.name) {
          let candidate = sqClone.name;
          let n = 2;
          while (usedNames.has(candidate)) {
            candidate = `${sqClone.name}_${n}`;
            n++;
          }
          usedNames.add(candidate);
          sqClone.name = candidate;
        }
        if (
          typeof sqClone.type === "string" &&
          (sqClone.type.startsWith("select_one ") ||
            sqClone.type.startsWith("select_multiple "))
        ) {
          const parts = sqClone.type.split(/\s+/);
          if (parts.length === 2) {
            parts[1] = genId();
            sqClone.type = parts.join(" ");
          }
        }
        return sqClone;
      });
    }
    return clone;
  }

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
      let baseName = label.toLowerCase().replace(/[^a-z0-9-._:]/g, "_");
      if (!/^[a-z:_]/.test(baseName)) {
        baseName = `_${baseName}`;
      }
      let name = baseName;
      let suffix = 1;
      while (newQuestions.some((q, i) => i !== index && q.name === name)) {
        name = `${baseName}_${suffix}`;
        suffix += 1;
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
    const newQuestion = {
      _uuid: generateRandomId(),
      id: form.questions.length + 1,
      type: "",
      label: "",
      required: false,
      name: "",
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      calculation: "",
    };
    setForm((prevForm) => ({
      ...prevForm,
      questions: [...prevForm.questions, newQuestion],
    }));
  };

  const handleAddGroup = () => {
    const groupId = generateRandomId();
    const beginGroup = {
      _uuid: generateRandomId(),
      id: `begin_${groupId}`,
      type: "begin_group",
      label: "Group",
      name: `group_${groupId}`,
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isGroupStart: true,
      groupId: groupId,
    };

    const endGroup = {
      _uuid: generateRandomId(),
      id: `end_${groupId}`,
      type: "end_group",
      label: "",
      name: "",
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isGroupEnd: true,
      groupId: groupId,
    };

    setForm((prevForm) => ({
      ...prevForm,
      questions: [...prevForm.questions, beginGroup, endGroup],
    }));
  };

  const handleAddRepeat = () => {
    const repeatId = generateRandomId();
    const beginRepeat = {
      _uuid: generateRandomId(),
      id: `begin_repeat_${repeatId}`,
      type: "begin_repeat",
      label: "Repeat",
      name: `repeat_${repeatId}`,
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      repeat_count: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isRepeatStart: true,
      repeatId: repeatId,
    };

    const endRepeat = {
      _uuid: generateRandomId(),
      id: `end_repeat_${repeatId}`,
      type: "end_repeat",
      label: "",
      name: "",
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isRepeatEnd: true,
      repeatId: repeatId,
    };

    setForm((prevForm) => ({
      ...prevForm,
      questions: [...prevForm.questions, beginRepeat, endRepeat],
    }));
  };

  const handleAddQuestionToGroup = (groupIndex) => {
    const newQuestion = {
      _uuid: generateRandomId(),
      id: generateRandomId(),
      type: "text",
      label: "",
      required: false,
      name: generateRandomId(),
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      calculation: "",
    };

    // Insert the question after the begin_group
    const newQuestions = [...form.questions];
    newQuestions.splice(groupIndex + 1, 0, newQuestion);
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleDeleteQuestion = (index) => {
    const newQuestions = form.questions.filter((_, i) => i !== index);
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...form.questions];
    if (field === "label") {
      const label = value;
      let baseName = label.toLowerCase().replace(/[^a-z0-9-._:]/g, "_");
      if (!/^[a-z:_]/.test(baseName)) {
        baseName = `_${baseName}`;
      }
      let name = baseName;
      let suffix = 1;
      while (
        newQuestions[questionIndex].options.some(
          (opt, i) => i !== optionIndex && opt.name === name
        )
      ) {
        name = `${baseName}_${suffix}`;
        suffix += 1;
      }
      newQuestions[questionIndex].options[optionIndex]["label"] = label;
      newQuestions[questionIndex].options[optionIndex]["name"] = name;
    } else {
      newQuestions[questionIndex].options[optionIndex][field] = value;
    }
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

  const handleAddSubQuestion = (questionIndex) => {
    const newQuestions = [...form.questions];
    const subQuestionIndex = newQuestions[questionIndex].subQuestions.length;
    const list_id = newQuestions[questionIndex].list_id;
    const subQuestionName = `_${subQuestionIndex + 1}${getOrdinalSuffix(
      subQuestionIndex + 1
    )}_choice`;
    let constraint = "";
    for (let i = 0; i < subQuestionIndex; i++) {
      if (constraint) constraint += " and ";
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

  const handleDeleteOption = (questionIndex, optionIndex) => {
    const newQuestions = [...form.questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setForm((prevForm) => ({
      ...prevForm,
      questions: newQuestions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormSaving) return;
    setBackendValidationResult(null);

    const newErrors = {};
    if (!form.name.trim()) {
      newErrors["name"] = "Form name cannot be empty.";
    }
    form.questions.forEach((question, index) => {
      // End markers do not need label/name.
      if (question.type === "end_group" || question.type === "end_repeat") {
        return;
      }

      if (!question.label.trim()) {
        newErrors[index] = "Label for Question cannot be empty.";
      }

      const hasConditions =
        Array.isArray(question.conditions) && question.conditions.length > 0;
      const relevantNotSet =
        !question.relevant || question.relevant.trim() === "";

      if (hasConditions && relevantNotSet) {
        toast.error(
          `Skip logic added to Question ${
            index + 1
          } but not saved. Please click "Save Condition Skip Logic"`
        );
        newErrors[`skiplogic-${index}`] = `Skip logic added to Question ${
          index + 1
        } but not saved. Please click "Save Condition Skip Logic".`;
      }

      // Note: Duplicate option names are automatically handled by the Option component
      // which adds numeric suffixes (_2, _3, etc.) to ensure uniqueness
      if (question.type === "rating") {
        question.subQuestions.forEach((subQuestion, subIndex) => {
          if (!subQuestion.label.trim()) {
            newErrors[`${index}-${subIndex}`] = `Label for Sub-Question ${
              subIndex + 1
            } cannot be empty.`;
          }
        });
      }
      if (
        question.type.startsWith("select_one") ||
        question.type.startsWith("select_multiple")
      ) {
        if (!Array.isArray(question.options) || question.options.length === 0) {
          newErrors[`${index}-options`] = `Question ${
            index + 1
          } must have at least one option.`;
          toast.error(`Question ${index + 1} must have at least one option.`);
        } else {
          question.options.forEach((option, optionIndex) => {
            if (!option.label || option.label.trim() === "") {
              newErrors[`${index}-option-${optionIndex}`] = `Option ${
                optionIndex + 1
              } in Question ${index + 1} cannot be empty.`;
              toast.error(
                `Option ${optionIndex + 1} in Question ${
                  index + 1
                } cannot be empty.`
              );
            }
          });
        }
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const payload = {
      name: form.name,
      questions: form.questions,
      all_questions: form.all_questions,
      project: projectId,
      form_style: form.form_style,
    };
    try {
      setIsFormSaving(true);
      setSavingProgress(0);
      setIsSaveTakingLong(false);
      const token = sessionStorage.getItem("authToken");
      await axios.put(`${BACKEND_URL}/api/forms/${formId}/`, payload, {
        headers: { Authorization: `Token ${token}` },
        onUploadProgress: (event) => {
          if (!event?.total) return;
          const percent = Math.min(
            95,
            Math.round((event.loaded * 100) / event.total)
          );
          setSavingProgress((prev) => Math.max(prev, percent));
        },
      });
      setSavingProgress(100);
      toast.success("Form updated successfully");
      const formInfoPath = isTemplateRoute
        ? `/template/projects/${projectId}/forms/${formId}`
        : `/projects/${projectId}/forms/${formId}`;
      navigate(formInfoPath);
    } catch (error) {
      console.error("Error updating form:", error);
      if (error.response) {
        console.error("Server Response:", error.response.data);
      }
      const serverPayload = error?.response?.data;
      if (applyBackendValidationPayload(serverPayload)) {
        toast.error(
          "Form validation failed. Fix highlighted question errors and try again."
        );
      } else {
        const fallbackMessage =
          serverPayload?.error ||
          serverPayload?.detail ||
          "Failed to update form";
        toast.error(fallbackMessage);
      }
    } finally {
      setIsFormSaving(false);
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
        _uuid: newQuestions[currentQuestionIndex]._uuid || generateRandomId(),
        type: "rating",
        name: "",
        label: "",
        required: false,
        list_id: list_id,
        options: [{ name: "", label: "" }],
        subQuestions: [],
        constraint_message: "Items cannot be selected more than once",
      };
      for (let i = 0; i < 3; i++) {
        const subQuestionName = `_${i + 1}${getOrdinalSuffix(i + 1)}_choice`;
        let constraint = "";
        for (let j = 0; j < i; j++) {
          if (constraint) constraint += " and ";
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
        _uuid:
          newQuestions[currentQuestionIndex]._uuid ||
          `${Date.now()}-${Math.random()}`,
        type: `${type} ${randomId}`,
        name: "",
        label: "",
        required: false,
        options: [{ name: "", label: "" }],
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

  // const moveQuestion = (dragIndex, hoverIndex) => {
  //   const newQuestions = [...form.questions];
  //   const [draggedQuestion] = newQuestions.splice(dragIndex, 1);
  //   newQuestions.splice(hoverIndex, 0, draggedQuestion);
  //   setForm((prevForm) => ({
  //     ...prevForm,
  //     questions: newQuestions,
  //   }));
  // };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const questions = Array.from(form.questions);
    const [removed] = questions.splice(result.source.index, 1);
    questions.splice(result.destination.index, 0, removed);

    setForm((prevForm) => ({
      ...prevForm,
      questions,
    }));
  };

  // Insert add (for hover slot)
  const handleInsertQuestionAt = (slotIndex) => {
    setForm((prevForm) => {
      const newQuestions = [...prevForm.questions];
      newQuestions.splice(
        slotIndex,
        0,
        ensureId({
          id: genId(),
          _uuid: undefined,
          type: "",
          label: "",
          required: false,
          name: "",
          guidance_hint: "",
          default: "",
          appearance: "",
          parameters: "",
          options: [],
          subQuestions: [],
          relevant: "",
          constraint_message: "",
          trigger: "",
          calculation: "",
        })
      );
      return { ...prevForm, questions: newQuestions };
    });
    setHoverSlot(null);
  };
  const handleInsertGroupAt = (slotIndex) => {
    const groupKey = genId();
    const begin = ensureId({
      id: `begin_${groupKey}`,
      _uuid: undefined,
      type: "begin_group",
      label: "Group",
      name: `group_${groupKey}`,
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isGroupStart: true,
      groupId: groupKey,
    });
    const end = ensureId({
      id: `end_${groupKey}`,
      _uuid: undefined,
      type: "end_group",
      label: "",
      name: "",
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isGroupEnd: true,
      groupId: groupKey,
    });
    setForm((prevForm) => {
      const newQuestions = [...prevForm.questions];
      newQuestions.splice(slotIndex, 0, begin, end);
      return { ...prevForm, questions: newQuestions };
    });
    setHoverSlot(null);
  };

  const handleInsertRepeatAt = (slotIndex) => {
    const repeatKey = genId();
    const begin = ensureId({
      id: `begin_repeat_${repeatKey}`,
      _uuid: undefined,
      type: "begin_repeat",
      label: "Repeat",
      name: `repeat_${repeatKey}`,
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      repeat_count: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isRepeatStart: true,
      repeatId: repeatKey,
    });
    const end = ensureId({
      id: `end_repeat_${repeatKey}`,
      _uuid: undefined,
      type: "end_repeat",
      label: "",
      name: "",
      required: false,
      guidance_hint: "",
      default: "",
      appearance: "",
      parameters: "",
      options: [],
      subQuestions: [],
      relevant: "",
      constraint_message: "",
      trigger: "",
      isRepeatEnd: true,
      repeatId: repeatKey,
    });
    setForm((prevForm) => {
      const newQuestions = [...prevForm.questions];
      newQuestions.splice(slotIndex, 0, begin, end);
      return { ...prevForm, questions: newQuestions };
    });
    setHoverSlot(null);
  };

  function handleDuplicateQuestion(index) {
    // Gather every used name so the clone can satisfy XForm uniqueness rules
    const allUsedNames = [];
    form.questions.forEach((q) => {
      if (q?.name) allUsedNames.push(q.name);
      if (Array.isArray(q?.options)) {
        q.options.forEach((opt) => {
          if (opt?.name) allUsedNames.push(opt.name);
        });
      }
      if (Array.isArray(q?.subQuestions)) {
        q.subQuestions.forEach((sq) => {
          if (sq?.name) allUsedNames.push(sq.name);
        });
      }
    });

    const original = form.questions[index];
    const clone = deepCloneQuestion(original, allUsedNames);
    if (original?.label) {
      clone.label = `${original.label} (Copy)`;
    }

    setForm((prevForm) => {
      const newQuestions = [...prevForm.questions];
      newQuestions.splice(index + 1, 0, clone);
      return { ...prevForm, questions: newQuestions };
    });
  }

  const makeSelectionKey = (question, index = 0) =>
    String(
      question?._uuid ??
        question?.id ??
        question?.idx ??
        question?.name ??
        index
    );

  const isQuestionSelected = (key) => selectedQuestionKeys.has(String(key));

  const toggleQuestionSelection = (key) => {
    if (!key) return;
    setSelectedQuestionKeys((prev) => {
      const next = new Set(prev);
      const normalized = String(key);
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return next;
    });
  };

  const handleSelectAllQuestions = () => {
    setSelectedQuestionKeys(() => {
      const next = new Set();
      form.questions.forEach((q, idx) => {
        next.add(makeSelectionKey(q, idx));
      });
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedQuestionKeys(() => new Set());
  };

  const selectedCount = selectedQuestionKeys.size;

  const handleBulkDuplicateSelected = () => {
    if (!selectedQuestionKeys.size) {
      toast.info("Select at least one question to duplicate.");
      return;
    }

    const selectedKeysArray = Array.from(selectedQuestionKeys);
    const clonesResult = [];

    const addNamesFromQuestion = (question, targetSet) => {
      if (!question) return;
      if (question.name) targetSet.add(question.name);
      if (Array.isArray(question.options)) {
        question.options.forEach((opt) => {
          if (opt?.name) targetSet.add(opt.name);
        });
      }
      if (Array.isArray(question.subQuestions)) {
        question.subQuestions.forEach((subQ) => {
          addNamesFromQuestion(subQ, targetSet);
        });
      }
    };

    const escapeRegExp = (str) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    setForm((prevForm) => {
      const questions = prevForm.questions || [];
      if (questions.length === 0) return prevForm;

      const idToSelectionKey = new Map();
      questions.forEach((q, idx) => {
        const key = makeSelectionKey(q, idx);
        idToSelectionKey.set(key, key);
        if (q?._uuid) idToSelectionKey.set(String(q._uuid), key);
        if (q?.id) idToSelectionKey.set(String(q.id), key);
        if (q?.name) idToSelectionKey.set(String(q.name), key);
      });

      const selectedEntries = questions
        .map((q, idx) => ({
          question: q,
          index: idx,
          key: makeSelectionKey(q, idx),
        }))
        .filter((entry) => selectedKeysArray.includes(entry.key));

      if (!selectedEntries.length) {
        toast.info("Selected questions are no longer available to duplicate.");
        return prevForm;
      }

      selectedEntries.sort((a, b) => a.index - b.index);

      const allNamesSet = new Set();
      questions.forEach((q) => addNamesFromQuestion(q, allNamesSet));

      const questionIdentifierMapping = new Map();
      const optionMappingByOriginalKey = new Map();
      const optionMappingByQuestionName = new Map();
      const combinedNameMapping = new Map();

      const clonesWithIndex = selectedEntries.map(({ question, index, key }) => {
        const clone = deepCloneQuestion(question, Array.from(allNamesSet));
        addNamesFromQuestion(clone, allNamesSet);

        if (question.name && clone.name) {
          combinedNameMapping.set(String(question.name), String(clone.name));
        }

        const cloneKey = makeSelectionKey(clone);
        questionIdentifierMapping.set(key, cloneKey);
        if (question?._uuid && clone?._uuid) {
          questionIdentifierMapping.set(String(question._uuid), String(clone._uuid));
        }
        if (question?.id && clone?.id) {
          questionIdentifierMapping.set(String(question.id), String(clone.id));
        }
        if (question?.name && clone?.name) {
          questionIdentifierMapping.set(String(question.name), String(clone.name));
        }

        const optionMap = new Map();
        if (Array.isArray(question.options)) {
          question.options.forEach((opt, optIndex) => {
            const cloneOpt = clone.options?.[optIndex];
            if (opt?.name && cloneOpt?.name) {
              optionMap.set(String(opt.name), String(cloneOpt.name));
            }
          });
        }
        if (Array.isArray(question.subQuestions)) {
          question.subQuestions.forEach((subQ, subIndex) => {
            const cloneSub = clone.subQuestions?.[subIndex];
            if (!subQ || !cloneSub) return;
            if (subQ?.name && cloneSub?.name) {
              combinedNameMapping.set(String(subQ.name), String(cloneSub.name));
            }
            if (Array.isArray(subQ.options)) {
              subQ.options.forEach((subOpt, subOptIndex) => {
                const cloneSubOpt = cloneSub.options?.[subOptIndex];
                if (subOpt?.name && cloneSubOpt?.name) {
                  optionMap.set(String(subOpt.name), String(cloneSubOpt.name));
                }
              });
            }
          });
        }
        optionMappingByOriginalKey.set(key, optionMap);
        if (question?.name && optionMap.size) {
          optionMappingByQuestionName.set(String(question.name), optionMap);
        }

        clonesResult.push(clone);
        return { index, key, clone, original: question };
      });

      const replaceNameReferences = (value) => {
        if (!value || typeof value !== "string") return value;
        let updated = value.replace(
          /\$\{([A-Za-z0-9._:-]+)\}/g,
          (match, token) => {
            if (combinedNameMapping.has(token)) {
              return `\${${combinedNameMapping.get(token)}}`;
            }
            return match;
          }
        );

        if (updated && updated.trim()) {
          const tokens = updated.split(/\s+/);
          const replacedTokens = tokens.map((token) =>
            combinedNameMapping.get(token) ?? token
          );
          updated = replacedTokens.join(" ");
        }

        return updated;
      };

      const replaceOptionTokens = (value, maps) => {
        if (!value || typeof value !== "string") return value;
        let updated = value;
        maps
          .filter((m) => m && m.size)
          .forEach((map) => {
            map.forEach((newName, oldName) => {
              if (!oldName || oldName === newName) return;
              const single = new RegExp(`'${escapeRegExp(oldName)}'`, "g");
              const double = new RegExp(`"${escapeRegExp(oldName)}"`, "g");
              updated = updated.replace(single, `'${newName}'`);
              updated = updated.replace(double, `"${newName}"`);
            });
          });
        return updated;
      };

      clonesWithIndex.forEach(({ clone, original, key }) => {
        const currentOptionMap = optionMappingByOriginalKey.get(key) || new Map();

        const stringFields = [
          "relevant",
          "constraint",
          "calculation",
          "trigger",
          "default",
          "guidance_hint",
          "parameters",
          "hint",
        ];

        stringFields.forEach((field) => {
          const originalFieldValue = clone[field];
          if (typeof originalFieldValue === "string") {
            let updated = replaceNameReferences(originalFieldValue);

            const mapsForReplacement = [];
            if (currentOptionMap.size) {
              mapsForReplacement.push(currentOptionMap);
            }
            optionMappingByQuestionName.forEach((map, originalName) => {
              if (
                map &&
                map.size &&
                originalFieldValue.includes(`\${${originalName}}`) &&
                !mapsForReplacement.some((existing) => existing === map)
              ) {
                mapsForReplacement.push(map);
              }
            });

            if (mapsForReplacement.length) {
              updated = replaceOptionTokens(updated, mapsForReplacement);
            }
            clone[field] = updated;
          }
        });

        if (Array.isArray(clone.conditions)) {
          clone.conditions = clone.conditions.map((cond) => {
            if (!cond || typeof cond !== "object") return cond;
            const updated = { ...cond };
            const originalConditionQuestion =
              typeof cond.question === "string" ? cond.question : "";
            if (originalConditionQuestion) {
              if (combinedNameMapping.has(originalConditionQuestion)) {
                updated.question = combinedNameMapping.get(originalConditionQuestion);
              }

              const conditionKey =
                idToSelectionKey.get(originalConditionQuestion) ??
                originalConditionQuestion;
              const optionMapForCondition =
                optionMappingByOriginalKey.get(String(conditionKey));
              if (
                optionMapForCondition &&
                typeof cond.value === "string" &&
                optionMapForCondition.has(cond.value)
              ) {
                updated.value = optionMapForCondition.get(cond.value);
              }
            }
            return updated;
          });
        }

        if (Array.isArray(clone.subQuestions) && Array.isArray(original.subQuestions)) {
          clone.subQuestions.forEach((subClone, subIdx) => {
            const subOriginal = original.subQuestions[subIdx];
            if (!subClone || !subOriginal) return;
            stringFields.forEach((field) => {
              const originalSubValue = subClone[field];
              if (typeof originalSubValue === "string") {
                let updated = replaceNameReferences(originalSubValue);

                const mapsForReplacement = [];
                if (currentOptionMap.size) {
                  mapsForReplacement.push(currentOptionMap);
                }
                optionMappingByQuestionName.forEach((map, originalName) => {
                  if (
                    map &&
                    map.size &&
                    originalSubValue.includes(`\${${originalName}}`) &&
                    !mapsForReplacement.some((existing) => existing === map)
                  ) {
                    mapsForReplacement.push(map);
                  }
                });

                if (mapsForReplacement.length) {
                  updated = replaceOptionTokens(updated, mapsForReplacement);
                }
                subClone[field] = updated;
              }
            });
          });
        }

        const candidateIds = [
          original.filterQuestionId,
          original.filterQuestionId
            ? idToSelectionKey.get(original.filterQuestionId)
            : undefined,
        ].filter(Boolean);

        candidateIds.forEach((candidate) => {
          if (questionIdentifierMapping.has(String(candidate))) {
            clone.filterQuestionId = questionIdentifierMapping.get(
              String(candidate)
            );
          }
        });

        const filterOriginalKey = original.filterQuestionId
          ? idToSelectionKey.get(original.filterQuestionId)
          : null;
        const filterOptionMap =
          (filterOriginalKey &&
            optionMappingByOriginalKey.get(filterOriginalKey)) ||
          new Map();

        if (Array.isArray(clone.filterOptionValues)) {
          clone.filterOptionValues = clone.filterOptionValues.map((value) =>
            filterOptionMap.get(value) ?? value
          );
        }

        if (clone.optionFilterMap && typeof clone.optionFilterMap === "object") {
          const updatedMap = {};
          Object.entries(clone.optionFilterMap).forEach(([filterValue, values]) => {
            const mappedKey = filterOptionMap.get(filterValue) ?? filterValue;
            const mappedValues = Array.isArray(values)
              ? values.map((val) => currentOptionMap.get(val) ?? val)
              : values;
            updatedMap[mappedKey] = mappedValues;
          });
          clone.optionFilterMap = updatedMap;
        }
      });

      const newQuestions = [...questions];
      let offset = 0;
      clonesWithIndex.forEach(({ index, clone }) => {
        newQuestions.splice(index + 1 + offset, 0, clone);
        offset += 1;
      });

      toast.success(
        `Duplicated ${clonesWithIndex.length} question${
          clonesWithIndex.length > 1 ? "s" : ""
        }.`
      );

      return { ...prevForm, questions: newQuestions };
    });

    if (clonesResult.length) {
      setSelectedQuestionKeys(() => {
        const next = new Set();
        clonesResult.forEach((clone) => {
          next.add(makeSelectionKey(clone));
        });
        return next;
      });
    }
  };

  // Function to add patient identification questions
  const handleAddPatientIdentificationQuestion = () => {
    // Check if the questions already exist
    const idTypeExists = form.questions.some(
      (q) => q.name === "patient_id_type"
    );
    const idNumberExists = form.questions.some(
      (q) => q.name === "user_identification_11_9943_01976848561"
    );

    if (idTypeExists || idNumberExists) {
      toast.warning(
        "Patient identification questions already exist in this form."
      );
      return;
    }

    const newQuestions = patientIdentificationQuestions.map((question) => ({
      ...question,
      _uuid: generateRandomId(),
      id: generateRandomId(),
    }));

    setForm((prevForm) => ({
      ...prevForm,
      questions: [...newQuestions, ...prevForm.questions],
    }));

    toast.success("Patient identification questions added successfully!");
    setShowPatientQuestionPanel(false);
  };

  if (isFormLoading) {
    return (
      <div className="min-h-[60vh] d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-2 text-secondary">Loading form... {loadingProgress}%</p>
          <div className="progress mx-auto" style={{ height: "8px", minWidth: "280px", maxWidth: "420px" }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              style={{ width: `${loadingProgress}%` }}
              aria-valuenow={loadingProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
          {isLoadTakingLong && (
            <p className="mt-3 mb-0 text-muted">
              Your form is very heavy, so it is taking a little longer. Please wait.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (formLoadError) {
    return (
      <div className="min-h-[60vh] d-flex align-items-center justify-content-center px-3">
        <div className="text-center">
          <p className="mb-3 text-danger">{formLoadError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className=" fixed top-[30%] right-0 p-4 space-y-4 border-r">
        {isAtTop ? (
          <button className="w-10 bg-white btn" onClick={scrollToBottom}>
            ↓
          </button>
        ) : (
          <button className="w-10 bg-white btn" onClick={scrollToTop}>
            ↑
          </button>
        )}
      </div>

      <div className="px-4 mt-5 ">
        <div ref={topRef}></div>

        <div className="flex items-center justify-between mb-4">
          <h2>Edit Form</h2>

          {/* Patient Identification Question Panel */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowPatientQuestionPanel(!showPatientQuestionPanel)
              }
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              title="Add Patient Identification Question"
            >
              <FaQuestionCircle />
              Patient ID Question
            </button>

            {showPatientQuestionPanel && (
              <div className="absolute right-0 z-10 p-4 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg top-full w-80">
                <h3 className="mb-3 text-lg font-semibold">
                  Patient Identification Question
                </h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded bg-gray-50">
                    <p className="text-sm text-gray-700">
                      <strong>Question 1:</strong> Patient ID Type (Select One)
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Question 2:</strong> Patient ID Number (Text
                      Input)
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Field Name:</strong>{" "}
                      user_identification_11_9943_01976848561
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Purpose:</strong> This two-part question first
                      asks users to select the type of ID (NID, Birth
                      Certificate, etc.), then collects the actual ID number to
                      automatically create and manage patient records.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddPatientIdentificationQuestion}
                      className="flex-1 px-3 py-2 text-white transition-colors bg-green-600 rounded hover:bg-green-700"
                    >
                      Add Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPatientQuestionPanel(false)}
                      className="flex-1 px-3 py-2 text-white transition-colors bg-gray-400 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Form Name:</label>
            <textarea
              type="text"
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              rows={1}
            />
            {errors["name"] && <p className="text-danger">{errors["name"]}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Form Style:</label>
            <select
              className="form-control"
              name="form_style"
              value={form.form_style || "default"}
              onChange={handleChange}
            >
              <option value="default">Default - single page</option>
              <option value="theme-grid">Grid theme</option>
              <option value="theme-grid all-caps">
                Grid theme with headings in ALL CAPS
              </option>
              <option value="pages">Multiple pages</option>
              <option value="theme-grid pages">
                Grid theme + Multiple pages
              </option>
              <option value="theme-grid pages all-caps">
                Grid theme + Multiple pages + headings in ALL CAPS
              </option>
            </select>
            <small className="text-muted">
              This controls how your form will be displayed in the web interface
              (Enketo).
            </small>
          </div>

          {backendValidationResult?.valid === false && (
            <div className="mb-3 alert alert-danger">
              <div className="fw-semibold">
                This form has XLSForm/Enketo validation errors.
              </div>
              {backendValidationResult?.validation_error && (
                <div className="mt-2 small text-break">
                  {backendValidationResult.validation_error}
                </div>
              )}

              {Array.isArray(backendValidationResult?.question_errors) &&
                backendValidationResult.question_errors.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 fw-semibold">
                      Question-level issues:
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {backendValidationResult.question_errors.map((item, idx) => {
                        const questionNumber =
                          Number.isInteger(item?.question_number) &&
                          item.question_number > 0
                            ? item.question_number
                            : Number(item?.question_index) + 1;
                        const locationText =
                          Number.isInteger(item?.subquestion_index) &&
                          item.subquestion_index >= 0
                            ? `Q${questionNumber} / Sub-Q${
                                item.subquestion_index + 1
                              }`
                            : `Q${questionNumber}`;
                        return (
                          <button
                            key={`${item?.question_index}-${item?.subquestion_index}-${item?.field}-${idx}`}
                            type="button"
                            className="text-start btn btn-sm btn-outline-danger"
                            onClick={() =>
                              jumpToQuestion(Number(item?.question_index))
                            }
                          >
                            <strong>{locationText}</strong>:{" "}
                            {formatQuestionErrorMessage(item)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {Array.isArray(backendValidationResult?.global_errors) &&
                backendValidationResult.global_errors.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 fw-semibold">Additional details:</div>
                    <div className="d-flex flex-column gap-1">
                      {backendValidationResult.global_errors.map((item, idx) => (
                        <div key={`global-${idx}`} className="small text-break">
                          {item?.message || String(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <div className="p-4 mt-2 mb-3 bg-white border rounded-lg border-black/90">
            <label className="form-label">Questions :</label>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleSelectAllQuestions}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleClearSelection}
                  disabled={!selectedCount}
                >
                  Clear Selection
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{selectedCount} selected</span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleBulkDuplicateSelected}
                  disabled={!selectedCount}
                >
                  Duplicate Selected
                </button>
              </div>
            </div>
            <Droppable droppableId="questions-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {/* TOP insertion slot */}
                  <InsertionSlot
                    slotIndex={0}
                    active={hoverSlot === 0}
                    onEnter={() => setHoverSlot(0)}
                    onLeave={() => setHoverSlot(null)}
                    onAddQ={() => handleInsertQuestionAt(0)}
                    onAddG={() => handleInsertGroupAt(0)}
                    onAddR={() => handleInsertRepeatAt(0)}
                  />

                  {form.questions.map((question, index) => {
                    const selectionKey = makeSelectionKey(question, index);
                    return (
                      <React.Fragment key={question._uuid}>
                        <Draggable draggableId={question._uuid} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={(node) => {
                                provided.innerRef(node);
                                if (node) {
                                  questionRefs.current[index] = node;
                                } else {
                                  delete questionRefs.current[index];
                                }
                              }}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.5 : 1,
                                marginBottom: "0.75rem",
                              }}
                            >
                              <Question
                                question={question}
                                index={index}
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
                                allQuestions={form.questions}
                                isEditing={isEditing}
                                projectId={projectId}
                                formId={formId}
                                handleDeleteOption={handleDeleteOption}
                                handleAddQuestionToGroup={
                                  handleAddQuestionToGroup
                                }
                                handleDuplicateQuestion={handleDuplicateQuestion}
                                isCollapsed={collapsed[index]}
                                onToggleCollapse={() => toggleCollapseAt(index)}
                                isSelected={isQuestionSelected(selectionKey)}
                                onToggleSelect={() =>
                                  toggleQuestionSelection(selectionKey)
                                }
                              />
                            </div>
                          )}
                        </Draggable>
                        {/* insertion slot AFTER this question */}
                        <InsertionSlot
                          slotIndex={index + 1}
                          active={hoverSlot === index + 1}
                          onEnter={() => setHoverSlot(index + 1)}
                          onLeave={() => setHoverSlot(null)}
                          onAddQ={() => handleInsertQuestionAt(index + 1)}
                          onAddG={() => handleInsertGroupAt(index + 1)}
                          onAddR={() => handleInsertRepeatAt(index + 1)}
                        />
                      </React.Fragment>
                    );
                  })}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 btn btn-secondary"
                onClick={handleAddQuestion}
              >
                Add Question
              </button>
              <button
                type="button"
                className="flex-1 btn btn-outline-secondary"
                onClick={handleAddGroup}
              >
                Add Group
              </button>
              <button
                type="button"
                className="flex-1 btn btn-outline-secondary"
                onClick={handleAddRepeat}
              >
                Add Repeat
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <button
              type="submit"
              className="btn bg-color-custom disabled:opacity-70"
              disabled={isFormSaving}
            >
              {isFormSaving
                ? `Updating Form... ${savingProgress}%`
                : "Update Form"}
            </button>
            {isFormSaving && (
              <div>
                <div className="progress" style={{ height: "8px", minWidth: "240px", maxWidth: "420px" }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: `${savingProgress}%` }}
                    aria-valuenow={savingProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                {isSaveTakingLong && (
                  <p className="mt-2 mb-0 text-sm text-muted">
                    Update is taking longer than usual. Please keep this page open.
                  </p>
                )}
              </div>
            )}
          </div>
          <div ref={bottomRef} className="mt-4" />
        </form>
        <QuestionTypeModal
          show={showModal}
          onHide={() => setShowModal(false)}
          onSelectType={handleSelectType}
        />
      </div>
    </DragDropContext>
  );
};

export default EditForm;

// Utility function for generating random IDs
function generateRandomId(length = 8) {
  return Math.random()
    .toString(36)
    .slice(2, length + 2);
}

// Hover Insertion Slot (between items)
function InsertionSlot({
  slotIndex,
  active,
  onEnter,
  onLeave,
  onAddQ,
  onAddG,
  onAddR,
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: "relative",
        height: "12px",
        margin: "6px 0",
      }}
    >
      {active && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "-8px",
            zIndex: 5,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            className="shadow"
            style={{
              background: "white",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "6px 8px",
              display: "flex",
              gap: 8,
            }}
          >
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onAddQ}
            >
              + Add Question
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={onAddG}
            >
              + Add Group
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={onAddR}
            >
              + Add Repeat
            </button>
          </div>
        </div>
      )}
      {/* visual guideline */}
      <div
        style={{
          height: 2,
          background: active ? "#0d6efd" : "transparent",
          transition: "background 0.15s",
        }}
      />
    </div>
  );
}

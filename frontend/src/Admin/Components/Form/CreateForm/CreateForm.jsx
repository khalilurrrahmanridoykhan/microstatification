/** ---------- Deep clone and ensure unique IDs for duplication ---------- */
function deepCloneQuestion(q, allUsedNames) {
  // Clone and assign new id/_uuid, and ensure unique name
  const genId = () => Math.random().toString(36).slice(2, 11);
  const ensureUniqueName = (base, used) => {
    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${base}_${n}`;
      n++;
    }
    used.add(candidate);
    return candidate;
  };

  const usedNames = new Set(allUsedNames);
  const clone = JSON.parse(JSON.stringify(q));
  clone.id = genId();
  clone._uuid = genId();
  if (clone.name) clone.name = ensureUniqueName(clone.name, usedNames);

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
      const base = opt.name ? opt.name.replace(/_\d+$/, "") : genId();
      return {
        ...opt,
        _uuid: genId(),
        name: ensureUniqueName(base, usedNames),
      };
    });
  }

  // SubQuestions: assign new names and update type id if select_one/select_multiple
  if (Array.isArray(clone.subQuestions)) {
    clone.subQuestions = clone.subQuestions.map((sq) => {
      const base = sq.name ? sq.name.replace(/_\d+$/, "") : genId();
      let newType = sq.type;
      if (
        typeof newType === "string" &&
        (newType.startsWith("select_one ") ||
          newType.startsWith("select_multiple "))
      ) {
        const parts = newType.split(/\s+/);
        if (parts.length === 2) {
          parts[1] = genId();
          newType = parts.join(" ");
        }
      }
      return {
        ...sq,
        name: ensureUniqueName(base, usedNames),
        type: newType,
      };
    });
  }

  return clone;
}
// CreateForm.jsx
import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Question from "./Question";
import QuestionTypeModal from "./QuestionTypeModal";
import { BACKEND_URL } from "../../../../config";
import { toast } from "sonner";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { FaQuestionCircle } from "react-icons/fa";

/** ---------- Helpers ---------- */
const genId = () => Math.random().toString(36).slice(2, 11);
const ensureId = (q) => {
  // Guarantee stable id/_uuid string
  if (!q) return q;
  if (!q.id) q.id = genId();
  if (!q._uuid) q._uuid = q.id;
  // draggableId must be string
  q.id = String(q.id);
  q._uuid = String(q._uuid);
  return q;
};

const makeEmptyQuestion = () =>
  ensureId({
    id: genId(),
    _uuid: undefined, // will be set by ensureId
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
  });

const makeGroupPair = () => {
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
    isGroupEnd: true,
    groupId: groupKey,
  });
  return [begin, end];
};

const makeRepeatPair = () => {
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
    isRepeatEnd: true,
    repeatId: repeatKey,
  });
  return [begin, end];
};

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
      { name: "nid", label: "NID (National ID)", _uuid: "nid_option" },
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

const CreateForm = () => {
  // ...existing code...

  /** ---------- Duplicate Question ---------- */
  const handleDuplicateQuestion = (index) => {
    // Gather all used names for uniqueness
    const allUsedNames = [];
    questions.forEach((q) => {
      if (q.name) allUsedNames.push(q.name);
      if (Array.isArray(q.options)) {
        q.options.forEach((opt) => opt.name && allUsedNames.push(opt.name));
      }
      if (Array.isArray(q.subQuestions)) {
        q.subQuestions.forEach((sq) => sq.name && allUsedNames.push(sq.name));
      }
    });
    const original = questions[index];
    const clone = deepCloneQuestion(original, allUsedNames);
    setQuestions((prev) => {
      const n = [...prev];
      n.splice(index + 1, 0, clone);
      return n;
    });
  };
  const { projectId } = useParams();
  const [name, setName] = useState("");
  const [formStyle, setFormStyle] = useState("default");
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [openSettings, setOpenSettings] = useState({});
  const [isAtTop, setIsAtTop] = useState(true);
  const [showPatientQuestionPanel, setShowPatientQuestionPanel] =
    useState(false);
  const [selectedQuestionKeys, setSelectedQuestionKeys] = useState(
    () => new Set()
  );

  // collapsed state per question index
  const [collapsed, setCollapsed] = useState({}); // { [index]: boolean }

  // which gap is hovered: 0..questions.length
  const [hoverSlot, setHoverSlot] = useState(null);
  // Collapse toggle for a question
  const toggleCollapseAt = (index) => {
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const navigate = useNavigate();
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtTop(true);
  };
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtTop(false);
  };

  /** ---------- Normalize existing list (useful if reloading from storage) ---------- */
  useEffect(() => {
    setQuestions((prev) => prev.map(ensureId));
  }, []);

  /** ---------- Handlers ---------- */
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions].map(ensureId);

    if (field === "label") {
      const label = value;
      let baseName = label.toLowerCase().replace(/[^a-z0-9-._:]/g, "_");
      if (!/^[a-z:_]/.test(baseName)) baseName = `_${baseName}`;
      // unique per form
      let nameOut = baseName;
      let suffix = 1;
      while (newQuestions.some((q, i) => i !== index && q.name === nameOut)) {
        nameOut = `${baseName}_${suffix++}`;
      }
      newQuestions[index].label = label;
      newQuestions[index].name = nameOut;
    } else if (field === "parameters") {
      // typed-specific formatting
      const t = newQuestions[index].type || "";
      if (t === "image") {
        newQuestions[index].parameters = `max-pixels=${
          String(value).split("=")[1] || ""
        }`;
      } else if (
        t.startsWith("select_one") ||
        t.startsWith("select_multiple")
      ) {
        const [randomize, seed] = String(value)
          .split(";")
          .map((param) => (param.split("=")[1] ?? "").trim());
        newQuestions[index].parameters = `randomize=${randomize};seed=${seed}`;
      } else {
        newQuestions[index][field] = value;
      }
    } else {
      newQuestions[index][field] = value;
    }

    setQuestions(newQuestions.map(ensureId));
  };

  // Append add
  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, makeEmptyQuestion()]);
  };
  const handleAddGroup = () => {
    const [b, e] = makeGroupPair();
    setQuestions((prev) => [...prev, b, e]);
  };
  const handleAddRepeat = () => {
    const [b, e] = makeRepeatPair();
    setQuestions((prev) => [...prev, b, e]);
  };

  // Insert add (for hover slot)
  const handleInsertQuestionAt = (slotIndex) => {
    const newQs = [...questions];
    newQs.splice(slotIndex, 0, makeEmptyQuestion());
    setQuestions(newQs);
    setHoverSlot(null);
  };
  const handleInsertGroupAt = (slotIndex) => {
    const [b, e] = makeGroupPair();
    const newQs = [...questions];
    newQs.splice(slotIndex, 0, b, e);
    setQuestions(newQs);
    setHoverSlot(null);
  };
  const handleInsertRepeatAt = (slotIndex) => {
    const [b, e] = makeRepeatPair();
    const newQs = [...questions];
    newQs.splice(slotIndex, 0, b, e);
    setQuestions(newQs);
    setHoverSlot(null);
  };

  const handleAddQuestionToGroup = (groupIndex) => {
    const q = ensureId({
      ...makeEmptyQuestion(),
      type: "text",
      name: genId(),
    });
    const newQs = [...questions];
    newQs.splice(groupIndex + 1, 0, q);
    setQuestions(newQs);
  };

  const handleDeleteQuestion = (index) => {
    const newQs = questions.filter((_, i) => i !== index);
    setQuestions(newQs);
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const newQs = [...questions];
    const q = newQs[questionIndex];
    if (!q.options) q.options = [];
    if (field === "label") {
      const label = value;
      let baseName = label.toLowerCase().replace(/[^a-z0-9-._:]/g, "_");
      if (!/^[a-z:_]/.test(baseName)) baseName = `_${baseName}`;
      let nameOut = baseName;
      let suffix = 1;
      while (
        q.options.some((opt, i) => i !== optionIndex && opt.name === nameOut)
      ) {
        nameOut = `${baseName}_${suffix++}`;
      }
      q.options[optionIndex] = {
        ...q.options[optionIndex],
        label,
        name: nameOut,
      };
    } else {
      q.options[optionIndex] = { ...q.options[optionIndex], [field]: value };
    }
    setQuestions(newQs.map(ensureId));
  };

  const handleAddOption = (questionIndex) => {
    const newQs = [...questions];
    const q = newQs[questionIndex];
    if (!q.options) q.options = [];
    q.options.push({ name: genId(), label: "" });
    setQuestions(newQs);
  };

  const handleAddSubQuestion = (questionIndex) => {
    const newQs = [...questions];
    const q = newQs[questionIndex];
    if (!q.subQuestions) q.subQuestions = [];
    const subIndex = q.subQuestions.length;
    const list_id = q.list_id;
    const subName = `_${subIndex + 1}${getOrdinalSuffix(subIndex + 1)}_choice`;

    // build constraint avoiding duplicates with earlier subs
    let constraint = "";
    for (let i = 0; i < subIndex; i++) {
      if (constraint) constraint += " and ";
      const prev = q.subQuestions[i].name;
      constraint += `\${${prev}} != \${${subName}}`;
    }
    q.subQuestions.push({
      index: subIndex,
      type: `select_one ${list_id}`,
      name: subName,
      label: "",
      required: false,
      appearance: "list-nolabel",
      options: [],
      constraint,
    });
    setQuestions(newQs);
  };

  const handleSubQuestionChange = (
    questionIndex,
    subQuestionIndex,
    field,
    value
  ) => {
    const newQs = [...questions];
    const q = newQs[questionIndex];
    const sq = { ...(q.subQuestions?.[subQuestionIndex] || {}) };
    if (field === "label") {
      const label = value;
      const name = label.toLowerCase().replace(/\s+/g, "_");
      q.subQuestions[subQuestionIndex] = { ...sq, label, name };
    } else {
      q.subQuestions[subQuestionIndex] = { ...sq, [field]: value };
    }
    setQuestions(newQs);
  };

  const handleDeleteSubQuestion = (questionIndex, subQuestionIndex) => {
    const newQs = [...questions];
    newQs[questionIndex].subQuestions.splice(subQuestionIndex, 1);
    setQuestions(newQs);
  };

  const handleDeleteOption = (questionIndex, optionIndex) => {
    const newQs = [...questions];
    newQs[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) {
      newErrors["name"] = "Form name cannot be empty.";
    }

    questions.forEach((q, index) => {
      if (q.type === "end_group" || q.type === "end_repeat") return;

      if (!q.label?.trim()) {
        newErrors[index] = "Label for Question cannot be empty.";
      }

      const hasConditions =
        Array.isArray(q.conditions) && q.conditions.length > 0;
      const relevantNotSet = !q.relevant || q.relevant.trim() === "";
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

      if (q.type === "rating") {
        (q.subQuestions || []).forEach((sq, sidx) => {
          if (!sq.label?.trim()) {
            newErrors[`${index}-${sidx}`] = `Label for Sub-Question ${
              sidx + 1
            } cannot be empty.`;
          }
        });
      }

      if (
        q.type?.startsWith("select_one") ||
        q.type?.startsWith("select_multiple")
      ) {
        if (!Array.isArray(q.options) || q.options.length === 0) {
          newErrors[`${index}-options`] = `Question ${
            index + 1
          } must have at least one option.`;
          toast.error(`Question ${index + 1} must have at least one option.`);
        } else {
          q.options.forEach((opt, oi) => {
            if (!opt.label || opt.label.trim() === "") {
              newErrors[`${index}-option-${oi}`] = `Option ${
                oi + 1
              } in Question ${index + 1} cannot be empty.`;
              toast.error(
                `Option ${oi + 1} in Question ${index + 1} cannot be empty.`
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

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.post(
        `${BACKEND_URL}/api/projects/${projectId}/create_form/`,
        { name, questions, formStyle },
        { headers: { Authorization: `Token ${token}` } }
      );
      const formId = response.data.form_id;
      if (formId) {
        navigate(`/projects/${projectId}/forms/${formId}`);
      } else {
        navigate(`/forms/all`);
      }
      toast.success("Form created and files generated successfully");
      sessionStorage.removeItem("formQuestions");
      sessionStorage.removeItem("formName");
      setQuestions([]);
      setName("");
    } catch (err) {
      console.error("Error creating form:", err);
    }
  };

  const toggleSettings = (index) => {
    setOpenSettings((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleShowModal = (index) => {
    setCurrentQuestionIndex(index);
    setShowModal(true);
  };

  /**
   * IMPORTANT: Merge new type into existing object and KEEP id/_uuid stable.
   * This prevents Draggable from breaking when selecting "select_one" / "select_multiple".
   */
  const handleSelectType = (type) => {
    const newQs = [...questions].map(ensureId);
    const idx = currentQuestionIndex;
    if (idx == null || idx < 0 || idx >= newQs.length) return;

    const q = { ...newQs[idx] }; // copy existing AND keep id/_uuid

    if (type === "rating") {
      const list_id = genId();
      q.type = "rating";
      q.list_id = list_id;
      q.options = q.options?.length ? q.options : [{ name: "", label: "" }];
      q.subQuestions = [];
      q.constraint_message = "Items cannot be selected more than once";
      for (let i = 0; i < 3; i++) {
        const subName = `_${i + 1}${getOrdinalSuffix(i + 1)}_choice`;
        let constraint = "";
        for (let j = 0; j < i; j++) {
          const prev = `_${j + 1}${getOrdinalSuffix(j + 1)}_choice`;
          if (constraint) constraint += " and ";
          constraint += `\${${subName}} != \${${prev}}`;
        }
        q.subQuestions.push({
          index: i,
          type: `select_one ${list_id}`,
          name: subName,
          label: "",
          required: false,
          appearance: "list-nolabel",
          options: [],
          constraint,
        });
      }
    } else if (type === "select_one" || type === "select_multiple") {
      const randomId = genId();
      q.type = `${type} ${randomId}`; // XLSForm style "select_one list_name"
      q.options = q.options?.length ? q.options : [{ name: "", label: "" }];
      q.subQuestions = q.subQuestions || [];
      // keep all other fields
    } else {
      q.type = type;
    }

    newQs[idx] = ensureId(q);
    setQuestions(newQs);
    setShowModal(false);
  };

  const getOrdinalSuffix = (n) =>
    n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";

  const makeSelectionKey = (question, index = 0) =>
    String(question?._uuid ?? question?.id ?? question?.idx ?? question?.name ?? index);

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
      questions.forEach((q, idx) => next.add(makeSelectionKey(q, idx)));
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

    const selectedEntries = questions
      .map((question, index) => ({
        question,
        index,
        key: makeSelectionKey(question, index),
      }))
      .filter((entry) => selectedQuestionKeys.has(entry.key));

    if (!selectedEntries.length) {
      toast.info("Selected questions are no longer available to duplicate.");
      return;
    }

    selectedEntries.sort((a, b) => a.index - b.index);

    const allUsedNames = [];
    questions.forEach((q) => {
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

    const clones = selectedEntries.map(({ question, index }) => {
      const clone = deepCloneQuestion(question, allUsedNames);
      if (question?.label) {
        clone.label = `${question.label} (Copy)`;
      }

      if (clone?.name) allUsedNames.push(clone.name);
      if (Array.isArray(clone?.options)) {
        clone.options.forEach((opt) => {
          if (opt?.name) allUsedNames.push(opt.name);
        });
      }
      if (Array.isArray(clone?.subQuestions)) {
        clone.subQuestions.forEach((sq) => {
          if (sq?.name) allUsedNames.push(sq.name);
        });
      }

      return { index, clone };
    });

    setQuestions((prev) => {
      const next = [...prev];
      let offset = 0;
      clones.forEach(({ index, clone }) => {
        next.splice(index + 1 + offset, 0, ensureId(clone));
        offset += 1;
      });
      return next.map(ensureId);
    });

    setSelectedQuestionKeys(() => {
      const next = new Set();
      clones.forEach(({ clone }) => next.add(makeSelectionKey(clone)));
      return next;
    });

    toast.success(
      `Duplicated ${clones.length} question${clones.length > 1 ? "s" : ""}.`
    );
  };

  const handleAddPatientIdentificationQuestion = () => {
    const idTypeExists = questions.some((q) => q.name === "patient_id_type");
    const idNumberExists = questions.some(
      (q) => q.name === "user_identification_11_9943_01976848561"
    );

    if (idTypeExists || idNumberExists) {
      toast.warning(
        "Patient identification questions already exist in this form."
      );
      return;
    }

    const newQuestions = patientIdentificationQuestions.map((question) =>
      ensureId({
        ...question,
        _uuid: genId(),
        id: genId(),
      })
    );

    setQuestions((prev) => [...newQuestions, ...prev]);
    toast.success("Patient identification questions added successfully!");
    setShowPatientQuestionPanel(false);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newQs = Array.from(questions);
    const [moved] = newQs.splice(result.source.index, 1);
    newQs.splice(result.destination.index, 0, moved);
    setQuestions(newQs);
  };

  /** ---------- Before unload guard ---------- */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Refreshing or closing the tab will remove unsaved form data. Make sure to save or create the form.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="fixed top-[30%] right-0 p-4 space-y-4 border-r">
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

      <div className="px-4 mt-5">
        <div ref={topRef} />
        <div className="flex items-center justify-between mb-4">
          <h2>Create Form</h2>
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

        <form onSubmit={handleSubmit} className="p-4 rounded-lg max-w-[1700px]">
          <div className="mb-3 ">
            <label className="text-xl form-label">Form name:</label>
            <textarea
              rows={1}
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors["name"] && <p className="text-danger">{errors["name"]}</p>}
          </div>

          <div className="mb-3">
            <label className="text-xl form-label">Form Style:</label>
            <select
              className="form-control"
              value={formStyle}
              onChange={(e) => setFormStyle(e.target.value)}
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

          <div className="p-4 mt-2 mb-3 bg-white border rounded-lg border-black/90">
            <label className="text-xl form-label">Questions:</label>
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

                  {questions.map((question, index) => {
                    const safeQ = ensureId(question);
                    const draggableId = safeQ._uuid; // guaranteed string
                    const selectionKey = makeSelectionKey(safeQ, index);
                    return (
                      <React.Fragment key={draggableId}>
                        <Draggable draggableId={draggableId} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.5 : 1,
                                marginBottom: "0.75rem",
                              }}
                            >
                              <Question
                                question={safeQ}
                                index={index}
                                handleQuestionChange={handleQuestionChange}
                                handleDeleteQuestion={handleDeleteQuestion}
                                toggleSettings={toggleSettings}
                                openSettings={openSettings}
                                handleAddOption={handleAddOption}
                                handleOptionChange={handleOptionChange}
                                handleAddSubQuestion={handleAddSubQuestion}
                                handleSubQuestionChange={
                                  handleSubQuestionChange
                                }
                                handleDeleteSubQuestion={
                                  handleDeleteSubQuestion
                                }
                                handleShowModal={handleShowModal}
                                errors={errors}
                                allQuestions={questions}
                                handleDeleteOption={handleDeleteOption}
                                handleAddQuestionToGroup={
                                  handleAddQuestionToGroup
                                }
                                handleDuplicateQuestion={
                                  handleDuplicateQuestion
                                }
                                isCollapsed={!!collapsed[index]}
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

            {/* Legacy append buttons */}
            <div className="flex gap-2 mt-2">
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

          <button type="submit" className="btn bg-color-custom">
            Create Form
          </button>
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

export default CreateForm;

/** ---------- Hover Insertion Slot (between items) ---------- */
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

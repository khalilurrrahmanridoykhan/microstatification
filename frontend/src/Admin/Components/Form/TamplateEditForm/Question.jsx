import React, { useState, useEffect } from "react";
import { Collapse, Form, Button, Tabs, Tab, Table } from "react-bootstrap";
import { useDrag, useDrop } from "react-dnd";
import Option from "./Option";
import SubQuestion from "./SubQuestion";
import { FaTrash } from "react-icons/fa"; // Import the delete icon
import { MdFormatListBulletedAdd, MdContentCopy } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { RiDeleteBin5Line } from "react-icons/ri";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { FaRegTrashCan } from "react-icons/fa6";

// Helper function to build regex constraint from patterns
const updateRegexConstraint = (index, patterns, handleQuestionChange) => {
  if (!patterns || patterns.length === 0) {
    handleQuestionChange(index, "constraint", "");
    return;
  }

  const regexParts = patterns
    .map((pattern) => {
      switch (pattern.type) {
        case "digits":
          return pattern.value ? `^[0-9]{${pattern.value}}$` : "";
        case "range":
          if (pattern.min && pattern.max) {
            return `^[0-9]{${pattern.min},${pattern.max}}$`;
          } else if (pattern.min) {
            return `^[0-9]{${pattern.min},}$`;
          } else if (pattern.max) {
            return `^[0-9]{1,${pattern.max}}$`;
          }
          return "";
        case "letters":
          return "^[a-zA-Z]+$";
        case "alphanumeric":
          return "^[a-zA-Z0-9]+$";
        case "email":
          return "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        default:
          return "";
      }
    })
    .filter((part) => part !== "");

  if (regexParts.length > 0) {
    const regexPattern = regexParts.join("|");
    handleQuestionChange(index, "constraint", `regex(., '${regexPattern}')`);
  } else {
    handleQuestionChange(index, "constraint", "");
  }
};

// CalculationBuilder Component for advanced calculation creation
const CalculationBuilder = ({
  question,
  index,
  handleQuestionChange,
  questions = [],
}) => {
  const [calculationType, setCalculationType] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);
  const [operator, setOperator] = useState("");
  const [conditions, setConditions] = useState([]);

  // Get available fields from all questions for reference
  const availableFields = questions
    .filter((q, i) => i <= index) // Include current question and all previous questions
    .map((q) => ({
      name: q.name,
      label: q.label,
      type: q.type,
      options: q.options || [], // Include options for select questions
    }))
    .filter((q) => q.name); // Only questions with names

  const calculationTypes = [
    { value: "conditional", label: "Conditional (if/then/else)" },
    { value: "mathematical", label: "Mathematical Operation" },
    { value: "text", label: "Text Function" },
    { value: "date", label: "Date Calculation" },
    { value: "advanced", label: "Advanced Formula" },
  ];

  const mathOperators = [
    { value: "+", label: "Add (+)" },
    { value: "-", label: "Subtract (-)" },
    { value: "*", label: "Multiply (*)" },
    { value: "div", label: "Divide (div)" },
    { value: "mod", label: "Modulo (mod)" },
  ];

  const textFunctions = [
    { value: "concat", label: "Concatenate text" },
    { value: "substr", label: "Substring" },
    { value: "string-length", label: "String length" },
    { value: "upper-case", label: "Uppercase" },
    { value: "lower-case", label: "Lowercase" },
  ];

  const dateFunctions = [
    { value: "today", label: "Today's date" },
    { value: "now", label: "Current date and time" },
    { value: "date", label: "Format date" },
  ];

  const conditionOperators = [
    { value: "=", label: "equals" },
    { value: "!=", label: "not equals" },
    { value: ">", label: "greater than" },
    { value: "<", label: "less than" },
    { value: ">=", label: "greater than or equal" },
    { value: "<=", label: "less than or equal" },
  ];

  const generateCalculation = () => {
    let calculation = "";
    let trigger = "";

    switch (calculationType) {
      case "conditional":
        if (conditions.length > 0) {
          const condition = conditions[0];
          // Wrap the condition value in single quotes for XLSForm compatibility
          const quotedValue = `'${condition.value}'`;
          const quotedTrueValue = `'${condition.trueValue}'`;
          const quotedFalseValue = `'${condition.falseValue}'`;
          calculation = `if(${condition.field} ${condition.operator} ${quotedValue}, ${quotedTrueValue}, ${quotedFalseValue})`;
          // Auto-set trigger to the referenced field
          trigger = condition.field;
        }
        break;
      case "mathematical":
        if (selectedFields.length >= 2 && operator) {
          if (operator === "div") {
            calculation = `${selectedFields[0]} div ${selectedFields[1]}`;
          } else {
            calculation = selectedFields.join(` ${operator} `);
          }
          // Auto-set trigger to all referenced fields
          trigger = selectedFields.join(" ");
        }
        break;
      case "text":
        if (operator === "concat" && selectedFields.length > 0) {
          calculation = `concat(${selectedFields
            .map((field) => `\${${field}}`)
            .join(", ")})`;
          // Auto-set trigger to all referenced fields
          trigger = selectedFields.map((field) => `\${${field}}`).join(" ");
        }
        break;
      case "date":
        calculation = operator;
        // Date functions usually don't need triggers
        trigger = "";
        break;
      default:
        calculation = question.calculation || "";
        trigger = question.trigger || "";
    }

    handleQuestionChange(index, "calculation", calculation);
    handleQuestionChange(index, "trigger", trigger);
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "", operator: "=", value: "", trueValue: "", falseValue: "" },
    ]);
  };

  const updateCondition = (condIndex, field, value) => {
    const updatedConditions = conditions.map((cond, i) =>
      i === condIndex ? { ...cond, [field]: value } : cond
    );
    setConditions(updatedConditions);
  };

  const removeCondition = (condIndex) => {
    setConditions(conditions.filter((_, i) => i !== condIndex));
  };

  const insertFieldReference = (fieldName) => {
    const currentCalculation = question.calculation || "";
    const newCalculation = currentCalculation + `\${${fieldName}}`;
    handleQuestionChange(index, "calculation", newCalculation);
  };

  // Helper function to check if a field is select type
  const isSelectField = (fieldType) => {
    return (
      fieldType &&
      (fieldType.startsWith("select_one") ||
        fieldType.startsWith("select_multiple"))
    );
  };

  // Get options for a specific field
  const getFieldOptions = (fieldName) => {
    const field = availableFields.find((f) => f.name === fieldName);
    return field ? field.options : [];
  };

  return (
    <div className="p-3 border rounded calculation-builder">
      <h6 className="mb-3">Calculation Builder</h6>

      {/* Calculation Type Selection */}
      <div className="mb-3">
        <label className="form-label">Calculation Type:</label>
        <select
          className="form-select"
          value={calculationType}
          onChange={(e) => setCalculationType(e.target.value)}
        >
          <option value="">Select calculation type...</option>
          {calculationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional Logic Builder */}
      {calculationType === "conditional" && (
        <div className="mb-3">
          <div className="mb-2 d-flex justify-content-between align-items-center">
            <label className="form-label">Conditions:</label>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={addCondition}
            >
              Add Condition
            </button>
          </div>
          {conditions.map((condition, condIndex) => (
            <div key={condIndex} className="p-2 mb-2 border rounded">
              <div className="row g-2">
                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={condition.field}
                    onChange={(e) =>
                      updateCondition(condIndex, "field", e.target.value)
                    }
                  >
                    <option value="">Select field...</option>
                    {availableFields.map((field) => {
                      // Check if this field belongs to the current question
                      const isCurrentQuestion = field.name === question.name;
                      return (
                        <option key={field.name} value={`\${${field.name}}`}>
                          {field.label || field.name}{" "}
                          {isSelectField(field.type)
                            ? "(select)"
                            : `(${field.type})`}
                          {isCurrentQuestion ? " [Current]" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select form-select-sm"
                    value={condition.operator}
                    onChange={(e) =>
                      updateCondition(condIndex, "operator", e.target.value)
                    }
                  >
                    {conditionOperators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  {(() => {
                    // Extract field name from condition.field (removes ${} wrapper)
                    const fieldName = condition.field.replace(/^\$\{|\}$/g, "");
                    const selectedField = availableFields.find(
                      (f) => f.name === fieldName
                    );
                    const isSelect =
                      selectedField && isSelectField(selectedField.type);

                    if (isSelect && selectedField.options.length > 0) {
                      return (
                        <select
                          className="form-select form-select-sm"
                          value={condition.value}
                          onChange={(e) =>
                            updateCondition(condIndex, "value", e.target.value)
                          }
                        >
                          <option value="">Select option...</option>
                          {selectedField.options.map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.label || option.name}
                            </option>
                          ))}
                        </select>
                      );
                    } else {
                      return (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Value"
                          value={condition.value}
                          onChange={(e) =>
                            updateCondition(condIndex, "value", e.target.value)
                          }
                        />
                      );
                    }
                  })()}
                </div>
                <div className="col-md-2">
                  <div className="d-flex flex-column">
                    <input
                      type="text"
                      className="mb-1 form-control form-control-sm"
                      placeholder="If true (or option name)"
                      value={condition.trueValue}
                      onChange={(e) =>
                        updateCondition(condIndex, "trueValue", e.target.value)
                      }
                    />
                    {availableFields.some(
                      (f) => isSelectField(f.type) && f.options.length > 0
                    ) && (
                      <select
                        className="form-select form-select-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            updateCondition(
                              condIndex,
                              "trueValue",
                              e.target.value
                            );
                          }
                        }}
                      >
                        <option value="">Quick select option...</option>
                        <optgroup label="Common Values">
                          <option value="1">1 (Yes/True)</option>
                          <option value="0">0 (No/False)</option>
                          <option value="yes">yes</option>
                          <option value="no">no</option>
                        </optgroup>
                        <optgroup label="Available Options">
                          {availableFields
                            .filter(
                              (f) =>
                                isSelectField(f.type) && f.options.length > 0
                            )
                            .map((field) =>
                              field.options.map((option) => (
                                <option
                                  key={`${field.name}-${option.name}`}
                                  value={option.name}
                                >
                                  {field.label}: {option.label || option.name}
                                </option>
                              ))
                            )}
                        </optgroup>
                      </select>
                    )}
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="d-flex flex-column">
                    <input
                      type="text"
                      className="mb-1 form-control form-control-sm"
                      placeholder="If false (or option name)"
                      value={condition.falseValue}
                      onChange={(e) =>
                        updateCondition(condIndex, "falseValue", e.target.value)
                      }
                    />
                    {availableFields.some(
                      (f) => isSelectField(f.type) && f.options.length > 0
                    ) && (
                      <select
                        className="form-select form-select-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            updateCondition(
                              condIndex,
                              "falseValue",
                              e.target.value
                            );
                          }
                        }}
                      >
                        <option value="">Quick select option...</option>
                        <optgroup label="Common Values">
                          <option value="1">1 (Yes/True)</option>
                          <option value="0">0 (No/False)</option>
                          <option value="yes">yes</option>
                          <option value="no">no</option>
                        </optgroup>
                        <optgroup label="Available Options">
                          {availableFields
                            .filter(
                              (f) =>
                                isSelectField(f.type) && f.options.length > 0
                            )
                            .map((field) =>
                              field.options.map((option) => (
                                <option
                                  key={`${field.name}-${option.name}-false`}
                                  value={option.name}
                                >
                                  {field.label}: {option.label || option.name}
                                </option>
                              ))
                            )}
                        </optgroup>
                      </select>
                    )}
                  </div>
                </div>
                <div className="col-md-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeCondition(condIndex)}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
          {conditions.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">
                💡 <strong>Tip:</strong> When you select a field with options
                (select_one/select_multiple), the Value dropdown will show
                available options. For True/False values, you can type custom
                values or use the dropdown to quickly select option names from
                any select fields. <strong>Note:</strong> The builder
                automatically wraps values in single quotes for XLSForm
                compatibility.
              </small>
            </div>
          )}
        </div>
      )}

      {/* Mathematical Operations */}
      {calculationType === "mathematical" && (
        <div className="mb-3">
          <label className="form-label">Mathematical Operation:</label>
          <div className="row g-2">
            <div className="col-md-6">
              <select
                className="form-select"
                multiple
                value={selectedFields}
                onChange={(e) =>
                  setSelectedFields(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
              >
                {availableFields.map((field) => {
                  const isCurrentQuestion = field.name === question.name;
                  return (
                    <option key={field.name} value={`\${${field.name}}`}>
                      {field.label || field.name}{" "}
                      {isSelectField(field.type)
                        ? "(select)"
                        : `(${field.type})`}
                      {isCurrentQuestion ? " [Current]" : ""}
                    </option>
                  );
                })}
              </select>
              <small className="text-muted">
                Hold Ctrl/Cmd to select multiple fields
              </small>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              >
                <option value="">Select operator...</option>
                {mathOperators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Text Functions */}
      {calculationType === "text" && (
        <div className="mb-3">
          <label className="form-label">Text Function:</label>
          <select
            className="form-select"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
          >
            <option value="">Select function...</option>
            {textFunctions.map((func) => (
              <option key={func.value} value={func.value}>
                {func.label}
              </option>
            ))}
          </select>

          {operator === "concat" && (
            <div className="mt-2">
              <select
                className="form-select"
                multiple
                value={selectedFields}
                onChange={(e) =>
                  setSelectedFields(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
              >
                {availableFields.map((field) => {
                  const isCurrentQuestion = field.name === question.name;
                  return (
                    <option key={field.name} value={field.name}>
                      {field.label || field.name}
                      {isCurrentQuestion ? " [Current]" : ""}
                    </option>
                  );
                })}
              </select>
              <small className="text-muted">Select fields to concatenate</small>
            </div>
          )}
        </div>
      )}

      {/* Date Functions */}
      {calculationType === "date" && (
        <div className="mb-3">
          <label className="form-label">Date Function:</label>
          <select
            className="form-select"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
          >
            <option value="">Select function...</option>
            {dateFunctions.map((func) => (
              <option key={func.value} value={func.value}>
                {func.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Generate Button */}
      <div className="mb-3">
        <button
          type="button"
          className="btn btn-primary me-2"
          onClick={generateCalculation}
        >
          Generate Calculation
        </button>
      </div>

      {/* Manual Calculation Input */}
      <div className="mb-3">
        <label className="form-label">Manual Calculation Formula:</label>
        <textarea
          className="form-control"
          rows="3"
          value={question.calculation || ""}
          onChange={(e) =>
            handleQuestionChange(index, "calculation", e.target.value)
          }
          placeholder="Enter XLSForm calculation formula manually..."
        />
        <small className="text-muted">
          Use XLSForm syntax: if(), math operations (+, -, *, div), functions
          like concat(), today(), etc. <strong>Important:</strong> Wrap option
          values and text in single quotes: '1', '2', 'yes', 'no'
        </small>
      </div>

      {/* Trigger Field */}
      <div className="mb-3">
        <label className="form-label">Trigger (when to recalculate):</label>
        <input
          type="text"
          className="form-control"
          value={question.trigger || ""}
          onChange={(e) =>
            handleQuestionChange(index, "trigger", e.target.value)
          }
          placeholder="e.g., ${Q1} or ${field1} ${field2}"
        />
        <small className="text-muted">
          Specify which field changes should trigger this calculation to update.
          Auto-filled when using the builder above.
        </small>
      </div>

      {/* Field Reference Helper */}
      {availableFields.length > 0 && (
        <div className="mb-3">
          <label className="form-label">Quick Field Reference:</label>
          <div className="flex-wrap gap-1 d-flex">
            {availableFields.map((field) => {
              const isCurrentQuestion = field.name === question.name;
              return (
                <button
                  key={field.name}
                  type="button"
                  className={`btn btn-sm ${
                    isCurrentQuestion
                      ? "btn-warning" // Different color for current question
                      : isSelectField(field.type)
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => insertFieldReference(field.name)}
                  title={`Insert reference to ${field.label || field.name} (${
                    isSelectField(field.type)
                      ? "select field with options"
                      : field.type
                  })${isCurrentQuestion ? " - Current Question" : ""}`}
                >
                  {field.label || field.name}{" "}
                  {isSelectField(field.type) ? "📋" : ""}
                  {isCurrentQuestion ? " [Current]" : ""}
                </button>
              );
            })}
          </div>
          <small className="text-muted">
            Click to insert field references into your calculation. 📋 = Fields
            with selectable options. Orange = Current question, Blue = Previous
            questions.
          </small>
        </div>
      )}

      {/* Calculation Examples */}
      <div className="mt-3">
        <label className="form-label">Common Examples:</label>
        <div className="list-group">
          <button
            type="button"
            className="list-group-item list-group-item-action"
            onClick={() => {
              handleQuestionChange(
                index,
                "calculation",
                "if(${Q1} = '1', '1', '2')"
              );
              handleQuestionChange(index, "trigger", "${Q1}");
            }}
          >
            <strong>Option Check:</strong> if(${"${Q1}"} = '1', '1', '2')
          </button>
          <button
            type="button"
            className="list-group-item list-group-item-action"
            onClick={() => {
              handleQuestionChange(
                index,
                "calculation",
                'if(${age} >= 18, "Adult", "Minor")'
              );
              handleQuestionChange(index, "trigger", "${age}");
            }}
          >
            <strong>Conditional:</strong> if(${"${age}"} &gt;= 18, "Adult",
            "Minor")
          </button>
          <button
            type="button"
            className="list-group-item list-group-item-action"
            onClick={() => {
              handleQuestionChange(
                index,
                "calculation",
                "${field1} + ${field2}"
              );
              handleQuestionChange(index, "trigger", "${field1} ${field2}");
            }}
          >
            <strong>Addition:</strong> ${"${field1}"} + ${"${field2}"}
          </button>
          <button
            type="button"
            className="list-group-item list-group-item-action"
            onClick={() => {
              handleQuestionChange(
                index,
                "calculation",
                'concat(${first_name}, " ", ${last_name})'
              );
              handleQuestionChange(
                index,
                "trigger",
                "${first_name} ${last_name}"
              );
            }}
          >
            <strong>Concatenation:</strong> concat(${"${first_name}"}, " ", $
            {"${last_name}"})
          </button>
          <button
            type="button"
            className="list-group-item list-group-item-action"
            onClick={() => {
              handleQuestionChange(index, "calculation", "today()");
              handleQuestionChange(index, "trigger", "");
            }}
          >
            <strong>Today's Date:</strong> today()
          </button>
        </div>
      </div>
    </div>
  );
};

const Question = ({
  question,
  index,
  moveQuestion,
  handleQuestionChange,
  handleDeleteQuestion,
  toggleSettings,
  openSettings,
  handleAddOption,
  handleOptionChange,
  handleAddSubQuestion,
  handleSubQuestionChange,
  handleDeleteSubQuestion,
  handleShowModal,
  errors,
  allQuestions = [],
  isEditing,
  projectId,
  formId,
  handleDeleteOption,
  handleAddQuestionToGroup,
  // NEW props for collapse/expand and duplicate
  handleDuplicateQuestion,
  isCollapsed = false,
  onToggleCollapse,
  isSelected = false,
  onToggleSelect,
}) => {
  const ref = React.useRef(null);
  const dragHandle = React.useRef(null);
  const [conditions, setConditions] = useState(
    question.conditions || [{ question: "", condition: "", value: "" }]
  );
  const [conditionLogic, setConditionLogic] = useState(
    question.conditionLogic || "and"
  );

  // State for option filtering
  const [editingFilter, setEditingFilter] = useState(null);
  const [sortOrder, setSortOrder] = useState(
    question.optionSortOrder || "none"
  );
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [pendingFilterValue, setPendingFilterValue] = useState("");

  useEffect(() => {
    setIsAddingFilter(false);
    setPendingFilterValue("");
  }, [question.filterQuestionId, question.filterOptionValues]);

  const canBeSelected = typeof onToggleSelect === "function";
  const isMarkedSelected = canBeSelected && !!isSelected;

  const handleAddFilterValue = (
    filterValue,
    currentFilterOptions = [],
    currentFilterMap = {}
  ) => {
    if (!filterValue) {
      return;
    }

    if (currentFilterOptions.includes(filterValue)) {
      setEditingFilter(filterValue);
      setIsAddingFilter(false);
      setPendingFilterValue("");
      return;
    }

    const updatedFilters = [...currentFilterOptions, filterValue];
    const updatedMap = {
      ...(currentFilterMap || {}),
      [filterValue]: (currentFilterMap || {})[filterValue] || [],
    };

    handleQuestionChange(index, "filterOptionValues", updatedFilters);
    handleQuestionChange(index, "optionFilterMap", updatedMap);
    setEditingFilter(filterValue);
    setIsAddingFilter(false);
    setPendingFilterValue("");
  };

  const handleConditionChange = (conditionIndex, field, value) => {
    const newConditions = [...conditions];
    newConditions[conditionIndex][field] = value;
    setConditions(newConditions);
    handleQuestionChange(index, "conditions", newConditions);
  };

  const addCondition = () => {
    const newConditions = [
      ...conditions,
      { question: "", condition: "", value: "" },
    ];
    setConditions(newConditions);
    handleQuestionChange(index, "conditions", newConditions);
  };

  const deleteCondition = (conditionIndex) => {
    const newConditions = conditions.filter((_, i) => i !== conditionIndex);
    setConditions(newConditions);
    handleQuestionChange(index, "conditions", newConditions);
  };

  const generateRelevantString = () => {
    return conditions
      .map((condition) => {
        const question = condition.question;
        let conditionType = condition.condition;
        let value = condition.value;

        if (conditionType === "was_answered") {
          conditionType = "!=";
          value = "";
        } else if (conditionType === "was_not_answered") {
          conditionType = "=";
          value = "";
        }

        return `\${${question}} ${conditionType} '${value}'`.trim();
      })
      .join(` ${conditionLogic} `);
  };

  const saveConditionSkipLogic = () => {
    const relevantString = generateRelevantString();
    handleQuestionChange(index, "relevant", relevantString);
  };

  const saveManualSkipLogic = (manualSkipLogic) => {
    handleQuestionChange(index, "relevant", manualSkipLogic);
  };

  const displayType = question.type.startsWith("select_one")
    ? "select_one"
    : question.type.startsWith("select_multiple")
    ? "select_multiple"
    : question.type;

  const questionsToDisplay = allQuestions;

  useEffect(() => {
    setConditions(
      question.conditions || [{ question: "", condition: "", value: "" }]
    );
    setConditionLogic(question.conditionLogic || "and");
  }, [question]);

  // Handle group/repeat container rendering
  if (question.type === "begin_group" || question.type === "begin_repeat") {
    const isRepeat = question.type === "begin_repeat";
    const beginLabel = isRepeat ? "Begin Repeat" : "Begin Group";
    const placeholderPrefix = isRepeat ? "Repeat" : "Group";
    const nameLabel = isRepeat ? "Repeat name:" : "Group name:";
    const addQuestionLabel = isRepeat
      ? "Add Question to Repeat"
      : "Add Question to Group";

    return (
      <div className="p-2 mb-2 border-2 border-blue-300 rounded bg-blue-100/50">
        <div
          style={{
            cursor: "grab",
            backgroundColor: "#bfdbfe",
            padding: "5px",
            borderRadius: "4px",
          }}
        >
          <i className="fas fa-grip-vertical"></i> Drag to reorder
        </div>

        <div className="flex flex-col w-full md:flex-row">
          <div className="flex w-[100%] p-2 md:p-2 md:w-[95%] gap-1">
            <div className="p-2 border rounded-lg mb-2 w-[20%] flex justify-center items-center gap-1 bg-blue-200">
              <span className="m-0 font-semibold text-blue-800 text-md">
                {beginLabel}
              </span>
            </div>
            <textarea
              type="text"
              className="form-control mb-2 w-[80%]"
              value={question.label}
              onChange={(e) =>
                handleQuestionChange(index, "label", e.target.value)
              }
              placeholder={`${placeholderPrefix} Label ${index + 1}`}
              rows={1}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end w-full gap-2 p-2 md:w-auto">
            {canBeSelected && (
              <SelectionToggle
                isSelected={isMarkedSelected}
                onToggleSelect={onToggleSelect}
              />
            )}
            <CreateFormSettingBtn
              index={index}
              toggleSettings={toggleSettings}
              handleDeleteQuestion={handleDeleteQuestion}
            />
          </div>
        </div>

        {errors[index] && <p className="text-danger">{errors[index]}</p>}

        {openSettings[index] && (
          <div className="p-3 mt-3 rounded bg-blue-50">
            <div className="mb-3">
              <label className="form-label">{nameLabel}</label>
              <input
                type="text"
                className="form-control"
                value={question.name}
                onChange={(e) =>
                  handleQuestionChange(index, "name", e.target.value)
                }
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Guidance hint:</label>
              <input
                type="text"
                className="form-control"
                value={question.guidance_hint}
                onChange={(e) =>
                  handleQuestionChange(index, "guidance_hint", e.target.value)
                }
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Appearance:</label>
              <select
                className="form-control"
                value={question.appearance}
                onChange={(e) =>
                  handleQuestionChange(index, "appearance", e.target.value)
                }
              >
                <option value="">Default</option>
                <option value="field-list">
                  Show all questions on one screen
                </option>
                <option value="table-list">Show as table</option>
              </select>
            </div>
            {isRepeat && (
              <div className="mb-3">
                <label className="form-label">Repeat count (optional):</label>
                <input
                  type="text"
                  className="form-control"
                  value={question.repeat_count || ""}
                  onChange={(e) =>
                    handleQuestionChange(index, "repeat_count", e.target.value)
                  }
                  placeholder="${number_of_household_members}"
                />
                <small className="text-muted">
                  Leave empty for manual add-repeat in data collection. Use an
                  expression like <code>${"{count_field}"}</code> to auto-repeat.
                </small>
              </div>
            )}
          </div>
        )}

        {handleAddQuestionToGroup && (
          <div className="p-2 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleAddQuestionToGroup(index)}
            >
              <MdFormatListBulletedAdd className="me-2" />
              {addQuestionLabel}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (question.type === "end_group" || question.type === "end_repeat") {
    const endLabel = question.type === "end_repeat" ? "End Repeat" : "End Group";
    return (
      <div className="p-1 mb-2 border-2 border-blue-200 rounded bg-blue-50/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-2 text-sm font-medium text-blue-600">
            {endLabel}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {canBeSelected && (
              <SelectionToggle
                isSelected={isMarkedSelected}
                onToggleSelect={onToggleSelect}
              />
            )}
            <CreateFormSettingBtn
              index={index}
              toggleSettings={toggleSettings}
              handleDeleteQuestion={handleDeleteQuestion}
            />
          </div>
        </div>
      </div>
    );
  }

  const questionCardClassName = `p-2 mb-2 border-2 rounded ${
    isMarkedSelected
      ? "border-blue-500 bg-blue-50 shadow-sm"
      : "border-gray-200 bg-gray-200/30"
  }`;

  return (
    <div className={questionCardClassName}>
      <HeaderBar
        title={
          displayType
            ? `${displayType} — ${question.label || `Question ${index + 1}`}`
            : `Select Type — Question ${index + 1}`
        }
        index={index}
        onToggleCollapse={onToggleCollapse}
        isCollapsed={isCollapsed}
        leftExtra={
          <div
            style={{
              cursor: "grab",
              backgroundColor: "#d1ecf1",
              padding: "5px 8px",
              borderRadius: "4px",
              marginRight: 8,
              fontSize: 12,
            }}
            title="Drag to reorder"
          >
            ⋮⋮ Drag
          </div>
        }
        rightControls={
          canBeSelected ? (
            <div className="flex items-center gap-2">
              <SelectionToggle
                isSelected={isMarkedSelected}
                onToggleSelect={onToggleSelect}
              />
              <CreateFormSettingBtn
                index={index}
                toggleSettings={toggleSettings}
                handleDeleteQuestion={handleDeleteQuestion}
                handleDuplicateQuestion={handleDuplicateQuestion}
                onToggleCollapse={onToggleCollapse}
                isCollapsed={isCollapsed}
              />
            </div>
          ) : (
            <CreateFormSettingBtn
              index={index}
              toggleSettings={toggleSettings}
              handleDeleteQuestion={handleDeleteQuestion}
              handleDuplicateQuestion={handleDuplicateQuestion}
              onToggleCollapse={onToggleCollapse}
              isCollapsed={isCollapsed}
            />
          )
        }
      />

      {!isCollapsed && (
        <>
          <div className="flex flex-col w-full md:flex-row">
            <div className="flex w-[100%] p-2 md:p-2 md:w-[95%] gap-1">
              <button
                type="button"
                className="p-2 border rounded-lg mb-2 w-[20%] flex justify-center items-center gap-1"
                value={displayType}
                placeholder={`Type ${index + 1}`}
                onClick={() => handleShowModal(index)}
              >
                <MdFormatListBulletedAdd />
                <span className="m-0 text-md">
                  {displayType ? displayType : "Select Types"}
                </span>
              </button>
              <textarea
                type="text"
                className="form-control mb-2 w-[80%]"
                value={question.label}
                onChange={(e) =>
                  handleQuestionChange(index, "label", e.target.value)
                }
                placeholder={`Type the label for Question ${index + 1}`}
                disabled={!displayType}
                rows={1}
              />
            </div>
          </div>

          {errors[index] && <p className="text-danger">{errors[index]}</p>}

          <div className="flex gap-4 mb-2">
            <div className="form-check">
              <input
                type="checkbox"
                id={`mycheckbox1-${index}`}
                className="form-check-input"
                checked={question.required}
                onChange={() =>
                  handleQuestionChange(index, "required", !question.required)
                }
              />
              <label
                className="form-check-label"
                htmlFor={`mycheckbox1-${index}`}
              >
                Required
              </label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id={`makeMandatory-${index}`}
                className="form-check-input"
                checked={!!question.make_mandatory}
                onChange={() =>
                  handleQuestionChange(
                    index,
                    "make_mandatory",
                    !question.make_mandatory
                  )
                }
              />
              <label
                className="form-check-label"
                htmlFor={`makeMandatory-${index}`}
              >
                Make mandatory
              </label>
            </div>
          </div>

          {(question.type.startsWith("select_one") ||
            question.type.startsWith("select_multiple")) && (
            <div className="p-2 mb-3 bg-[#1f93f2]/10 rounded-lg">
              <label className="form-label">Options:</label>
              {question.options.map((option, optionIndex) => (
                <div
                  key={option._uuid || optionIndex}
                  className="flex items-center w-full gap-2"
                >
                  <div className="w-[70%]">
                    <Option
                      option={option}
                      index={optionIndex}
                      allOptions={question.options}
                      onChange={(field, value) =>
                        handleOptionChange(index, optionIndex, field, value)
                      }
                    />
                  </div>

                  {question.options.length > 1 && (
                    <button
                      type="button"
                      className="px-2 py-1 text-white bg-red-500 rounded"
                      onClick={() => handleDeleteOption(index, optionIndex)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAddOption(index)}
                >
                  Add Option
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="w-auto form-control"
                  style={{ maxWidth: 200 }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const data = await file.arrayBuffer();
                    const XLSX = await import("xlsx");
                    const workbook = XLSX.read(data);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, {
                      header: 1,
                    });
                    console.log("XLSX all rows:", rows);
                    const options = rows
                      .map((row) => row[0])
                      .filter((v) => v !== undefined && v !== null && v !== "");
                    console.log("XLSX parsed options:", options);
                    if (
                      options.length &&
                      typeof options[0] === "string" &&
                      options[0].toLowerCase().includes("option")
                    ) {
                      options.shift();
                    }

                    // Apply duplicate handling logic like the Option component
                    const newOptions = [];
                    const usedNames = new Set();

                    options.forEach((label, i) => {
                      let baseName = label
                        .toLowerCase()
                        .replace(/[^a-z0-9-._:]/g, "_");
                      if (!/^[a-z:_]/.test(baseName)) {
                        baseName = `_${baseName}`;
                      }

                      // Ensure uniqueness with suffix numbering
                      let name = baseName;
                      let suffix = 2;
                      while (usedNames.has(name)) {
                        name = `${baseName}_${suffix}`;
                        suffix += 1;
                      }

                      usedNames.add(name);

                      newOptions.push({
                        label,
                        name,
                        value: label,
                        _uuid: `${Date.now()}_${i}_${Math.random()
                          .toString(36)
                          .substr(2, 6)}`,
                      });
                    });

                    console.log("Setting new options:", newOptions);
                    handleQuestionChange(index, "options", newOptions);
                    e.target.value = "";
                  }}
                />
                <span className="self-center text-xs text-gray-500">
                  Upload XLSX: first column values will be used as options.
                </span>
              </div>

              {/* Add Filter Checkbox */}
              <div className="mt-2 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`add-filter-${index}`}
                  checked={!!question.filterEnabled}
                  onChange={() => {
                    const newFilterEnabled = !question.filterEnabled;
                    // When enabling filter for the first time, save the original options order
                    if (newFilterEnabled && !question._originalOptions) {
                      handleQuestionChange(
                        index,
                        "_originalOptions",
                        JSON.parse(JSON.stringify(question.options))
                      );
                    }
                    handleQuestionChange(
                      index,
                      "filterEnabled",
                      newFilterEnabled
                    );
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor={`add-filter-${index}`}
                >
                  Add Filter
                </label>
              </div>
            </div>
          )}

          {question.type === "rating" && (
            <div className="p-2 mb-3 bg-[#1f93f2]/10 rounded-lg">
              <label className="form-label">Options:</label>
              {question.options.map((option, optionIndex) => (
                <Option
                  key={option._uuid || optionIndex}
                  option={option}
                  index={optionIndex}
                  allOptions={question.options}
                  onChange={(field, value) =>
                    handleOptionChange(index, optionIndex, field, value)
                  }
                />
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddOption(index)}
              >
                Add Options
              </button>

              <div className="bg-[#1f93f2]/40 p-2 mt-1 rounded-lg">
                <label className="form-label">Sub-Questions:</label>
                {question.subQuestions.map((subQuestion, subIndex) => (
                  <SubQuestion
                    key={subIndex}
                    subQuestion={subQuestion}
                    onChange={(subIndex, field, value) =>
                      handleSubQuestionChange(index, subIndex, field, value)
                    }
                    onDelete={(subIndex) =>
                      handleDeleteSubQuestion(index, subIndex)
                    }
                    error={errors[`${index}-${subIndex}`]}
                  />
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleAddSubQuestion(index)}
                >
                  Add Sub-Question
                </button>
              </div>
            </div>
          )}

          {console.log(`Question ${index} openSettings:`, openSettings[index])}
          {console.log(`Question ${index} conditions:`, conditions)}

          {openSettings[index] && (
            <div
              className="p-3 mt-3 transition-all duration-300 ease-in-out border rounded bg-light"
              style={{ minHeight: "200px" }}
            >
              <Tabs
                defaultActiveKey="questionOptions"
                id={`question-tabs-${index}`}
                className="mb-3"
              >
                <Tab eventKey="questionOptions" title="Question Options">
                  <div className="mt-3">
                    <div className="mb-3">
                      <label className="form-label">Data column name:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={question.name}
                        onChange={(e) =>
                          handleQuestionChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Guidance hint:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={question.guidance_hint}
                        onChange={(e) =>
                          handleQuestionChange(
                            index,
                            "guidance_hint",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Default response:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={question.default}
                        onChange={(e) =>
                          handleQuestionChange(index, "default", e.target.value)
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Appearance (advanced):
                      </label>
                      {question.type === "text" ? (
                        <Form.Select
                          value={question.appearance}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "appearance",
                              e.target.value
                            )
                          }
                        >
                          <option value="select">Select</option>
                          <option value="multiline">Multiline</option>
                          <option value="numbers">Numbers</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      ) : question.type.startsWith("select_one") ? (
                        <Form.Select
                          value={question.appearance}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "appearance",
                              e.target.value
                            )
                          }
                        >
                          <option value="select">Select</option>
                          <option value="minimal">Minimal</option>
                          <option value="autocomplete">Autocomplete</option>
                          <option value="quick">Quick</option>
                          <option value="horizontal-compact">
                            Horizontal-compact
                          </option>
                          <option value="horizontal">Horizontal</option>
                          <option value="likert">Likert</option>
                          <option value="compact">Compact</option>
                          <option value="quickcompact">Quickcompact</option>
                          <option value="label">Label</option>
                          <option value="list-nolabel">List-nolabel</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      ) : question.type.startsWith("select_multiple") ? (
                        <Form.Select
                          value={question.appearance}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "appearance",
                              e.target.value
                            )
                          }
                        >
                          <option value="select">Select</option>
                          <option value="minimal">Minimal</option>
                          <option value="horizontal-compact">
                            Horizontal-compact
                          </option>
                          <option value="horizontal">Horizontal</option>
                          <option value="compact">Compact</option>
                          <option value="label">Label</option>
                          <option value="list-nolabel">List-nolabel</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      ) : question.type === "date" ? (
                        <Form.Select
                          value={question.appearance}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "appearance",
                              e.target.value
                            )
                          }
                        >
                          <option value="select">Select</option>
                          <option value="month-year">Month-Year</option>
                          <option value="year">Year</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      ) : question.type === "image" ? (
                        <Form.Select
                          value={question.appearance}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "appearance",
                              e.target.value
                            )
                          }
                        >
                          <option value="select">Select</option>
                          <option value="signature">Signature</option>
                          <option value="draw">Draw</option>
                          <option value="annotate">Annotate</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      ) : question.type === "file" ? (
                        <>
                          <input
                            type="text"
                            className="mb-2 form-control"
                            value={question.appearance}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "appearance",
                                e.target.value
                              )
                            }
                            placeholder="Enter appearance"
                          />
                          <div className="mb-3">
                            <label className="form-label">
                              Accepted files:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.accepted_files || ""}
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "accepted_files",
                                  e.target.value
                                )
                              }
                              placeholder='e.g. ".pdf,.doc,.odt"'
                            />
                          </div>
                        </>
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          value={question.appearance}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "appearance",
                              e.target.value
                            )
                          }
                          placeholder="Enter appearance"
                        />
                      )}
                    </div>
                    {question.type === "image" && (
                      <div className="mb-3">
                        <label className="form-label">
                          Parameters: max-pixels
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={question.parameters?.split("=")[1] || "1024"}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "parameters",
                              `max-pixels=${e.target.value}`
                            )
                          }
                          placeholder="max-pixels"
                          min="1"
                        />
                      </div>
                    )}
                    {(question.type.startsWith("select_one") ||
                      question.type.startsWith("select_multiple")) && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Parameters:</label>
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={
                                question.parameters?.includes(
                                  "randomize=true"
                                ) || false
                              }
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "parameters",
                                  `randomize=${e.target.checked};seed=${
                                    question.parameters
                                      ?.split(";")[1]
                                      ?.split("=")[1] || ""
                                  }`
                                )
                              }
                            />
                            <label className="form-check-label">
                              Randomize
                            </label>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Seed:</label>
                          <input
                            type="number"
                            className="form-control"
                            value={
                              question.parameters
                                ?.split(";")[1]
                                ?.split("=")[1] || ""
                            }
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "parameters",
                                `randomize=${question.parameters?.includes(
                                  "randomize=true"
                                )};seed=${e.target.value}`
                              )
                            }
                          />
                        </div>
                      </>
                    )}
                    {question.type === "rating" && (
                      <div className="mb-3">
                        <label className="form-label">
                          cmp--rank-constraint-message:
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={
                            question.constraint_message ||
                            "Items cannot be selected more than once"
                          }
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "constraint_message",
                              e.target.value
                            )
                          }
                          placeholder="Items cannot be selected more than once"
                        />
                      </div>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="skipLogic" title="Skip Logic">
                  {question.relevant && (
                    <div className="mt-2 alert alert-success">
                      <small>
                        <strong>Skip Logic Active:</strong> {question.relevant}
                      </small>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="mb-3 alert alert-info">
                      <small>
                        <strong>Skip Logic Configuration</strong>
                        <br />
                        Use the tabs below to set up when this question should
                        be shown or hidden based on previous answers.
                      </small>
                    </div>
                    <Tabs
                      defaultActiveKey="addCondition"
                      id={`skip-logic-tabs-${index}`}
                      className="mb-3"
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #dee2e6",
                        borderRadius: "0.375rem",
                        padding: "1rem",
                      }}
                    >
                      <Tab eventKey="addCondition" title="Add a Condition">
                        <div className="p-3 mt-3">
                          <div className="mb-3">
                            <h6 className="text-primary">
                              Condition-based Skip Logic
                            </h6>
                            <p className="text-muted small">
                              This question will only be shown if the selected
                              conditions are met.
                            </p>
                            {questionsToDisplay.slice(0, index).length ===
                              0 && (
                              <div className="alert alert-info">
                                <small>
                                  <strong>Note:</strong> No previous questions
                                  available for skip logic. Add questions before
                                  this one to create skip logic conditions.
                                </small>
                              </div>
                            )}
                          </div>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Question</th>
                                <th>Condition</th>
                                <th>Value</th>
                                <th>Action</th> {/* Add Action column */}
                              </tr>
                            </thead>
                            <tbody>
                              {conditions.map((condition, conditionIndex) => (
                                <tr key={conditionIndex}>
                                  <td>
                                    <Form.Select
                                      value={condition.question}
                                      onChange={(e) =>
                                        handleConditionChange(
                                          conditionIndex,
                                          "question",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="">
                                        Select a question
                                      </option>
                                      {questionsToDisplay
                                        .slice(0, index)
                                        .map((q, qIndex) => (
                                          <option key={qIndex} value={q.name}>
                                            {q.label}
                                          </option>
                                        ))}
                                    </Form.Select>
                                  </td>
                                  <td>
                                    {condition.question &&
                                      (["text"].includes(
                                        questionsToDisplay.find(
                                          (q) => q.name === condition.question
                                        )?.type
                                      ) ||
                                        questionsToDisplay
                                          .find(
                                            (q) => q.name === condition.question
                                          )
                                          ?.type.startsWith("select_one") ||
                                        questionsToDisplay
                                          .find(
                                            (q) => q.name === condition.question
                                          )
                                          ?.type.startsWith(
                                            "select_multiple"
                                          )) && (
                                        <Form.Select
                                          value={condition.condition}
                                          onChange={(e) =>
                                            handleConditionChange(
                                              conditionIndex,
                                              "condition",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">
                                            Select a condition
                                          </option>
                                          <option value="was_answered">
                                            Was Answered
                                          </option>
                                          <option value="was_not_answered">
                                            Was not Answered
                                          </option>
                                          <option value="=">=</option>
                                          <option value="!=">!=</option>
                                        </Form.Select>
                                      )}
                                    {condition.question &&
                                      ["integer", "decimal"].includes(
                                        questionsToDisplay.find(
                                          (q) => q.name === condition.question
                                        )?.type
                                      ) && (
                                        <Form.Select
                                          value={condition.condition}
                                          onChange={(e) =>
                                            handleConditionChange(
                                              conditionIndex,
                                              "condition",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">
                                            Select a condition
                                          </option>
                                          <option value="was_answered">
                                            Was Answered
                                          </option>
                                          <option value="was_not_answered">
                                            Was not Answered
                                          </option>
                                          <option value="=">{"(=)"}</option>
                                          <option value="!=">{"(!=)"}</option>
                                          <option value=">">
                                            Greater Than {"(>)"}
                                          </option>
                                          <option value="<">
                                            Less Than {"(<)"}
                                          </option>
                                          <option value=">=">
                                            Greater Than or Equal to {"(>=)"}
                                          </option>
                                          <option value="<=">
                                            Less Than or Equal to {"(<=)"}
                                          </option>
                                        </Form.Select>
                                      )}
                                    {condition.question &&
                                      [
                                        "date",
                                        "time",
                                        "datetime",
                                        "geopoint",
                                        "geotrace",
                                        "geoshape",
                                        "image",
                                        "audio",
                                        "video",
                                        "note",
                                        "barcode",
                                        "acknowledge",
                                        "rating",
                                        "range",
                                        "file",
                                      ].includes(
                                        questionsToDisplay.find(
                                          (q) => q.name === condition.question
                                        )?.type
                                      ) && (
                                        <Form.Select
                                          value={condition.condition}
                                          onChange={(e) =>
                                            handleConditionChange(
                                              conditionIndex,
                                              "condition",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">
                                            Select a condition
                                          </option>
                                          <option value="was_answered">
                                            Was Answered
                                          </option>
                                          <option value="was_not_answered">
                                            Was not Answered
                                          </option>
                                        </Form.Select>
                                      )}
                                  </td>
                                  <td>
                                    {["=", "!=", ">", "<", ">=", "<="].includes(
                                      condition.condition
                                    ) ? (
                                      questionsToDisplay
                                        .find(
                                          (q) => q.name === condition.question
                                        )
                                        ?.type.startsWith("select_one") ||
                                      questionsToDisplay
                                        .find(
                                          (q) => q.name === condition.question
                                        )
                                        ?.type.startsWith("select_multiple") ? (
                                        <Form.Select
                                          value={condition.value}
                                          onChange={(e) =>
                                            handleConditionChange(
                                              conditionIndex,
                                              "value",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">
                                            Select a value
                                          </option>
                                          {questionsToDisplay
                                            .find(
                                              (q) =>
                                                q.name === condition.question
                                            )
                                            ?.options.map(
                                              (option, optionIndex) => (
                                                <option
                                                  key={optionIndex}
                                                  value={option.name}
                                                >
                                                  {option.label}
                                                </option>
                                              )
                                            )}
                                        </Form.Select>
                                      ) : (
                                        <Form.Control
                                          type="text"
                                          value={condition.value}
                                          onChange={(e) =>
                                            handleConditionChange(
                                              conditionIndex,
                                              "value",
                                              e.target.value
                                            )
                                          }
                                        />
                                      )
                                    ) : null}
                                  </td>
                                  <td>
                                    <Button
                                      variant="danger"
                                      onClick={() =>
                                        deleteCondition(conditionIndex)
                                      }
                                    >
                                      <FaTrash />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                          <Form.Select
                            value={conditionLogic}
                            onChange={(e) => {
                              setConditionLogic(e.target.value);
                              handleQuestionChange(
                                index,
                                "conditionLogic",
                                e.target.value
                              );
                            }}
                          >
                            <option value="and">
                              Previous responses should match all of these
                              conditions.
                            </option>
                            <option value="or">
                              Previous responses should match any of these
                              conditions.
                            </option>
                          </Form.Select>
                          <div className="gap-2 mt-3 d-flex">
                            <Button variant="secondary" onClick={addCondition}>
                              Add Condition
                            </Button>
                            <Button
                              variant="primary"
                              onClick={saveConditionSkipLogic}
                            >
                              Save Condition Skip Logic
                            </Button>
                          </div>
                        </div>
                      </Tab>
                      <Tab eventKey="manualSkipLogic" title="Manual Skip Logic">
                        <div className="p-3 mt-3">
                          <div className="mb-3">
                            <h6 className="text-primary">Manual Skip Logic</h6>
                            <p className="text-muted small">
                              Enter XLSForm skip logic expressions manually. Use
                              ${`{field_name}`} syntax to reference other
                              fields.
                            </p>
                          </div>
                          <Form>
                            <Form.Group controlId="manualSkipLogic">
                              <Form.Label>Enter Skip Logic:</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={question.relevant || ""}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    index,
                                    "relevant",
                                    e.target.value
                                  )
                                }
                              />
                            </Form.Group>
                            <div className="mt-3">
                              <Button
                                variant="primary"
                                onClick={() =>
                                  saveManualSkipLogic(question.relevant)
                                }
                              >
                                Save Manual Skip Logic
                              </Button>
                            </div>
                          </Form>
                        </div>
                      </Tab>
                    </Tabs>
                  </div>
                </Tab>
                {/* Option Filter Tab - only show for select_one/select_multiple with filterEnabled */}
                {question.type &&
                  (question.type.startsWith("select_one") ||
                    question.type.startsWith("select_multiple")) &&
                  question.filterEnabled && (
                    <Tab eventKey="optionFilter" title="Option Filter">
                      <div className="mt-3">
                        <div className="p-3 border rounded bg-light">
                          <h6 className="mb-3">
                            Filter by Another Question's Options
                          </h6>

                          {/* Select dropdown for other select_one questions with filterEnabled */}
                          <div className="mb-3">
                            <label className="form-label">
                              Select a question to filter by:
                            </label>
                            <select
                              className="form-select"
                              value={question.filterQuestionId || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                handleQuestionChange(
                                  index,
                                  "filterQuestionId",
                                  selectedId
                                );
                                // Reset mapping when changing filter question
                                handleQuestionChange(
                                  index,
                                  "optionFilterMap",
                                  {}
                                );
                              }}
                            >
                              <option value="">Select a question...</option>
                              {allQuestions
                                .slice(0, index) // Only previous questions
                                .filter(
                                  (q) =>
                                    (q.type?.startsWith("select_one") ||
                                      q.type?.startsWith("select_multiple")) &&
                                    q.filterEnabled &&
                                    (q._uuid ||
                                      q.idx?.toString() ||
                                      allQuestions.indexOf(q).toString()) !==
                                      (question._uuid ||
                                        question.idx?.toString() ||
                                        index.toString())
                                )
                                .map((q) => {
                                  const qId =
                                    q._uuid ||
                                    q.idx?.toString() ||
                                    allQuestions.indexOf(q).toString();
                                  return (
                                    <option key={qId} value={qId}>
                                      {q.label}
                                    </option>
                                  );
                                })}
                            </select>
                          </div>

                          {/* Show mapping interface if a filter question is selected */}
                          {(() => {
                            if (!question.filterQuestionId) return null;

                            const selectedQ = allQuestions.find((q) => {
                              const qId =
                                q._uuid ||
                                q.idx?.toString() ||
                                allQuestions.indexOf(q).toString();
                              return qId === question.filterQuestionId;
                            });

                            const selfOptions = question.options || [];
                            const filterOptionValues =
                              question.filterOptionValues || [];
                            const optionFilterMap =
                              question.optionFilterMap || {};
                            const remainingFilterChoices =
                              selectedQ.options.filter(
                                (opt) =>
                                  !filterOptionValues.includes(opt.name)
                              );

                            const updateOptionFilterMap = (
                              filterValue,
                              selectedOptions
                            ) => {
                              const newMap = { ...optionFilterMap };
                              if (selectedOptions.length === 0) {
                                delete newMap[filterValue];
                              } else {
                                newMap[filterValue] = selectedOptions;
                              }
                              handleQuestionChange(
                                index,
                                "optionFilterMap",
                                newMap
                              );
                            };

                            const addOptionToFilter = (
                              filterValue,
                              optionName
                            ) => {
                              const currentOptions =
                                optionFilterMap[filterValue] || [];
                              if (!currentOptions.includes(optionName)) {
                                updateOptionFilterMap(filterValue, [
                                  ...currentOptions,
                                  optionName,
                                ]);
                              }
                            };

                            const removeOptionFromFilter = (
                              filterValue,
                              optionName
                            ) => {
                              const currentOptions =
                                optionFilterMap[filterValue] || [];
                              updateOptionFilterMap(
                                filterValue,
                                currentOptions.filter((o) => o !== optionName)
                              );
                            };

                            const sortOptions = (options, order) => {
                              const sorted = [...options];
                              switch (order) {
                                case "asc":
                                  return sorted.sort((a, b) => {
                                    const aLabel =
                                      selfOptions.find((o) => o.name === a)
                                        ?.label || a;
                                    const bLabel =
                                      selfOptions.find((o) => o.name === b)
                                        ?.label || b;
                                    return aLabel.localeCompare(bLabel);
                                  });
                                case "desc":
                                  return sorted.sort((a, b) => {
                                    const aLabel =
                                      selfOptions.find((o) => o.name === a)
                                        ?.label || a;
                                    const bLabel =
                                      selfOptions.find((o) => o.name === b)
                                        ?.label || b;
                                    return bLabel.localeCompare(aLabel);
                                  });
                                case "none":
                                default:
                                  return options;
                              }
                            };

                            const applySortToAllFilters = (order) => {
                              // Sort the filter mappings
                              const newMap = {};
                              Object.keys(optionFilterMap).forEach(
                                (filterValue) => {
                                  newMap[filterValue] = sortOptions(
                                    optionFilterMap[filterValue],
                                    order
                                  );
                                }
                              );
                              handleQuestionChange(
                                index,
                                "optionFilterMap",
                                newMap
                              );

                              // Also sort the main options array
                              let sortedMainOptions;
                              switch (order) {
                                case "asc":
                                  sortedMainOptions = [...selfOptions];
                                  sortedMainOptions.sort((a, b) =>
                                    (a.label || "").localeCompare(b.label || "")
                                  );
                                  handleQuestionChange(
                                    index,
                                    "options",
                                    sortedMainOptions
                                  );
                                  break;
                                case "desc":
                                  sortedMainOptions = [...selfOptions];
                                  sortedMainOptions.sort((a, b) =>
                                    (b.label || "").localeCompare(a.label || "")
                                  );
                                  handleQuestionChange(
                                    index,
                                    "options",
                                    sortedMainOptions
                                  );
                                  break;
                                case "none":
                                default:
                                  // Restore original order if available
                                  if (question._originalOptions) {
                                    handleQuestionChange(
                                      index,
                                      "options",
                                      JSON.parse(
                                        JSON.stringify(
                                          question._originalOptions
                                        )
                                      )
                                    );
                                  }
                                  break;
                              }

                              handleQuestionChange(
                                index,
                                "optionSortOrder",
                                order
                              );
                              setSortOrder(order);
                            };

                            if (
                              selectedQ &&
                              selectedQ.options &&
                              selectedQ.options.length > 0
                            ) {
                              return (
                                <>
                                  <div className="mb-3">
                                    <label className="form-label">
                                      Select which options from "
                                      {selectedQ.label}" to use as filters:
                                    </label>
                                    <select
                                      className="form-select"
                                      multiple
                                      size="6"
                                      value={filterOptionValues}
                                      onChange={(e) => {
                                        const selected = Array.from(
                                          e.target.selectedOptions
                                        ).map((opt) => opt.value);
                                        const hasSameSelection =
                                          selected.length ===
                                            filterOptionValues.length &&
                                          selected.every((val) =>
                                            filterOptionValues.includes(val)
                                          ) &&
                                          filterOptionValues.every((val) =>
                                            selected.includes(val)
                                          );
                                        if (hasSameSelection) {
                                          return;
                                        }
                                        handleQuestionChange(
                                          index,
                                          "filterOptionValues",
                                          selected
                                        );
                                        const currentMap =
                                          optionFilterMap || {};
                                        const updatedMap = {};
                                        selected.forEach((value) => {
                                          if (currentMap[value]) {
                                            updatedMap[value] =
                                              currentMap[value];
                                          } else {
                                            updatedMap[value] = [];
                                          }
                                        });
                                        if (
                                          editingFilter &&
                                          !selected.includes(editingFilter)
                                        ) {
                                          setEditingFilter(null);
                                        }
                                        handleQuestionChange(
                                          index,
                                          "optionFilterMap",
                                          updatedMap
                                        );
                                      }}
                                      style={{
                                        minHeight: "200px",
                                        maxHeight: "300px",
                                      }}
                                    >
                                      {selectedQ.options.map((opt, i) => (
                                        <option
                                          key={opt._uuid || i}
                                          value={opt.name}
                                        >
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    <small className="text-muted">
                                      Selected: {filterOptionValues.length}{" "}
                                      option(s)
                                    </small>
                                    {filterOptionValues.length > 0 &&
                                      remainingFilterChoices.length > 0 && (
                                        <div className="mt-3">
                                          {!isAddingFilter ? (
                                            <button
                                              type="button"
                                              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                              onClick={() => {
                                                const defaultChoice =
                                                  remainingFilterChoices[0]
                                                    ?.name || "";
                                                setPendingFilterValue(
                                                  defaultChoice
                                                );
                                                setIsAddingFilter(true);
                                              }}
                                            >
                                              <MdFormatListBulletedAdd />
                                              Add Filter
                                            </button>
                                          ) : (
                                            <div className="p-3 border rounded bg-light">
                                              <label className="mb-2 form-label fw-bold">
                                                Select a filter option to add:
                                              </label>
                                              <div className="flex-wrap gap-2 d-flex align-items-center">
                                                <select
                                                  className="form-select form-select-sm"
                                                  value={
                                                    pendingFilterValue || ""
                                                  }
                                                  onChange={(e) =>
                                                    setPendingFilterValue(
                                                      e.target.value
                                                    )
                                                  }
                                                >
                                                  <option value="">
                                                    Choose an option...
                                                  </option>
                                                  {remainingFilterChoices.map(
                                                    (opt) => (
                                                      <option
                                                        key={
                                                          opt._uuid || opt.name
                                                        }
                                                        value={opt.name}
                                                      >
                                                        {opt.label}
                                                      </option>
                                                    )
                                                  )}
                                                </select>
                                                <button
                                                  type="button"
                                                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                                                  disabled={!pendingFilterValue}
                                                  onClick={() =>
                                                    handleAddFilterValue(
                                                      pendingFilterValue,
                                                      filterOptionValues,
                                                      optionFilterMap
                                                    )
                                                  }
                                                >
                                                  <MdFormatListBulletedAdd />
                                                  Add
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn btn-outline-secondary btn-sm"
                                                  onClick={() => {
                                                    setIsAddingFilter(false);
                                                    setPendingFilterValue("");
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                  {/* Progressive mapping: show only the next uncompleted filter option */}
                                  {(() => {
                                    // Find the first filter option that hasn't been mapped yet
                                    const nextUnmappedFilter =
                                      filterOptionValues.find(
                                        (filterValue) =>
                                          !optionFilterMap[filterValue] ||
                                          optionFilterMap[filterValue]
                                            .length === 0
                                      );

                                    // If all are mapped, show completion message and editing interface
                                    if (
                                      !nextUnmappedFilter &&
                                      filterOptionValues.length > 0
                                    ) {
                                      return (
                                        <div>
                                          <div className="p-3 mb-3 text-white rounded bg-success">
                                            <h6 className="mb-0">
                                              ✓ All filter options mapped
                                              successfully!
                                            </h6>
                                            <small>
                                              {filterOptionValues.length} filter
                                              option(s) have been linked to
                                              their corresponding options.
                                            </small>
                                          </div>

                                          {/* Sort Controls */}
                                          <div className="p-3 mb-3 border rounded bg-light">
                                            <label className="mb-2 form-label fw-bold">
                                              🔢 Sort Options
                                            </label>
                                            <div className="gap-2 d-flex align-items-center">
                                              <button
                                                type="button"
                                                className={`btn btn-sm ${
                                                  sortOrder === "none"
                                                    ? "btn-primary"
                                                    : "btn-outline-primary"
                                                }`}
                                                onClick={() =>
                                                  applySortToAllFilters("none")
                                                }
                                              >
                                                Original Order
                                              </button>
                                              <button
                                                type="button"
                                                className={`btn btn-sm ${
                                                  sortOrder === "asc"
                                                    ? "btn-primary"
                                                    : "btn-outline-primary"
                                                }`}
                                                onClick={() =>
                                                  applySortToAllFilters("asc")
                                                }
                                              >
                                                A → Z (Ascending)
                                              </button>
                                              <button
                                                type="button"
                                                className={`btn btn-sm ${
                                                  sortOrder === "desc"
                                                    ? "btn-primary"
                                                    : "btn-outline-primary"
                                                }`}
                                                onClick={() =>
                                                  applySortToAllFilters("desc")
                                                }
                                              >
                                                Z → A (Descending)
                                              </button>
                                            </div>
                                            <small className="mt-2 text-muted d-block">
                                              Current sort:{" "}
                                              <strong>
                                                {sortOrder === "none"
                                                  ? "Original Order"
                                                  : sortOrder === "asc"
                                                  ? "Ascending (A→Z)"
                                                  : "Descending (Z→A)"}
                                              </strong>
                                            </small>
                                          </div>

                                          {/* View/Edit All Mappings */}
                                          <div className="p-3 bg-white border rounded">
                                            <h6 className="mb-3 fw-bold">
                                              📋 View & Edit Filter Mappings
                                            </h6>
                                            {filterOptionValues.map(
                                              (filterValue, idx) => {
                                                const filterLabel =
                                                  selectedQ.options.find(
                                                    (o) =>
                                                      o.name === filterValue
                                                  )?.label || filterValue;
                                                const mappedOptions =
                                                  sortOptions(
                                                    optionFilterMap[
                                                      filterValue
                                                    ] || [],
                                                    sortOrder
                                                  );
                                                const isEditing =
                                                  editingFilter === filterValue;

                                                // Get available options not used in other filters
                                                const usedOptions = new Set();
                                                Object.keys(
                                                  optionFilterMap
                                                ).forEach((fv) => {
                                                  if (fv !== filterValue) {
                                                    (
                                                      optionFilterMap[fv] || []
                                                    ).forEach((o) =>
                                                      usedOptions.add(o)
                                                    );
                                                  }
                                                });
                                                const availableOptions =
                                                  selfOptions.filter(
                                                    (o) =>
                                                      !usedOptions.has(
                                                        o.name
                                                      ) &&
                                                      !mappedOptions.includes(
                                                        o.name
                                                      )
                                                  );

                                                return (
                                                  <div
                                                    key={idx}
                                                    className="p-3 mb-3 border rounded"
                                                    style={{
                                                      backgroundColor:
                                                        "#f8f9fa",
                                                    }}
                                                  >
                                                    <div className="mb-2 d-flex justify-content-between align-items-center">
                                                      <strong className="text-primary">
                                                        {idx + 1}. {filterLabel}
                                                      </strong>
                                                      <button
                                                        type="button"
                                                        className={`btn btn-sm ${
                                                          isEditing
                                                            ? "btn-success"
                                                            : "btn-outline-primary"
                                                        }`}
                                                        onClick={() =>
                                                          setEditingFilter(
                                                            isEditing
                                                              ? null
                                                              : filterValue
                                                          )
                                                        }
                                                      >
                                                        {isEditing
                                                          ? "✓ Done"
                                                          : "✏️ Edit"}
                                                      </button>
                                                    </div>

                                                    {!isEditing ? (
                                                      // View Mode
                                                      <div>
                                                        <div className="flex-wrap gap-2 d-flex">
                                                          {mappedOptions.length >
                                                          0 ? (
                                                            mappedOptions.map(
                                                              (
                                                                optName,
                                                                optIdx
                                                              ) => {
                                                                const optLabel =
                                                                  selfOptions.find(
                                                                    (o) =>
                                                                      o.name ===
                                                                      optName
                                                                  )?.label ||
                                                                  optName;
                                                                return (
                                                                  <span
                                                                    key={optIdx}
                                                                    className="badge bg-primary"
                                                                    style={{
                                                                      fontSize:
                                                                        "0.9rem",
                                                                      padding:
                                                                        "6px 10px",
                                                                    }}
                                                                  >
                                                                    {optLabel}
                                                                  </span>
                                                                );
                                                              }
                                                            )
                                                          ) : (
                                                            <span className="text-muted">
                                                              No options mapped
                                                            </span>
                                                          )}
                                                        </div>
                                                        <small className="mt-2 text-muted d-block">
                                                          {mappedOptions.length}{" "}
                                                          option(s)
                                                        </small>
                                                      </div>
                                                    ) : (
                                                      // Edit Mode
                                                      <div>
                                                        <label className="mb-2 form-label fw-bold">
                                                          Currently Linked
                                                          Options:
                                                        </label>
                                                        <div
                                                          className="flex-wrap gap-2 p-2 mb-3 border rounded d-flex"
                                                          style={{
                                                            backgroundColor:
                                                              "#fff",
                                                            minHeight: "50px",
                                                          }}
                                                        >
                                                          {mappedOptions.length >
                                                          0 ? (
                                                            mappedOptions.map(
                                                              (
                                                                optName,
                                                                optIdx
                                                              ) => {
                                                                const optLabel =
                                                                  selfOptions.find(
                                                                    (o) =>
                                                                      o.name ===
                                                                      optName
                                                                  )?.label ||
                                                                  optName;
                                                                return (
                                                                  <span
                                                                    key={optIdx}
                                                                    className="gap-2 badge bg-primary d-flex align-items-center"
                                                                    style={{
                                                                      fontSize:
                                                                        "0.9rem",
                                                                      padding:
                                                                        "6px 10px",
                                                                    }}
                                                                  >
                                                                    {optLabel}
                                                                    <button
                                                                      type="button"
                                                                      className="btn-close btn-close-white"
                                                                      style={{
                                                                        fontSize:
                                                                          "0.6rem",
                                                                      }}
                                                                      onClick={() =>
                                                                        removeOptionFromFilter(
                                                                          filterValue,
                                                                          optName
                                                                        )
                                                                      }
                                                                      title="Remove"
                                                                    ></button>
                                                                  </span>
                                                                );
                                                              }
                                                            )
                                                          ) : (
                                                            <span className="text-muted">
                                                              No options - click
                                                              below to add
                                                            </span>
                                                          )}
                                                        </div>

                                                        {availableOptions.length >
                                                          0 && (
                                                          <>
                                                            <label className="mb-2 form-label fw-bold">
                                                              Available Options
                                                              to Add:
                                                            </label>
                                                            <div
                                                              className="flex-wrap gap-2 p-2 border rounded d-flex"
                                                              style={{
                                                                backgroundColor:
                                                                  "#e7f3ff",
                                                              }}
                                                            >
                                                              {availableOptions.map(
                                                                (
                                                                  opt,
                                                                  availIdx
                                                                ) => (
                                                                  <button
                                                                    key={
                                                                      availIdx
                                                                    }
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-success"
                                                                    onClick={() =>
                                                                      addOptionToFilter(
                                                                        filterValue,
                                                                        opt.name
                                                                      )
                                                                    }
                                                                    style={{
                                                                      fontSize:
                                                                        "0.85rem",
                                                                    }}
                                                                  >
                                                                    +{" "}
                                                                    {opt.label}
                                                                  </button>
                                                                )
                                                              )}
                                                            </div>
                                                          </>
                                                        )}
                                                        {availableOptions.length ===
                                                          0 &&
                                                          mappedOptions.length >
                                                            0 && (
                                                            <div className="mt-2 mb-0 alert alert-info">
                                                              All available
                                                              options are
                                                              already linked.
                                                              Remove options
                                                              above to add
                                                              different ones.
                                                            </div>
                                                          )}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              }
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }

                                    // Show only the next unmapped filter option
                                    if (nextUnmappedFilter) {
                                      const currentIndex =
                                        filterOptionValues.indexOf(
                                          nextUnmappedFilter
                                        );
                                      const totalItems =
                                        filterOptionValues.length;

                                      return (
                                        <div className="mb-3">
                                          {/* Progress indicator */}
                                          <div className="mb-2">
                                            <small className="text-muted">
                                              Step {currentIndex + 1} of{" "}
                                              {totalItems}
                                            </small>
                                            <div
                                              className="progress"
                                              style={{ height: "4px" }}
                                            >
                                              <div
                                                className="progress-bar"
                                                style={{
                                                  width: `${
                                                    (currentIndex /
                                                      totalItems) *
                                                    100
                                                  }%`,
                                                }}
                                              ></div>
                                            </div>
                                          </div>

                                          {/* Back button - show if not on first step */}
                                          {currentIndex > 0 && (
                                            <div className="mb-3">
                                              <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => {
                                                  // Go back to previous step by clearing current step's mapping
                                                  // and finding the previous filter option that was completed
                                                  const previousIndex =
                                                    currentIndex - 1;
                                                  const previousFilterOption =
                                                    filterOptionValues[
                                                      previousIndex
                                                    ];

                                                  // Clear the previous step's mapping to make it "unmapped" again
                                                  const newMapping = {
                                                    ...optionFilterMap,
                                                  };
                                                  delete newMapping[
                                                    previousFilterOption
                                                  ];
                                                  updateOptionFilterMap(
                                                    previousFilterOption,
                                                    []
                                                  );
                                                }}
                                              >
                                                ← Back to Previous Step
                                              </button>
                                            </div>
                                          )}

                                          <label className="form-label">
                                            Link options for:{" "}
                                            <b className="text-primary">
                                              {(() => {
                                                // Build the complete hierarchical filter chain
                                                const filterChain = [];

                                                // Function to recursively trace back the hierarchy
                                                const buildHierarchicalChain = (
                                                  currentQuestion,
                                                  currentFilterValue
                                                ) => {
                                                  // If this question has a filter question, trace back
                                                  if (
                                                    currentQuestion.filterQuestionId
                                                  ) {
                                                    const parentQ =
                                                      allQuestions.find((q) => {
                                                        // Handle both UUID and index-based matching
                                                        const qId =
                                                          q._uuid ||
                                                          q.idx?.toString() ||
                                                          allQuestions
                                                            .indexOf(q)
                                                            .toString();
                                                        return (
                                                          qId ===
                                                          currentQuestion.filterQuestionId
                                                        );
                                                      });

                                                    if (parentQ) {
                                                      // Find what parent option was selected for this current filter value
                                                      let parentFilterValue =
                                                        null;

                                                      // Look through the parent question's option filter map
                                                      if (
                                                        parentQ.optionFilterMap
                                                      ) {
                                                        for (const [
                                                          parentOption,
                                                          childOptions,
                                                        ] of Object.entries(
                                                          parentQ.optionFilterMap
                                                        )) {
                                                          if (
                                                            childOptions.includes(
                                                              currentFilterValue
                                                            )
                                                          ) {
                                                            parentFilterValue =
                                                              parentOption;
                                                            break;
                                                          }
                                                        }
                                                      }

                                                      if (parentFilterValue) {
                                                        // Recursively build chain for parent
                                                        buildHierarchicalChain(
                                                          parentQ,
                                                          parentFilterValue
                                                        );

                                                        // Add parent option label to chain
                                                        const parentOptionLabel =
                                                          parentQ.options?.find(
                                                            (o) =>
                                                              o.name ===
                                                              parentFilterValue
                                                          )?.label ||
                                                          parentFilterValue;
                                                        filterChain.push(
                                                          parentOptionLabel
                                                        );
                                                      }
                                                    }
                                                  }
                                                };

                                                // Start building the chain from the current question
                                                buildHierarchicalChain(
                                                  question,
                                                  nextUnmappedFilter
                                                );

                                                // Add the current filter option
                                                const currentOptionLabel =
                                                  selectedQ.options.find(
                                                    (o) =>
                                                      o.name ===
                                                      nextUnmappedFilter
                                                  )?.label ||
                                                  nextUnmappedFilter;
                                                filterChain.push(
                                                  currentOptionLabel
                                                );

                                                // If there are selected child options, add them to the chain
                                                if (
                                                  optionFilterMap[
                                                    nextUnmappedFilter
                                                  ] &&
                                                  optionFilterMap[
                                                    nextUnmappedFilter
                                                  ].length > 0
                                                ) {
                                                  const selectedChildOptions =
                                                    optionFilterMap[
                                                      nextUnmappedFilter
                                                    ].map((optionName) => {
                                                      // Find the label for this option name
                                                      const optionLabel =
                                                        selfOptions.find(
                                                          (opt) =>
                                                            opt.name ===
                                                            optionName
                                                        )?.label || optionName;
                                                      return optionLabel;
                                                    });

                                                  filterChain.push(
                                                    ...selectedChildOptions
                                                  );
                                                }

                                                return filterChain.join(" → ");
                                              })()}
                                            </b>
                                          </label>
                                          <select
                                            className="form-select"
                                            multiple
                                            size="8"
                                            value={
                                              optionFilterMap[
                                                nextUnmappedFilter
                                              ] || []
                                            }
                                            onChange={(e) => {
                                              const selected = Array.from(
                                                e.target.selectedOptions
                                              ).map((opt) => opt.value);
                                              updateOptionFilterMap(
                                                nextUnmappedFilter,
                                                selected
                                              );
                                            }}
                                            style={{
                                              minHeight: "200px",
                                              maxHeight: "300px",
                                            }}
                                          >
                                            {(() => {
                                              // Get all already mapped options from previous steps
                                              const alreadyMappedOptions =
                                                new Set();
                                              filterOptionValues.forEach(
                                                (filterVal) => {
                                                  if (
                                                    filterVal !==
                                                      nextUnmappedFilter &&
                                                    optionFilterMap[
                                                      filterVal
                                                    ] &&
                                                    optionFilterMap[filterVal]
                                                      .length > 0
                                                  ) {
                                                    optionFilterMap[
                                                      filterVal
                                                    ].forEach(
                                                      (mappedOption) => {
                                                        alreadyMappedOptions.add(
                                                          mappedOption
                                                        );
                                                      }
                                                    );
                                                  }
                                                }
                                              );

                                              // Filter out already mapped options from current selection
                                              return selfOptions
                                                .filter(
                                                  (opt) =>
                                                    !alreadyMappedOptions.has(
                                                      opt.name
                                                    )
                                                )
                                                .map((opt, i) => (
                                                  <option
                                                    key={opt._uuid || i}
                                                    value={opt.name}
                                                  >
                                                    {opt.label}
                                                  </option>
                                                ));
                                            })()}
                                          </select>
                                          <small className="text-muted">
                                            Linked:{" "}
                                            {
                                              (
                                                optionFilterMap[
                                                  nextUnmappedFilter
                                                ] || []
                                              ).length
                                            }{" "}
                                            option(s)
                                            {(
                                              optionFilterMap[
                                                nextUnmappedFilter
                                              ] || []
                                            ).length > 0 && (
                                              <span className="text-success">
                                                {" "}
                                                - Ready for next step!
                                              </span>
                                            )}
                                            <br />
                                            {(() => {
                                              // Count available options for THIS step (not yet used in previous mappings)
                                              const alreadyMappedOptions =
                                                new Set();

                                              // Only count options from COMPLETED previous steps (not current step)
                                              filterOptionValues.forEach(
                                                (filterVal) => {
                                                  if (
                                                    filterVal !==
                                                      nextUnmappedFilter &&
                                                    optionFilterMap[
                                                      filterVal
                                                    ] &&
                                                    optionFilterMap[filterVal]
                                                      .length > 0
                                                  ) {
                                                    optionFilterMap[
                                                      filterVal
                                                    ].forEach(
                                                      (mappedOption) => {
                                                        alreadyMappedOptions.add(
                                                          mappedOption
                                                        );
                                                      }
                                                    );
                                                  }
                                                }
                                              );

                                              const availableOptions =
                                                selfOptions.filter(
                                                  (opt) =>
                                                    !alreadyMappedOptions.has(
                                                      opt.name
                                                    )
                                                );

                                              return (
                                                <span className="text-info">
                                                  Available:{" "}
                                                  {availableOptions.length}{" "}
                                                  option(s)
                                                  {alreadyMappedOptions.size >
                                                    0 &&
                                                    ` (${alreadyMappedOptions.size} already used)`}
                                                </span>
                                              );
                                            })()}
                                          </small>

                                          {/* Show completed mappings summary */}
                                          {currentIndex > 0 && (
                                            <div className="p-2 mt-2 rounded bg-light">
                                              <small className="text-muted">
                                                <strong>Completed:</strong>{" "}
                                                {currentIndex} of {totalItems}{" "}
                                                mappings
                                              </small>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    return null;
                                  })()}
                                </>
                              );
                            } else if (selectedQ) {
                              return (
                                <div className="mb-3">
                                  <small className="text-muted">
                                    The selected question has no options.
                                  </small>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </Tab>
                  )}
                <Tab eventKey="constraint" title="Constraint">
                  <div className="mt-3">
                    <div className="p-3 border rounded bg-light">
                      <h6 className="mb-3">Field Validation Constraints</h6>

                      {/* Constraint Type Selection */}
                      <div className="mb-3">
                        <label className="form-label">Constraint Type:</label>
                        <Form.Select
                          value={question.constraintType || ""}
                          onChange={(e) => {
                            const type = e.target.value;
                            handleQuestionChange(index, "constraintType", type);
                            // Reset constraint when changing type
                            if (type === "regex") {
                              handleQuestionChange(
                                index,
                                "constraint",
                                "regex(., '')"
                              );
                              handleQuestionChange(index, "regexPatterns", []);
                            } else if (type === "range") {
                              handleQuestionChange(
                                index,
                                "constraint",
                                ". >= 0 and . <= 100"
                              );
                              handleQuestionChange(index, "rangeMin", "");
                              handleQuestionChange(index, "rangeMax", "");
                            } else if (type === "length") {
                              handleQuestionChange(
                                index,
                                "constraint",
                                "string-length(.) >= 1 and string-length(.) <= 50"
                              );
                              handleQuestionChange(index, "lengthMin", "");
                              handleQuestionChange(index, "lengthMax", "");
                            } else if (type === "custom") {
                              handleQuestionChange(index, "constraint", "");
                            }
                          }}
                        >
                          <option value="">Select constraint type...</option>
                          <option value="regex">
                            Regex Pattern (for text/number validation)
                          </option>
                          <option value="range">
                            Range (for numeric values)
                          </option>
                          <option value="length">
                            Length (for text length)
                          </option>
                          <option value="custom">Custom Expression</option>
                        </Form.Select>
                      </div>

                      {/* Regex Pattern Builder */}
                      {question.constraintType === "regex" && (
                        <div className="mb-3">
                          <h6>Regex Pattern Builder</h6>
                          <div className="p-3 bg-white border rounded">
                            <div className="mb-2">
                              <label className="form-label">
                                Common Patterns:
                              </label>
                              <div className="flex-wrap gap-2 mb-2 d-flex">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    const patterns =
                                      question.regexPatterns || [];
                                    const newPatterns = [
                                      ...patterns,
                                      {
                                        type: "digits",
                                        value: "10",
                                        description: "Exactly 10 digits",
                                      },
                                    ];
                                    handleQuestionChange(
                                      index,
                                      "regexPatterns",
                                      newPatterns
                                    );
                                    updateRegexConstraint(
                                      index,
                                      newPatterns,
                                      handleQuestionChange
                                    );
                                  }}
                                >
                                  + Exact Digits
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    const patterns =
                                      question.regexPatterns || [];
                                    const newPatterns = [
                                      ...patterns,
                                      {
                                        type: "range",
                                        min: "1",
                                        max: "10",
                                        description: "1-10 digits",
                                      },
                                    ];
                                    handleQuestionChange(
                                      index,
                                      "regexPatterns",
                                      newPatterns
                                    );
                                    updateRegexConstraint(
                                      index,
                                      newPatterns,
                                      handleQuestionChange
                                    );
                                  }}
                                >
                                  + Digit Range
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    const patterns =
                                      question.regexPatterns || [];
                                    const newPatterns = [
                                      ...patterns,
                                      {
                                        type: "letters",
                                        description: "Only letters",
                                      },
                                    ];
                                    handleQuestionChange(
                                      index,
                                      "regexPatterns",
                                      newPatterns
                                    );
                                    updateRegexConstraint(
                                      index,
                                      newPatterns,
                                      handleQuestionChange
                                    );
                                  }}
                                >
                                  + Letters Only
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    const patterns =
                                      question.regexPatterns || [];
                                    const newPatterns = [
                                      ...patterns,
                                      {
                                        type: "alphanumeric",
                                        description: "Letters and numbers",
                                      },
                                    ];
                                    handleQuestionChange(
                                      index,
                                      "regexPatterns",
                                      newPatterns
                                    );
                                    updateRegexConstraint(
                                      index,
                                      newPatterns,
                                      handleQuestionChange
                                    );
                                  }}
                                >
                                  + Alphanumeric
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    const patterns =
                                      question.regexPatterns || [];
                                    const newPatterns = [
                                      ...patterns,
                                      {
                                        type: "email",
                                        description: "Email format",
                                      },
                                    ];
                                    handleQuestionChange(
                                      index,
                                      "regexPatterns",
                                      newPatterns
                                    );
                                    updateRegexConstraint(
                                      index,
                                      newPatterns,
                                      handleQuestionChange
                                    );
                                  }}
                                >
                                  + Email
                                </button>
                              </div>
                            </div>

                            {/* Display and edit regex patterns */}
                            {question.regexPatterns &&
                              question.regexPatterns.length > 0 && (
                                <div className="mb-3">
                                  <label className="form-label">
                                    Active Patterns (OR logic):
                                  </label>
                                  {question.regexPatterns.map(
                                    (pattern, patternIndex) => (
                                      <div
                                        key={patternIndex}
                                        className="p-2 mb-2 border rounded"
                                      >
                                        <div className="mb-2 d-flex justify-content-between align-items-center">
                                          <strong>{pattern.description}</strong>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => {
                                              const newPatterns =
                                                question.regexPatterns.filter(
                                                  (_, i) => i !== patternIndex
                                                );
                                              handleQuestionChange(
                                                index,
                                                "regexPatterns",
                                                newPatterns
                                              );
                                              updateRegexConstraint(
                                                index,
                                                newPatterns,
                                                handleQuestionChange
                                              );
                                            }}
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        {pattern.type === "digits" && (
                                          <div>
                                            <label className="form-label">
                                              Number of digits:
                                            </label>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={pattern.value || ""}
                                              onChange={(e) => {
                                                const newPatterns = [
                                                  ...question.regexPatterns,
                                                ];
                                                newPatterns[patternIndex] = {
                                                  ...pattern,
                                                  value: e.target.value,
                                                  description: `Exactly ${e.target.value} digits`,
                                                };
                                                handleQuestionChange(
                                                  index,
                                                  "regexPatterns",
                                                  newPatterns
                                                );
                                                updateRegexConstraint(
                                                  index,
                                                  newPatterns,
                                                  handleQuestionChange
                                                );
                                              }}
                                              placeholder="e.g., 10"
                                            />
                                          </div>
                                        )}

                                        {pattern.type === "range" && (
                                          <div className="row">
                                            <div className="col-6">
                                              <label className="form-label">
                                                Min digits:
                                              </label>
                                              <input
                                                type="number"
                                                className="form-control"
                                                value={pattern.min || ""}
                                                onChange={(e) => {
                                                  const newPatterns = [
                                                    ...question.regexPatterns,
                                                  ];
                                                  newPatterns[patternIndex] = {
                                                    ...pattern,
                                                    min: e.target.value,
                                                    description: `${
                                                      e.target.value
                                                    }-${
                                                      pattern.max || "?"
                                                    } digits`,
                                                  };
                                                  handleQuestionChange(
                                                    index,
                                                    "regexPatterns",
                                                    newPatterns
                                                  );
                                                  updateRegexConstraint(
                                                    index,
                                                    newPatterns,
                                                    handleQuestionChange
                                                  );
                                                }}
                                                placeholder="Min"
                                              />
                                            </div>
                                            <div className="col-6">
                                              <label className="form-label">
                                                Max digits:
                                              </label>
                                              <input
                                                type="number"
                                                className="form-control"
                                                value={pattern.max || ""}
                                                onChange={(e) => {
                                                  const newPatterns = [
                                                    ...question.regexPatterns,
                                                  ];
                                                  newPatterns[patternIndex] = {
                                                    ...pattern,
                                                    max: e.target.value,
                                                    description: `${
                                                      pattern.min || "?"
                                                    }-${e.target.value} digits`,
                                                  };
                                                  handleQuestionChange(
                                                    index,
                                                    "regexPatterns",
                                                    newPatterns
                                                  );
                                                  updateRegexConstraint(
                                                    index,
                                                    newPatterns,
                                                    handleQuestionChange
                                                  );
                                                }}
                                                placeholder="Max"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Range Constraint Builder */}
                      {question.constraintType === "range" && (
                        <div className="mb-3">
                          <h6>Numeric Range</h6>
                          <div className="row">
                            <div className="col-6">
                              <label className="form-label">
                                Minimum value:
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                value={question.rangeMin || ""}
                                onChange={(e) => {
                                  handleQuestionChange(
                                    index,
                                    "rangeMin",
                                    e.target.value
                                  );
                                  const min = e.target.value;
                                  const max = question.rangeMax || "";
                                  if (min !== "" && max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `. >= ${min} and . <= ${max}`
                                    );
                                  } else if (min !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `. >= ${min}`
                                    );
                                  } else if (max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `. <= ${max}`
                                    );
                                  }
                                }}
                                placeholder="e.g., 0"
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label">
                                Maximum value:
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                value={question.rangeMax || ""}
                                onChange={(e) => {
                                  handleQuestionChange(
                                    index,
                                    "rangeMax",
                                    e.target.value
                                  );
                                  const min = question.rangeMin || "";
                                  const max = e.target.value;
                                  if (min !== "" && max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `. >= ${min} and . <= ${max}`
                                    );
                                  } else if (min !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `. >= ${min}`
                                    );
                                  } else if (max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `. <= ${max}`
                                    );
                                  }
                                }}
                                placeholder="e.g., 100"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Length Constraint Builder */}
                      {question.constraintType === "length" && (
                        <div className="mb-3">
                          <h6>Text Length</h6>
                          <div className="row">
                            <div className="col-6">
                              <label className="form-label">
                                Minimum characters:
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                value={question.lengthMin || ""}
                                onChange={(e) => {
                                  handleQuestionChange(
                                    index,
                                    "lengthMin",
                                    e.target.value
                                  );
                                  const min = e.target.value;
                                  const max = question.lengthMax || "";
                                  if (min !== "" && max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `string-length(.) >= ${min} and string-length(.) <= ${max}`
                                    );
                                  } else if (min !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `string-length(.) >= ${min}`
                                    );
                                  } else if (max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `string-length(.) <= ${max}`
                                    );
                                  }
                                }}
                                placeholder="e.g., 1"
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label">
                                Maximum characters:
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                value={question.lengthMax || ""}
                                onChange={(e) => {
                                  handleQuestionChange(
                                    index,
                                    "lengthMax",
                                    e.target.value
                                  );
                                  const min = question.lengthMin || "";
                                  const max = e.target.value;
                                  if (min !== "" && max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `string-length(.) >= ${min} and string-length(.) <= ${max}`
                                    );
                                  } else if (min !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `string-length(.) >= ${min}`
                                    );
                                  } else if (max !== "") {
                                    handleQuestionChange(
                                      index,
                                      "constraint",
                                      `string-length(.) <= ${max}`
                                    );
                                  }
                                }}
                                placeholder="e.g., 50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generated Constraint Expression */}
                      <div className="mb-3">
                        <label className="form-label">
                          Generated Constraint Expression:
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={question.constraint || ""}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "constraint",
                              e.target.value
                            )
                          }
                          placeholder="Generated constraint will appear here..."
                          readOnly={question.constraintType !== "custom"}
                        />
                        <small className="text-muted">
                          {question.constraintType === "custom"
                            ? "You can manually edit this constraint expression."
                            : "This is auto-generated. Switch to 'Custom Expression' to edit manually."}
                        </small>
                      </div>

                      {/* Constraint Message */}
                      <div className="mb-3">
                        <label className="form-label">
                          Constraint Message:
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={question.constraint_message || ""}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "constraint_message",
                              e.target.value
                            )
                          }
                          placeholder="Error message shown when constraint fails (e.g., 'Please enter exactly 10, 13, or 17 digits')"
                        />
                      </div>

                      {/* Preview Section */}
                      {question.constraint && (
                        <div className="alert alert-info">
                          <strong>Preview:</strong>
                          <br />
                          <code>{question.constraint}</code>
                          <br />
                          {question.constraint_message && (
                            <>
                              <strong>Error Message:</strong>{" "}
                              {question.constraint_message}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>
                <Tab eventKey="calculation" title="Calculation">
                  <CalculationBuilder
                    question={question}
                    index={index}
                    handleQuestionChange={handleQuestionChange}
                    questions={allQuestions}
                  />
                </Tab>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default Question;

function CreateFormSettingBtn({
  index,
  toggleSettings,
  handleDeleteQuestion,
  handleDuplicateQuestion,
  onToggleCollapse,
  isCollapsed,
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center justify-start gap-2 m-1 text-sm md:flex-row"
    >
      <button
        type="button"
        onClick={() => toggleSettings(index)}
        className="px-3 py-1 text-sm font-medium text-white rounded-lg bg-color-custom hover:bg-blue-400 focus:ring-4 focus:ring-blue-300"
        title="Settings"
      >
        <CiSettings className="inline-block w-5 h-5 text-white" />
      </button>

      <button
        type="button"
        onClick={() => handleDeleteQuestion(index)}
        className="px-3 py-1 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:ring-red-300"
        title="Delete"
      >
        <RiDeleteBin5Line className="inline-block w-5 h-5 text-white" />
      </button>

      <button
        type="button"
        onClick={() => handleDuplicateQuestion?.(index)}
        className="px-3 py-1 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-300"
        title="Duplicate"
      >
        <MdContentCopy className="inline-block w-5 h-5 text-white" />
      </button>
    </div>
  );
}

function SelectionToggle({ isSelected, onToggleSelect }) {
  return (
    <label
      className="flex items-center gap-1 m-0 text-xs font-medium text-gray-700 cursor-pointer select-none"
      title="Include this question when duplicating multiple items"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="w-4 h-4"
        checked={!!isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onToggleSelect?.();
        }}
      />
      <span>{isSelected ? "Selected" : "Select"}</span>
    </label>
  );
}

/* -------------------- Small UI helpers -------------------- */

function HeaderBar({
  title,
  index,
  onToggleCollapse,
  isCollapsed,
  rightControls,
  leftExtra,
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ gap: 8, marginBottom: 6 }}
    >
      <div className="flex items-center" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={() => onToggleCollapse?.(index)}
          className="btn btn-light btn-sm"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <LuChevronRight /> : <LuChevronDown />}
        </button>
        {leftExtra}
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      </div>
      <div className="flex items-center" style={{ gap: 8 }}>
        {rightControls}
      </div>
    </div>
  );
}

import React, { useState, useRef } from "react";
import { Collapse, Tabs, Tab, Table, Button, Form } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import QuestionSettings from "./QuestionSettings";
import Option from "./Option";
import SubQuestion from "./SubQuestion";
import { MdFormatListBulletedAdd } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { RiDeleteBin5Line } from "react-icons/ri";
import { useDrag, useDrop } from "react-dnd";

const ItemTypes = { QUESTION: "question" };

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
}) => {
  const ref = useRef(null);
  const [conditions, setConditions] = useState(
    question.conditions || [{ question: "", condition: "", value: "" }]
  );
  const [conditionLogic, setConditionLogic] = useState(
    question.conditionLogic || "and"
  );

  // DnD logic (matches CreateForm)
  const [, drop] = useDrop({
    accept: ItemTypes.QUESTION,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveQuestion(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.QUESTION,
    item: { type: ItemTypes.QUESTION, id: question.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const opacity = isDragging ? 0.5 : 1;
  const border = isDragging ? "2px solid #007bff" : "2px solid #ccc";
  const backgroundColor = isDragging ? "#f0f8ff" : "#fff";
  const cursor = isDragging ? "grabbing" : "grab";

  const transform = isDragging ? "scale(1.02)" : "scale(1)";
  const boxShadow = isDragging
    ? "0 8px 20px rgba(0, 123, 255, 0.3)"
    : "0 2px 6px rgba(0,0,0,0.05)";
  const transition = "all 0.2s ease-in-out";



  const displayType = question.type.startsWith("select_one")
    ? "select_one"
    : question.type.startsWith("select_multiple")
    ? "select_multiple"
    : question.type;

  // Skip logic helpers (matches CreateForm)
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

  const questionsToDisplay = allQuestions;

  return (
    <div
      
      style={{ opacity, border, backgroundColor, cursor }}
      className="p-2 mb-2 border-2 rounded"
    >
      <div
        ref={ref}
        style={{
          opacity,
          transform,
          boxShadow,
          transition,
          border: "2px solid #e2e8f0",
          backgroundColor: "#ffffff",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        
      >
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-100 px-2 py-1 rounded cursor-grab active:cursor-grabbing transition-all">
          <i className="fas fa-grip-vertical text-slate-500" />
          <span>Drag to reorder</span>
        </div>
      </div>

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
            <span className="m-0 text-[12px]">
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
            placeholder={`Label for Question ${index + 1}`}
            disabled={!displayType}
            rows={1}
          />
        </div>

        <CreateFormSettingBtn
          index={index}
          toggleSettings={toggleSettings}
          handleDeleteQuestion={handleDeleteQuestion}
        />
      </div>

      {errors[index] && <p className="text-danger">{errors[index]}</p>}
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
        <label className="form-check-label" htmlFor={`mycheckbox1-${index}`}>
          Required
        </label>
      </div>

      {(question.type.startsWith("select_one") ||
        question.type.startsWith("select_multiple")) && (
        <div className="p-2 mb-3 bg-blue-200">
          <label className="form-label">Options:</label>
          {question.options.map((option, optionIndex) => (
            <Option
              key={optionIndex}
              option={option}
              index={optionIndex}
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
            Add Option
          </button>
        </div>
      )}
      {question.type === "rating" && (
        <div className="p-2 mb-3 bg-blue-200">
          <label className="form-label">Options:</label>
          {question.options.map((option, optionIndex) => (
            <Option
              key={optionIndex}
              option={option}
              index={optionIndex}
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
            Add Option
          </button>

          <div className="bg-[#1814f3bc]/30 p-2 mt-1 rounded-lg">
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

      {openSettings[index] && (
        <div className="transition-all duration-300 ease-in-out">
          <Tabs
            defaultActiveKey="questionOptions"
            id={`question-tabs-${index}`}
          >
            <Tab eventKey="questionOptions" title="Question Options">
              <QuestionSettings
                question={question}
                onChange={(field, value) =>
                  handleQuestionChange(index, field, value)
                }
                allQuestions={allQuestions}
              />
            </Tab>
            <Tab eventKey="skipLogic" title="Skip Logic">
              <div className="mt-3">
                <Tabs
                  defaultActiveKey="addCondition"
                  id={`skip-logic-tabs-${index}`}
                >
                  <Tab eventKey="addCondition" title="Add a Condition">
                    <div className="mt-3">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Condition</th>
                            <th>Value</th>
                            <th>Action</th>
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
                                  <option value="">Select a question</option>
                                  {questionsToDisplay
                                    .slice(0, index)
                                    .map((q, qIndex) => (
                                      <option key={q.name || qIndex} value={q.name}>
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
                                      ?.type.startsWith("select_multiple")) && (
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
                                    .find((q) => q.name === condition.question)
                                    ?.type.startsWith("select_one") ||
                                  questionsToDisplay
                                    .find((q) => q.name === condition.question)
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
                                      <option value="">Select a value</option>
                                      {questionsToDisplay
                                        .find(
                                          (q) => q.name === condition.question
                                        )
                                        ?.options.map((option, optionIndex) => (
                                          <option
                                            key={optionIndex}
                                            value={option.name}
                                          >
                                            {option.label}
                                          </option>
                                        ))}
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
                      <br />
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
                  </Tab>
                  <Tab
                    eventKey="manualSkipLogic"
                    title="Manually enter your skip logic in XLSForm code"
                  >
                    <div className="mt-3">
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
                        <Button
                          variant="primary"
                          onClick={() => saveManualSkipLogic(question.relevant)}
                        >
                          Save Manual Skip Logic
                        </Button>
                      </Form>
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </Tab>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Question;

function CreateFormSettingBtn({ index, toggleSettings, handleDeleteQuestion }) {
  return (
    <div>
      <div className="flex items-center justify-start gap-2 m-1 text-sm md:flex-col md:mt-2">
        <button
          type="button"
          className="px-4 py-1 mb-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 me-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          onClick={() => toggleSettings(index)}
        >
          <CiSettings className="inline-block w-6 h-6 text-white" />
        </button>
        <button
          type="button"
          className="px-4 py-1 mb-2 text-sm font-medium text-white bg-red-700 rounded-lg focus:outline-none hover:bg-red-800 focus:ring-4 focus:ring-red-300 me-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
          onClick={() => handleDeleteQuestion(index)}
        >
          <RiDeleteBin5Line className="inline-block w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}

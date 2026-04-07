import React, { useState, useEffect } from "react";
import { Collapse, Form, Button, Tabs, Tab, Table } from "react-bootstrap";
import { useDrag, useDrop } from "react-dnd";
import axios from "axios";
import Option from "./Option";
import SubQuestion from "./SubQuestion";
import { FaTrash } from "react-icons/fa"; // Import the delete icon
import { MdFormatListBulletedAdd } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { RiDeleteBin5Line } from "react-icons/ri";
import { BACKEND_URL } from "../../../../config";
import { FaRegTrashCan } from "react-icons/fa6";

const ItemTypes = {
  QUESTION: "question",
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
}) => {
  const ref = React.useRef(null);
  const dragHandle = React.useRef(null);
  const [conditions, setConditions] = useState(
    question.conditions || [{ question: "", condition: "", value: "" }]
  );
  const [conditionLogic, setConditionLogic] = useState(
    question.conditionLogic || "and"
  );
  const [fetchedQuestions, setFetchedQuestions] = useState([]);

  useEffect(() => {
    if (isEditing) {
      const fetchQuestions = async () => {
        try {
          console.log(`Fetching questions for formId: ${formId}`);
          const token = sessionStorage.getItem("authToken");
          const response = await axios.get(
            `${BACKEND_URL}/api/forms/${formId}`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );
          setFetchedQuestions(response.data.questions); // Assuming the response contains a 'questions' field
        } catch (error) {
          console.error("Error fetching questions:", error);
          if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
            if (error.response.status === 404) {
              console.error("The requested resource was not found.");
            }
          } else if (error.request) {
            console.error("Request data:", error.request);
          } else {
            console.error("Error message:", error.message);
          }
        }
      };
      fetchQuestions();
    }
  }, [isEditing, formId]);

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

  const [, drop] = useDrop({
    accept: ItemTypes.QUESTION,
    hover(item, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Dragging downward
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;

      // Dragging upward
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // 🔁 Perform the move
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

  drop(ref);
  drag(dragHandle);

  const opacity = isDragging ? 0 : 1;
  const border = isDragging ? "2px solid #007bff" : "2px solid #ccc";
  const backgroundColor = isDragging ? "#f0f8ff" : "#fff";
  const cursor = isDragging ? "grabbing" : "grab";

  const displayType = question.type.startsWith("select_one")
    ? "select_one"
    : question.type.startsWith("select_multiple")
      ? "select_multiple"
      : question.type;

  console.log(isEditing ? "Editing mode" : "Creating mode");
  const questionsToDisplay = isEditing ? fetchedQuestions : allQuestions;

  return (
    <div
      ref={ref}
      style={{ opacity, border, backgroundColor, cursor }}
      className="p-2 mb-2 border-2 rounded"
    >
      <div
        ref={dragHandle}
        style={{
          cursor: "grab",
          backgroundColor: "#d1ecf1",
          padding: "5px",
          borderRadius: "4px",
        }}
      >
        <i className="fas fa-grip-vertical"></i> Drag to reorder
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

        {/* {errors[index] && <p className="text-danger">{errors[index]}</p>} */}
        {/* <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          checked={question.required}
          onChange={() => handleQuestionChange(index, 'required', !question.required)}
        />
        <label className="form-check-label">Required</label>
      </div> */}

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

      {console.log(openSettings[index])}

      {openSettings[index] && (
        <div className="transition-all duration-300 ease-in-out">
          <Tabs
            defaultActiveKey="questionOptions"
            id={`question-tabs-${index}`}
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
                  <label className="form-label">Appearance (advanced):</label>
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
                        <label className="form-label">Accepted files:</label>
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
                    <label className="form-label">Parameters: max-pixels</label>
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
                              question.parameters?.includes("randomize=true") ||
                              false
                            }
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "parameters",
                                `randomize=${e.target.checked};seed=${question.parameters
                                  ?.split(";")[1]
                                  ?.split("=")[1] || ""
                                }`
                              )
                            }
                          />
                          <label className="form-check-label">Randomize</label>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Seed:</label>
                        <input
                          type="number"
                          className="form-control"
                          value={
                            question.parameters?.split(";")[1]?.split("=")[1] ||
                            ""
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
                                  <option value="">Select a question</option>
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
                      <br></br>
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
    // ← catch *all* clicks in here
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center justify-start gap-2 m-1 text-sm md:flex-col md:mt-2"
    >
      <button
        type="button"
        onClick={() => toggleSettings(index)} // ← only opens/closes settings
        className="px-4 py-1 mb-2 text-sm font-medium text-white rounded-lg bg-color-custom hover:bg-blue-400 focus:ring-4 focus:ring-blue-300"
      >
        <CiSettings className="inline-block w-6 h-6 text-white" />
      </button>

      <button
        type="button"
        onClick={() => handleDeleteQuestion(index)} // ← only deletes
        className="px-4 py-1 mb-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:ring-red-300"
      >
        <RiDeleteBin5Line className="inline-block w-6 h-6 text-white" />
      </button>
    </div>
  );
}

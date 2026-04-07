import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

const UpdateTranslationsModal = ({
  show,
  onHide,
  formId,
  defaultLanguageDescription,
  defaultLanguageSubtag,
}) => {
  const [labels, setLabels] = useState([]);
  const [updatedTranslations, setUpdatedTranslations] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  // Filter labels based on search query
  const filteredLabels = labels.filter(
    (label) =>
      (label.original || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      label.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (label.questionType &&
        label.questionType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate pagination based on filtered results
  const totalPages = Math.ceil(filteredLabels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLabels = filteredLabels.slice(startIndex, endIndex);
  const pageStart =
    filteredLabels.length === 0 ? 0 : Math.min(startIndex + 1, filteredLabels.length);
  const pageEnd = Math.min(endIndex, filteredLabels.length);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Ensure current page stays within bounds as results change
  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    const fetchFormDetails = async () => {
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
        const formDetails = response.data;
        const extractedLabels = [];

        formDetails.questions.forEach((question, questionIndex) => {
          const questionKey = `question_${questionIndex}_${
            question.name || questionIndex
          }`;
          extractedLabels.push({
            key: questionKey,
            original: question.label,
            updated:
              question.translations?.[defaultLanguageDescription] ||
              question.label,
            type: "question",
            questionType: question.type,
              questionIndex,
              path: `questions[${questionIndex}].label`,
              field: "label",
            });
          if (question.subQuestions) {
            question.subQuestions.forEach((subQuestion, subIndex) => {
              const subQuestionKey = `subquestion_${questionIndex}_${subIndex}_${
                subQuestion.name || subIndex
              }`;
              extractedLabels.push({
                key: subQuestionKey,
                original: subQuestion.label,
                updated:
                  subQuestion.translations?.[defaultLanguageDescription] ||
                  subQuestion.label,
                type: "subquestion",
                questionType: subQuestion.type,
                questionIndex,
                subQuestionIndex: subIndex,
                path: `questions[${questionIndex}].subQuestions[${subIndex}].label`,
                field: "label",
              });

              const existingSubHint =
                subQuestion.hints?.[defaultLanguageDescription];
              if (subQuestion.hint || existingSubHint) {
                extractedLabels.push({
                  key: `subquestion_hint_${questionIndex}_${subIndex}_${subQuestion.name || subIndex}`,
                  original: subQuestion.hint || "",
                  updated: existingSubHint || subQuestion.hint || "",
                  type: "hint",
                  questionType: subQuestion.type,
                  questionIndex,
                  subQuestionIndex: subIndex,
                  path: `questions[${questionIndex}].subQuestions[${subIndex}].hint`,
                  field: "hint",
                });
              }

              const existingSubGuidanceHint =
                subQuestion.guidance_hints?.[defaultLanguageDescription];
              if (subQuestion.guidance_hint || existingSubGuidanceHint) {
                extractedLabels.push({
                  key: `subquestion_guidance_hint_${questionIndex}_${subIndex}_${subQuestion.name || subIndex}`,
                  original: subQuestion.guidance_hint || "",
                  updated:
                    existingSubGuidanceHint ||
                    subQuestion.guidance_hint ||
                    "",
                  type: "guidance_hint",
                  questionType: subQuestion.type,
                  questionIndex,
                  subQuestionIndex: subIndex,
                  path: `questions[${questionIndex}].subQuestions[${subIndex}].guidance_hint`,
                  field: "guidance_hint",
                });
              }
            });
          }

          const existingQuestionHint = question.hints?.[defaultLanguageDescription];
          if (question.hint || existingQuestionHint) {
            extractedLabels.push({
              key: `question_hint_${questionIndex}_${question.name || questionIndex}`,
              original: question.hint || "",
              updated: existingQuestionHint || question.hint || "",
              type: "hint",
              questionType: question.type,
              questionIndex,
              path: `questions[${questionIndex}].hint`,
              field: "hint",
            });
          }

          const existingQuestionGuidanceHint =
            question.guidance_hints?.[defaultLanguageDescription];
          if (question.guidance_hint || existingQuestionGuidanceHint) {
            extractedLabels.push({
              key: `question_guidance_hint_${questionIndex}_${question.name || questionIndex}`,
              original: question.guidance_hint || "",
              updated:
                existingQuestionGuidanceHint || question.guidance_hint || "",
              type: "guidance_hint",
              questionType: question.type,
              questionIndex,
              path: `questions[${questionIndex}].guidance_hint`,
              field: "guidance_hint",
            });
          }

          // Add options/choices for select questions
          if (question.options && question.options.length > 0) {
            question.options.forEach((option, optionIndex) => {
              if (option.label) {
                const optionKey = `option_${questionIndex}_${optionIndex}_${
                  option.name || option.label
                }`;
                extractedLabels.push({
                  key: optionKey,
                  original: option.label,
                  updated:
                    option.translations?.[defaultLanguageDescription] ||
                    option.label,
                  type: "choice",
                  questionType: "choice_label",
                  questionIndex,
                  optionIndex,
                  path: `questions[${questionIndex}].options[${optionIndex}].label`,
                  field: "label",
                });
              }

              const existingOptionHint = option.hints?.[defaultLanguageDescription];
              if (option.hint || existingOptionHint) {
                const optionHintKey = `option_hint_${questionIndex}_${optionIndex}_${option.name || optionIndex}`;
                extractedLabels.push({
                  key: optionHintKey,
                  original: option.hint || "",
                  updated: existingOptionHint || option.hint || "",
                  type: "hint",
                  questionType: question.type,
                  questionIndex,
                  optionIndex,
                  path: `questions[${questionIndex}].options[${optionIndex}].hint`,
                  field: "hint",
                });
              }
            });
          }
        });

        setLabels(extractedLabels);
      } catch (error) {
        console.error("Error fetching form details:", error);
      }
    };

    if (show) {
      fetchFormDetails();
    }
  }, [show, formId, defaultLanguageDescription]);

  const handleTranslationChange = (key, value) => {
    setUpdatedTranslations((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveTranslations = async () => {
    try {
      const token = sessionStorage.getItem("authToken");

      // Validate that we have translations to save
      if (Object.keys(updatedTranslations).length === 0) {
        alert("No translations to save. Please make some changes first.");
        return;
      }

      const translationsMapping = {};
      const hintsMapping = {};
      const guidanceHintsMapping = {};
      labels.forEach((label) => {
        const updatedValue = updatedTranslations[label.key];
        if (updatedValue !== undefined && updatedValue !== label.original) {
          if (!label.original) {
            return;
          }

          if (label.field === "hint") {
            hintsMapping[label.original] = updatedValue;
          } else if (label.field === "guidance_hint") {
            guidanceHintsMapping[label.original] = updatedValue;
          } else {
            translationsMapping[label.original] = updatedValue;
          }
        }
      });

      if (
        Object.keys(translationsMapping).length === 0 &&
        Object.keys(hintsMapping).length === 0 &&
        Object.keys(guidanceHintsMapping).length === 0
      ) {
        alert("No valid translations to save. Please update at least one non-empty field.");
        return;
      }

      await axios.put(`${BACKEND_URL}/api/forms/${formId}/translations/`, {
        translations: translationsMapping,
        hints: hintsMapping,
        guidance_hints: guidanceHintsMapping,
        language_subtag: defaultLanguageSubtag,
      }, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      alert("Default language translations saved successfully!");
      onHide();
    } catch (error) {
      console.error("Error saving translations:", error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert("Failed to save translations. Please try again.");
      }
    }
  };

  const renderPaginationItems = () => {
    if (totalPages <= 1) return null;

    const paginationItems = [];
    const maxVisibleNumbers = 9;

    const createPageItem = (page) => (
      <Pagination.Item
        key={page}
        active={page === currentPage}
        onClick={() => setCurrentPage(page)}
      >
        {page}
      </Pagination.Item>
    );

    if (totalPages <= maxVisibleNumbers) {
      for (let page = 1; page <= totalPages; page += 1) {
        paginationItems.push(createPageItem(page));
      }
      return paginationItems;
    }

    const siblings = 2;
    const firstPage = 1;
    const lastPage = totalPages;
    let leftSibling = Math.max(firstPage + 1, currentPage - siblings);
    let rightSibling = Math.min(lastPage - 1, currentPage + siblings);

    const showLeftEllipsis = leftSibling > firstPage + 1;
    const showRightEllipsis = rightSibling < lastPage - 1;

    if (!showLeftEllipsis) {
      leftSibling = firstPage + 1;
      rightSibling = Math.min(
        firstPage + 1 + siblings * 2,
        lastPage - 1
      );
    }

    if (!showRightEllipsis) {
      leftSibling = Math.max(
        lastPage - 1 - siblings * 2,
        firstPage + 1
      );
      rightSibling = lastPage - 1;
    }

    paginationItems.push(createPageItem(firstPage));

    if (showLeftEllipsis) {
      paginationItems.push(
        <Pagination.Ellipsis key="start-ellipsis" disabled />
      );
    }

    for (let page = leftSibling; page <= rightSibling; page += 1) {
      paginationItems.push(createPageItem(page));
    }

    if (showRightEllipsis) {
      paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }

    paginationItems.push(createPageItem(lastPage));

    return paginationItems;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Update Default Language Translations</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Search Bar */}
        <div className="mb-4">
          <Form.Group controlId="translationSearch">
            <Form.Label className="h5">🔍 Search Questions & Labels</Form.Label>
            <div className="gap-2 d-flex">
              <Form.Control
                type="text"
                size="lg"
                placeholder="Search by question text, type, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shadow-sm"
              />
              {searchQuery && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </Button>
              )}
            </div>
            <div className="mt-2 d-flex justify-content-between">
              <small className="text-muted">
                {searchQuery ? (
                  <>
                    Found {filteredLabels.length} of {labels.length} items
                    matching "{searchQuery}"
                  </>
                ) : (
                  <>Showing all {labels.length} translatable items</>
                )}
              </small>
              {searchQuery && filteredLabels.length === 0 && (
                <small className="text-warning">
                  No matches found. Try different keywords.
                </small>
              )}
            </div>
          </Form.Group>
        </div>

        <div className="mb-3 alert alert-info">
          <strong>Editing Default Language:</strong>{" "}
          {defaultLanguageDescription}
          <br />
          <small>
            These updates map to both <code>label::{defaultLanguageDescription}</code>{" "}
            and <code>hint::{defaultLanguageDescription}</code> in XLSForm, plus
            guidance hints in the <code>guidance_hint</code> column.
          </small>
        </div>

        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th style={{ width: "40%" }}>Original Text</th>
              <th style={{ width: "60%" }}>
                {defaultLanguageDescription} Translation
                <br />
                <small className="text-muted">
                  label::{defaultLanguageDescription}
                </small>
              </th>
            </tr>
          </thead>
          <tbody>
            {labels.length === 0 ? (
              <tr>
                <td colSpan="2" className="py-4 text-center text-muted">
                  <div>
                    📝 No translatable content found
                    <br />
                    <small>
                      Add questions to your form to enable translations
                    </small>
                  </div>
                </td>
              </tr>
            ) : (
              currentLabels.map((label, index) => (
                <tr key={label.key}>
                  <td>
                    <div>
                      <strong>{label.original || "(empty source text)"}</strong>
                      <br />
                      <small className="text-muted">
                        {label.type === "question" && (
                          <span className="badge bg-primary">
                            Question ({label.questionType})
                          </span>
                        )}
                        {label.type === "subquestion" && (
                          <span className="badge bg-secondary">
                            Sub-question ({label.questionType})
                          </span>
                        )}
                        {label.type === "choice" && (
                          <span className="badge bg-success">
                            Choice Option
                          </span>
                        )}
                        {label.type === "hint" && (
                          <span className="badge bg-info text-dark">Hint</span>
                        )}
                        {label.type === "guidance_hint" && (
                          <span className="badge bg-warning text-dark">
                            Guidance Hint
                          </span>
                        )}
                        <span className="text-muted ms-2">{label.path}</span>
                      </small>
                    </div>
                  </td>
                  <td>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={
                        updatedTranslations[label.key] !== undefined
                          ? updatedTranslations[label.key]
                          : label.updated
                      }
                      onChange={(e) =>
                        handleTranslationChange(label.key, e.target.value)
                      }
                      placeholder={
                        label.field === "hint"
                          ? `Enter ${defaultLanguageDescription} hint...`
                          : label.field === "guidance_hint"
                            ? `Enter ${defaultLanguageDescription} guidance hint...`
                            : `Enter ${defaultLanguageDescription} translation...`
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination Controls */}
        {filteredLabels.length > itemsPerPage && (
          <div className="mt-3 d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {pageStart}-{pageEnd} of {filteredLabels.length}{" "}
              {searchQuery ? "filtered" : ""} translations
            </small>
            <Pagination size="sm" className="mb-0">
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              />

              {/* Condensed pagination numbers */}
              {renderPaginationItems()}

              <Pagination.Next
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100">
          <div className="mb-2 text-muted small">
            💡 <strong>Tip:</strong> Use clear, concise translations. These will
            appear to enumerators during data collection.
          </div>
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTranslations}>
              💾 Save Default Language Translations
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateTranslationsModal;

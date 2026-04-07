import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Pagination } from "react-bootstrap";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

const UpdateOtherTranslationsModal = ({
  show,
  onHide,
  formId,
  languageDescription,
  languageSubtag,
}) => {
  const [labels, setLabels] = useState([]);
  const [updatedTranslations, setUpdatedTranslations] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  // Filter labels based on search query
  const filteredLabels = labels.filter(
    (label) =>
      label.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      label.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (label.questionType &&
        label.questionType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate pagination based on filtered results
  const totalPages = Math.ceil(filteredLabels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLabels = filteredLabels.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate translation progress
  const getTranslationProgress = () => {
    if (labels.length === 0) return 0;
    const translatedCount = labels.filter((label) => {
      const currentTranslation =
        updatedTranslations[label.key] !== undefined
          ? updatedTranslations[label.key]
          : label.updated;
      return (
        currentTranslation &&
        currentTranslation.trim() !== "" &&
        currentTranslation !== label.original
      );
    }).length;
    return Math.round((translatedCount / labels.length) * 100);
  };

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        console.log(
          `Fetching translations for language: ${languageDescription} (${languageSubtag})`
        );
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(
          `${BACKEND_URL}/api/forms/${formId}/`,
          {
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

          // Debug: Log the available translations
          console.log(
            `Question ${questionIndex} translations:`,
            question.translations
          );
          console.log(`Looking for language: "${languageDescription}"`);

          const currentTranslation =
            question.translations?.[languageDescription] || question.label;
          console.log(
            `Question ${questionIndex}: Original="${question.label}", Translation="${currentTranslation}"`
          );

          extractedLabels.push({
            key: questionKey,
            original: question.label,
            updated: currentTranslation,
            type: "question",
            questionType: question.type,
            questionIndex,
            path: `questions[${questionIndex}].label`,
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
                  subQuestion.translations?.[languageDescription] ||
                  subQuestion.label,
                type: "subquestion",
                questionType: subQuestion.type,
                questionIndex,
                subQuestionIndex: subIndex,
                path: `questions[${questionIndex}].subQuestions[${subIndex}].label`,
              });
            });
          }
          // Add options/choices for select questions
          if (question.options && question.options.length > 0) {
            question.options.forEach((option, optionIndex) => {
              if (option.label) {
                // Debug: Log option translations
                console.log(
                  `Option ${optionIndex} translations:`,
                  option.translations
                );

                const optionKey = `option_${questionIndex}_${optionIndex}_${
                  option.name || option.label
                }`;
                extractedLabels.push({
                  key: optionKey,
                  original: option.label,
                  updated:
                    option.translations?.[languageDescription] || option.label,
                  type: "choice",
                  questionType: "choice_label",
                  questionIndex,
                  optionIndex,
                  path: `questions[${questionIndex}].options[${optionIndex}].label`,
                });
              }
            });
          }
        });

        setLabels(extractedLabels);
        // Reset translations state when language changes
        setUpdatedTranslations({});
      } catch (error) {
        console.error("Error fetching form details:", error);
      }
    };

    if (show) {
      fetchFormDetails();
    }
  }, [show, formId, languageDescription, languageSubtag]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!show) {
      setLabels([]);
      setUpdatedTranslations({});
    }
  }, [show]);

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

      // Fetch form details to get the current translations
      const formResponse = await axios.get(
        `${BACKEND_URL}/api/forms/${formId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      const formDetails = formResponse.data;

      // Create a mapping of original text to translated text for the backend
      const translationsMapping = {};
      labels.forEach((label) => {
        const updatedValue = updatedTranslations[label.key];
        if (updatedValue !== undefined && updatedValue !== label.original) {
          translationsMapping[label.original] = updatedValue;
        }
      });

      // Update the translations field for other languages
      const translationsPayload = {
        translations: translationsMapping,
        language_subtag: languageSubtag,
      };

      console.log("Sending translations payload:", translationsPayload);

      await axios.put(
        `${BACKEND_URL}/api/forms/${formId}/translations/`,
        translationsPayload,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Translations saved successfully!");
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

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Update {languageDescription} Translations</Modal.Title>
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

        <div className="mb-3 alert alert-warning">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>🌐 Currently Editing:</strong>
              <span className="badge bg-primary ms-2">
                {languageDescription} ({languageSubtag})
              </span>
              <br />
              <small>
                These translations will appear in your XLSForm as: label::
                {languageDescription}
              </small>
              <br />
              <small className="text-muted">
                Enumerators will be able to switch to this language during data
                collection.
              </small>
            </div>
            <div className="text-end">
              <div
                className="progress"
                style={{ width: "100px", height: "20px" }}
              >
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${getTranslationProgress()}%` }}
                  aria-valuenow={getTranslationProgress()}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {getTranslationProgress()}%
                </div>
              </div>
              <small className="text-muted">Translation Progress</small>
            </div>
          </div>
        </div>

        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th style={{ width: "40%" }}>Original Text (Default Language)</th>
              <th style={{ width: "60%" }}>
                {languageDescription} Translation
                <br />
                <small className="text-muted">
                  label::{languageDescription}
                </small>
              </th>
            </tr>
          </thead>
          <tbody>
            {labels.length === 0 ? (
              <tr>
                <td colSpan="2" className="py-4 text-center text-muted">
                  <div>
                    🌐 No translatable content found
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
                      <strong>{label.original}</strong>
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
                      placeholder={`Enter ${languageDescription} translation...`}
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
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredLabels.length)} of{" "}
              {filteredLabels.length} {searchQuery ? "filtered" : ""}{" "}
              translations
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

              {/* Show page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                )
              )}

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
            🌐 <strong>Multi-language Tip:</strong> Ensure translations maintain
            the same meaning as the original text. Enumerators can switch
            languages during data collection.
          </div>
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTranslations}>
              💾 Save {languageDescription} Translations
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateOtherTranslationsModal;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { BACKEND_URL } from "../config";

const ManageTranslationsModalBase = ({
  show,
  onHide,
  formId,
  onSave,
  UpdateTranslationsComponent,
  UpdateOtherTranslationsComponent,
}) => {
  const UNFILTERED_LANGUAGE_LIMIT = 120;

  const [languages, setLanguages] = useState([]);
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [otherLanguages, setOtherLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [defaultLanguageSearch, setDefaultLanguageSearch] = useState("");
  const [otherLanguageSearch, setOtherLanguageSearch] = useState("");

  const [showUpdateTranslationsModal, setShowUpdateTranslationsModal] =
    useState(false);
  const [showUpdateOtherTranslationsModal, setShowUpdateOtherTranslationsModal] =
    useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const fetchData = useCallback(async () => {
    if (!formId) {
      return;
    }

    setLoading(true);
    setFetchError("");

    try {
      const token = sessionStorage.getItem("authToken");
      const headers = { Authorization: `Token ${token}` };

      const [languagesRes, formRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/languages/`, { headers }),
        axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          params: { include_submissions: "false" },
          headers,
        }),
      ]);

      const formData = formRes.data || {};
      const langList = Array.isArray(languagesRes.data)
        ? [...languagesRes.data]
            .filter(
              (language) =>
                language &&
                typeof language.id === "number" &&
                typeof language.description === "string" &&
                typeof language.subtag === "string"
            )
            .sort((a, b) => {
              const byName = a.description.localeCompare(b.description);
              if (byName !== 0) {
                return byName;
              }
              return a.subtag.localeCompare(b.subtag);
            })
        : [];

      setLanguages(langList);
      setDefaultLanguage(
        formData.default_language ? Number(formData.default_language) : ""
      );
      setOtherLanguages(
        Array.isArray(formData.other_languages)
          ? formData.other_languages.map((id) => Number(id))
          : []
      );
    } catch (error) {
      console.error("Error loading translation settings:", error);
      setFetchError("Could not load translation settings. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show, fetchData]);

  const selectedDefaultLanguage = useMemo(
    () => languages.find((language) => language.id === Number(defaultLanguage)),
    [languages, defaultLanguage]
  );

  const selectedOtherLanguages = useMemo(
    () =>
      otherLanguages
        .map((id) => languages.find((language) => language.id === Number(id)))
        .filter(Boolean),
    [languages, otherLanguages]
  );

  const filteredDefaultLanguages = useMemo(() => {
    const query = defaultLanguageSearch.trim().toLowerCase();
    const filtered = languages.filter(
      (language) =>
        language.description.toLowerCase().includes(query) ||
        language.subtag.toLowerCase().includes(query)
    );

    if (query) {
      return filtered;
    }

    const selectedId = Number(defaultLanguage);
    const selected = filtered.find((language) => language.id === selectedId);
    const limited = filtered.slice(0, UNFILTERED_LANGUAGE_LIMIT);

    if (selected && !limited.some((language) => language.id === selected.id)) {
      return [selected, ...limited];
    }
    return limited;
  }, [languages, defaultLanguageSearch, defaultLanguage]);

  const filteredOtherLanguages = useMemo(() => {
    const query = otherLanguageSearch.trim().toLowerCase();
    const available = languages.filter(
      (language) => language.id !== Number(defaultLanguage)
    );

    const filtered = available.filter(
      (language) =>
        language.description.toLowerCase().includes(query) ||
        language.subtag.toLowerCase().includes(query)
    );

    if (query) {
      return filtered;
    }

    const selectedSet = new Set(otherLanguages.map((languageId) => Number(languageId)));
    const selected = filtered.filter((language) => selectedSet.has(language.id));
    const limited = filtered
      .filter((language) => !selectedSet.has(language.id))
      .slice(0, UNFILTERED_LANGUAGE_LIMIT);

    return [...selected, ...limited];
  }, [languages, defaultLanguage, otherLanguageSearch, otherLanguages]);

  const handleDefaultLanguageChange = (event) => {
    const nextDefault = event.target.value ? Number(event.target.value) : "";
    const previousDefault = defaultLanguage ? Number(defaultLanguage) : null;

    setDefaultLanguage(nextDefault);
    setOtherLanguages((prev) => {
      const cleaned = prev
        .map((languageId) => Number(languageId))
        .filter((languageId) => languageId !== Number(nextDefault));

      if (
        previousDefault &&
        nextDefault &&
        previousDefault !== Number(nextDefault) &&
        !cleaned.includes(previousDefault)
      ) {
        cleaned.push(previousDefault);
      }

      return cleaned;
    });
    setSaveError("");
    setSaveSuccess("");
  };

  const handleOtherLanguagesChange = (event) => {
    const selectedIds = Array.from(event.target.selectedOptions, (option) =>
      Number(option.value)
    ).filter((id) => id !== Number(defaultLanguage));

    setOtherLanguages(selectedIds);
    setSaveError("");
    setSaveSuccess("");
  };

  const promoteAdditionalLanguageToDefault = (languageId) => {
    const nextDefault = Number(languageId);
    if (!nextDefault || nextDefault === Number(defaultLanguage)) {
      return;
    }

    const previousDefault = defaultLanguage ? Number(defaultLanguage) : null;
    setDefaultLanguage(nextDefault);
    setOtherLanguages((prev) => {
      const cleaned = prev
        .map((id) => Number(id))
        .filter((id) => id !== nextDefault);

      if (
        previousDefault &&
        previousDefault !== nextDefault &&
        !cleaned.includes(previousDefault)
      ) {
        cleaned.push(previousDefault);
      }

      return cleaned;
    });
    setSaveError("");
    setSaveSuccess("");
  };

  const saveLanguageSettings = async () => {
    if (!defaultLanguage) {
      setSaveError("Please choose a default language before saving.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const token = sessionStorage.getItem("authToken");
      const payload = {
        default_language: Number(defaultLanguage),
        other_languages: otherLanguages,
      };

      await axios.patch(`${BACKEND_URL}/api/forms/${formId}/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });

      setSaveSuccess("Translation language settings updated.");
      if (typeof onSave === "function") {
        onSave();
      }
      await fetchData();
    } catch (error) {
      console.error("Error saving language settings:", error);
      const backendMessage =
        error?.response?.data?.error || "Failed to save language settings.";
      setSaveError(backendMessage);
    } finally {
      setSaving(false);
    }
  };

  const openTranslationEditor = (language) => {
    setSelectedLanguage(language);
    setShowUpdateTranslationsModal(false);
    setShowUpdateOtherTranslationsModal(false);

    if (language.id === Number(defaultLanguage)) {
      setShowUpdateTranslationsModal(true);
    } else {
      setShowUpdateOtherTranslationsModal(true);
    }
  };

  const closeAll = () => {
    setFetchError("");
    setSaveError("");
    setSaveSuccess("");
    onHide();
  };

  const DefaultTranslationModal = UpdateTranslationsComponent;
  const OtherTranslationModal = UpdateOtherTranslationsComponent;

  return (
    <>
      <Modal show={show} onHide={closeAll} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Manage Translations</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading language configuration...
            </div>
          ) : (
            <>
              {fetchError && <Alert variant="danger">{fetchError}</Alert>}
              {saveError && <Alert variant="danger">{saveError}</Alert>}
              {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}

              <Alert variant="light" className="border">
                <div className="fw-semibold">Multi-Language Form Support</div>
                <div className="small text-muted">
                  XLSForm columns use this format: <code>label::English (en)</code>,{" "}
                  <code>label::French (fr)</code>.
                </div>
              </Alert>

              <div className="row g-3">
                <div className="col-lg-6">
                  <Card className="h-100 border">
                    <Card.Body>
                      <Card.Title className="h6">Default Language</Card.Title>
                      <Card.Text className="small text-muted">
                        Primary language used for your form labels and hints.
                      </Card.Text>

                      <Form.Group className="mb-2">
                        <Form.Label className="small">Search language</Form.Label>
                        <Form.Control
                          type="text"
                          value={defaultLanguageSearch}
                          onChange={(event) =>
                            setDefaultLanguageSearch(event.target.value)
                          }
                          placeholder="Type name or code"
                        />
                      </Form.Group>

                      <Form.Select
                        value={defaultLanguage}
                        onChange={handleDefaultLanguageChange}
                      >
                        <option value="">Select default language</option>
                        {filteredDefaultLanguages.map((language) => (
                          <option key={language.id} value={language.id}>
                            {language.description} ({language.subtag})
                          </option>
                        ))}
                      </Form.Select>

                      {defaultLanguageSearch.trim() === "" &&
                        languages.length > filteredDefaultLanguages.length && (
                          <div className="mt-1 small text-muted">
                            Showing top {UNFILTERED_LANGUAGE_LIMIT} languages. Use search to find any language.
                          </div>
                        )}

                      {selectedDefaultLanguage && (
                        <div className="mt-3 p-2 bg-light border rounded small">
                          <div>
                            <span className="fw-semibold">Current:</span>{" "}
                            {selectedDefaultLanguage.description} ({selectedDefaultLanguage.subtag})
                          </div>
                          <div className="text-muted">
                            XLSForm: label::{selectedDefaultLanguage.description} (
                            {selectedDefaultLanguage.subtag})
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>

                <div className="col-lg-6">
                  <Card className="h-100 border">
                    <Card.Body>
                      <Card.Title className="h6">Additional Languages</Card.Title>
                      <Card.Text className="small text-muted">
                        Optional languages available during data collection.
                      </Card.Text>

                      <Form.Group className="mb-2">
                        <Form.Label className="small">Search languages</Form.Label>
                        <Form.Control
                          type="text"
                          value={otherLanguageSearch}
                          onChange={(event) =>
                            setOtherLanguageSearch(event.target.value)
                          }
                          placeholder="Type name or code"
                        />
                      </Form.Group>

                      <Form.Select
                        multiple
                        value={otherLanguages}
                        onChange={handleOtherLanguagesChange}
                        style={{ minHeight: "180px" }}
                      >
                        {filteredOtherLanguages.map((language) => (
                          <option key={language.id} value={language.id}>
                            {language.description} ({language.subtag})
                          </option>
                        ))}
                      </Form.Select>

                      <div className="mt-2 small text-muted">
                        Hold Ctrl/Cmd to select multiple languages.
                      </div>

                      {otherLanguageSearch.trim() === "" &&
                        languages.length > filteredOtherLanguages.length + 1 && (
                          <div className="mt-1 small text-muted">
                            Showing top {UNFILTERED_LANGUAGE_LIMIT} languages. Use search to find more.
                          </div>
                        )}

                      {selectedOtherLanguages.length > 0 && (
                        <div className="mt-3">
                          <div className="mb-2 small fw-semibold">
                            Promote Additional Language To Default
                          </div>
                          <div className="gap-2 d-flex flex-wrap">
                            {selectedOtherLanguages.map((language) => (
                              <div
                                key={language.id}
                                className="px-2 py-1 border rounded d-flex align-items-center gap-2 bg-light"
                              >
                                <span className="small">
                                  {language.description} ({language.subtag})
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() =>
                                    promoteAdditionalLanguageToDefault(language.id)
                                  }
                                >
                                  Make Default
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between mt-3 mb-4">
                <div className="small text-muted">
                  Selected additional languages: {selectedOtherLanguages.length}
                </div>
                <Button
                  variant="primary"
                  onClick={saveLanguageSettings}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Language Settings"}
                </Button>
              </div>

              <Card className="border">
                <Card.Body>
                  <Card.Title className="h6">Update Translations</Card.Title>
                  <Card.Text className="small text-muted">
                    Edit labels, hints, and choices for each configured language.
                  </Card.Text>

                  {!selectedDefaultLanguage ? (
                    <Alert variant="warning" className="mb-0">
                      Set and save a default language first.
                    </Alert>
                  ) : (
                    <>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <Button
                          variant="dark"
                          onClick={() =>
                            openTranslationEditor(selectedDefaultLanguage)
                          }
                        >
                          Edit Default ({selectedDefaultLanguage.subtag})
                        </Button>

                        {selectedOtherLanguages.map((language) => (
                          <Button
                            key={language.id}
                            variant="outline-secondary"
                            onClick={() => openTranslationEditor(language)}
                          >
                            Translate {language.description} ({language.subtag})
                          </Button>
                        ))}
                      </div>

                      <div className="small text-muted">
                        Active languages:{" "}
                        <Badge bg="secondary" className="me-1">
                          {selectedDefaultLanguage.description} (
                          {selectedDefaultLanguage.subtag})
                        </Badge>
                        {selectedOtherLanguages.map((language) => (
                          <Badge bg="light" text="dark" className="me-1" key={language.id}>
                            {language.description} ({language.subtag})
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={closeAll}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {selectedLanguage && DefaultTranslationModal && (
        <DefaultTranslationModal
          key={`default-${selectedLanguage.id}-${selectedLanguage.subtag}`}
          show={showUpdateTranslationsModal}
          onHide={() => setShowUpdateTranslationsModal(false)}
          formId={formId}
          defaultLanguageDescription={`${selectedLanguage.description} (${selectedLanguage.subtag})`}
          defaultLanguageSubtag={selectedLanguage.subtag}
        />
      )}

      {selectedLanguage && OtherTranslationModal && (
        <OtherTranslationModal
          key={`other-${selectedLanguage.id}-${selectedLanguage.subtag}`}
          show={showUpdateOtherTranslationsModal}
          onHide={() => setShowUpdateOtherTranslationsModal(false)}
          formId={formId}
          languageDescription={`${selectedLanguage.description} (${selectedLanguage.subtag})`}
          languageSubtag={selectedLanguage.subtag}
        />
      )}
    </>
  );
};

export default ManageTranslationsModalBase;

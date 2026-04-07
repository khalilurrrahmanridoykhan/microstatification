import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import axios from 'axios';
import { BACKEND_URL } from '../../../../config';

const UpdateOtherTranslationsModal = ({ show, onHide, formId, languageDescription, languageSubtag }) => {
  const [labels, setLabels] = useState([]);
  const [updatedTranslations, setUpdatedTranslations] = useState({});

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        const formDetails = response.data;
        const extractedLabels = [];

        formDetails.questions.forEach((question) => {
          extractedLabels.push({ original: question.label, updated: question.translations?.[languageDescription] || question.label });
          if (question.subQuestions) {
            question.subQuestions.forEach((subQuestion) => {
              extractedLabels.push({ original: subQuestion.label, updated: subQuestion.translations?.[languageDescription] || subQuestion.label });
            });
          }
        });

        setLabels(extractedLabels);
      } catch (error) {
        console.error('Error fetching form details:', error);
      }
    };

    if (show) {
      fetchFormDetails();
    }
  }, [show, formId, languageDescription]);

  const handleTranslationChange = (original, value) => {
    setUpdatedTranslations((prev) => ({
      ...prev,
      [original]: value
    }));
  };

  const handleSaveTranslations = async () => {
    try {
      const token = sessionStorage.getItem('authToken');

      // Fetch form details to get the current translations
      const formResponse = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const formDetails = formResponse.data;

      // Update the translations field for other languages
      const translationsPayload = {
        translations: updatedTranslations,
        language_subtag: languageSubtag
      };

      await axios.put(`${BACKEND_URL}/api/forms/${formId}/translations/`, translationsPayload, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      onHide();
    } catch (error) {
      console.error('Error saving translations:', error);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Update other Translations for {languageDescription}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Original String</th>
              <th>{languageDescription} Updated Text</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, index) => (
              <tr key={index}>
                <td>{label.original}</td>
                <td>
                  <Form.Control
                    type="text"
                    value={updatedTranslations[label.original] !== undefined ? updatedTranslations[label.original] : label.updated}
                    onChange={(e) => handleTranslationChange(label.original, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="primary" onClick={handleSaveTranslations}>Save Translations</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateOtherTranslationsModal;
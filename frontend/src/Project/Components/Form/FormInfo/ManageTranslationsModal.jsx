import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import UpdateTranslationsModal from './UpdateTranslationsModal';
import UpdateOtherTranslationsModal from './UpdateOtherTranslationsModal';
import { BACKEND_URL } from '../../../../config';


const ManageTranslationsModal = ({ show, onHide, formId, onSave }) => {
  const [languages, setLanguages] = useState([]);
  const [defaultLanguage, setDefaultLanguage] = useState('');
  const [defaultLanguageCode, setDefaultLanguageCode] = useState('');
  const [otherLanguages, setOtherLanguages] = useState([]);
  const [formDetails, setFormDetails] = useState({});
  const [showOtherLanguagesForm, setShowOtherLanguagesForm] = useState(false);
  const [showEditDefaultLanguageForm, setShowEditDefaultLanguageForm] = useState(false);
  const [showEditOtherLanguagesForm, setShowEditOtherLanguagesForm] = useState(false);
  const [showUpdateTranslationsModal, setShowUpdateTranslationsModal] = useState(false);
  const [showUpdateOtherTranslationsModal, setShowUpdateOtherTranslationsModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`${BACKEND_URL}/api/languages/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        setLanguages(response.data);
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };

    const fetchFormDetails = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        setFormDetails(response.data);
        setDefaultLanguage(response.data.default_language);
        setOtherLanguages(response.data.other_languages || []);
        // Set default language code based on the fetched default language
        const selectedLanguage = response.data.default_language && languages.find(language => language.id === response.data.default_language);
        if (selectedLanguage) {
          setDefaultLanguageCode(selectedLanguage.subtag);
        }
      } catch (error) {
        console.error('Error fetching form details:', error);
      }
    };

    fetchLanguages();
    fetchFormDetails();
  }, [formId]);

  const handleLanguageChange = (e) => {
    const selectedLanguageId = e.target.value;
    setDefaultLanguage(selectedLanguageId);
    const selectedLanguage = languages.find(language => language.id === parseInt(selectedLanguageId));
    if (selectedLanguage) {
      setDefaultLanguageCode(selectedLanguage.subtag);
    }
  };

  const handleLanguageCodeChange = (e) => {
    const selectedLanguageCode = e.target.value;
    setDefaultLanguageCode(selectedLanguageCode);
    const selectedLanguage = languages.find(language => language.subtag === selectedLanguageCode);
    if (selectedLanguage) {
      setDefaultLanguage(selectedLanguage.id);
    }
  };

  const handleOtherLanguagesChange = (e) => {
    const selectedLanguageIds = Array.from(e.target.selectedOptions, option => option.value);
    setOtherLanguages(selectedLanguageIds);
  };

  const handleSaveDefaultLanguage = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const payload = {
        ...formDetails,
        default_language: defaultLanguage,
        update_default_language: true // Add this flag to indicate updating default language
      };
      console.log('Request Payload:', payload); // Log the request payload
      await axios.put(`${BACKEND_URL}/api/forms/${formId}/`, payload, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      onSave();
      setShowEditDefaultLanguageForm(false); // Hide the form after saving
    } catch (error) {
      console.error('Error saving default language:', error);
      console.error('Server Response:', error.response.data); // Log the server response
    }
  };

  const handleSaveOtherLanguages = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const payload = {
        ...formDetails,
        default_language: defaultLanguage, // Ensure default_language is included in the payload
        other_languages: otherLanguages
      };
      console.log('Request Payload:', payload); // Log the request payload
      await axios.put(`${BACKEND_URL}/api/forms/${formId}/`, payload, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      onSave();
      setShowEditOtherLanguagesForm(false); // Hide the form after saving
    } catch (error) {
      console.error('Error saving other languages:', error);
      console.error('Server Response:', error.response.data); // Log the server response
    }
  };

  const handleClose = () => {
    onHide();
    setShowEditDefaultLanguageForm(false); // Reset the form visibility when modal is closed
    setShowEditOtherLanguagesForm(false); // Reset the form visibility when modal is closed
  };

  const handleUpdateTranslations = (language) => {
    setSelectedLanguage(language);
    if (language.id === parseInt(defaultLanguage)) {
      setShowUpdateTranslationsModal(true);
    } else {
      setShowUpdateOtherTranslationsModal(true);
    }
  };

  const selectedDefaultLanguage = languages.find(language => language.id === parseInt(defaultLanguage));
  const selectedOtherLanguages = otherLanguages.map(id => languages.find(language => language.id === parseInt(id))).filter(Boolean);

  // Filter out the default language from the list of available other languages
  const availableOtherLanguages = languages.filter(language => language.id !== parseInt(defaultLanguage));

  return (
    <>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Manage Translations</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please name your default language before adding languages and translations.</p>
          {selectedDefaultLanguage && (
            <p>
              The default Language: {selectedDefaultLanguage.description} ({selectedDefaultLanguage.subtag})
            </p>
          )}
          {defaultLanguage && !showEditDefaultLanguageForm ? (
            <Button variant="secondary" onClick={() => setShowEditDefaultLanguageForm(true)}>Edit Default Language</Button>
          ) : (
            <Form>
              <Form.Group controlId="defaultLanguage">
                <Form.Label>Default Language Name</Form.Label>
                <Form.Control as="select" value={defaultLanguage} onChange={handleLanguageChange}>
                  <option value="">Select Language</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>{language.description}</option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group controlId="defaultLanguageCode">
                <Form.Label>Default Language Code</Form.Label>
                <Form.Control as="select" value={defaultLanguageCode} onChange={handleLanguageCodeChange}>
                  <option value="">Select Language Code</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.subtag}>{language.subtag}</option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Button variant="primary" onClick={handleSaveDefaultLanguage}>Save Default Language</Button>
            </Form>
          )}
          <hr />
          {selectedOtherLanguages.length > 0 ? (
            <p>
              Other Languages: {selectedOtherLanguages.map(lang => `${lang.description} (${lang.subtag})`).join(', ')}
            </p>
          ) : (
            <p>Other Languages:</p>
          )}
          {otherLanguages.length > 0 && !showEditOtherLanguagesForm ? (
            <Button variant="secondary" onClick={() => setShowEditOtherLanguagesForm(true)}>Edit Other Languages</Button>
          ) : (
            <Form>
              <Form.Group controlId="otherLanguages">
                <Form.Label>Other Languages</Form.Label>
                <Form.Control as="select" multiple value={otherLanguages} onChange={handleOtherLanguagesChange}>
                  {availableOtherLanguages.map((language) => (
                    <option key={language.id} value={language.id}>{language.description}</option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Button variant="primary" onClick={handleSaveOtherLanguages}>Save Other Languages</Button>
            </Form>
          )}
          <hr />
          <Button variant="primary" onClick={() => handleUpdateTranslations(selectedDefaultLanguage)}>
            Update Default Translation
          </Button>
          {selectedOtherLanguages.map((language) => (
            <div key={language.id}>
              <Button variant="primary" onClick={() => handleUpdateTranslations(language)}>
                Update Translation for {language.description} ({language.subtag})
              </Button>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
      {selectedLanguage && (
        <>
          <UpdateTranslationsModal
            show={showUpdateTranslationsModal}
            onHide={() => setShowUpdateTranslationsModal(false)}
            formId={formId}
            defaultLanguageDescription={selectedLanguage.description}
            defaultLanguageSubtag={selectedLanguage.subtag}
          />
          <UpdateOtherTranslationsModal
            show={showUpdateOtherTranslationsModal}
            onHide={() => setShowUpdateOtherTranslationsModal(false)}
            formId={formId}
            languageDescription={selectedLanguage.description}
            languageSubtag={selectedLanguage.subtag}
          />
        </>
      )}
    </>
  );
};

export default ManageTranslationsModal;
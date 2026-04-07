import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faEye, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import './css/Form.css'; // Import the CSS file
import ManageTranslationsModal from './ManageTranslationsModal';

const Form = () => {
  const navigate = useNavigate();
  const { projectId, formId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTranslationsModal, setShowTranslationsModal] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleEdit = () => {
    navigate(`/projects/${projectId}/edit_form/${formId}`);
  };

  const handleDownloadXLS = () => {
    // Implement download XLS functionality
    console.log('Download XLS');
  };

  const handleDownloadXML = () => {
    // Implement download XML functionality
    console.log('Download XML');
  };

  const handleShareProject = () => {
    // Implement share project functionality
    console.log('Share Project');
  };

  const handleCloneProject = () => {
    // Implement clone project functionality
    console.log('Clone Project');
  };

  const handleManageTranslations = () => {
    setShowTranslationsModal(true);
  };

  const handleSaveTranslations = () => {
    // Implement any additional logic after saving translations
    console.log('Translations saved');
  };

  return (
    <div className="d-flex justify-content-end align-items-center">
      <FontAwesomeIcon icon={faEdit} className="icon-spacing" onClick={handleEdit} style={{ cursor: 'pointer' }} />
      <FontAwesomeIcon icon={faEye} className="icon-spacing" style={{ cursor: 'pointer' }} />
      <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} className="dropdown-custom">
        <DropdownToggle tag="span" data-toggle="dropdown" aria-expanded={dropdownOpen}>
          <FontAwesomeIcon icon={faEllipsisV} style={{ cursor: 'pointer' }} />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem onClick={handleDownloadXLS}>Download XLS</DropdownItem>
          <DropdownItem onClick={handleDownloadXML}>Download XML</DropdownItem>
          <DropdownItem onClick={handleShareProject}>Share the Project</DropdownItem>
          <DropdownItem onClick={handleCloneProject}>Clone the Project</DropdownItem>
          <DropdownItem onClick={handleManageTranslations}>Manage Translations</DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <ManageTranslationsModal
        show={showTranslationsModal}
        onHide={() => setShowTranslationsModal(false)}
        formId={formId}
        onSave={handleSaveTranslations}
      />
    </div>
  );
};

export default Form;
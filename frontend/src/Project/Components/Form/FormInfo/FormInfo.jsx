import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Tabs, Tab } from 'react-bootstrap';
import Summary from './Summary';
import Form from './Form';
import Data from './Data';
import Settings from './Settings';
import { BACKEND_URL } from '../../../../config';

const FormInfo = () => {
  const { projectId, formId } = useParams();
  const [form, setForm] = useState({});
  const [key, setKey] = useState('summary');

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        setForm(response.data);
      } catch (error) {
        console.error('Error fetching form:', error);
      }
    };

    fetchForm();
  }, [formId]);

  return (
    <div className="container mt-5">
      <h2>Form Info: {form.name}</h2>
      <Tabs id="form-info-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
        <Tab eventKey="summary" title="Summary">
          <Summary />
        </Tab>
        <Tab eventKey="form" title="Form">
          <Form />
        </Tab>
        <Tab eventKey="data" title="Data">
          <Data />
        </Tab>
        <Tab eventKey="settings" title="Settings">
          <Settings />
        </Tab>
      </Tabs>
    </div>
  );
};

export default FormInfo;
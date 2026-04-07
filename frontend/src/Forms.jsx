import React, { useEffect, useState } from 'react';
import { fetchForms } from './api';

const Forms = () => {
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const getForms = async () => {
      const response = await fetchForms();
      setForms(response.data);
    };
    getForms();
  }, []);

  return (
    <div>
      <h2>Forms</h2>
      <ul>
        {forms.map((form) => (
          <li key={form.id}>{form.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Forms;
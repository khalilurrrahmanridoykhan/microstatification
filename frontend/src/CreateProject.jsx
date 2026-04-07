import React, { useState } from 'react';
import { createProject } from './api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'sonner';

const CreateProject = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProject({ name, description });
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Create Project</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Description:</label>
          <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">Create Project</button>
      </form>
    </div>
  );
};

export default CreateProject;
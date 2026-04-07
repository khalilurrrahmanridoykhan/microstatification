import React from 'react';

const Option = ({ option, index, onChange }) => {
  const handleLabelChange = (e) => {
    const label = e.target.value;
    const name = label.toLowerCase().replace(/[^a-z0-9-._:]/g, '_');
    onChange('label', label);
    onChange('name', name);
  };

  return (
    <div className="mb-2">
      <input
        type="text"
        className="form-control mb-2"
        value={option.label}
        onChange={handleLabelChange}
        placeholder="Option Label"
      />
    </div>
  );
};

export default Option;
import React from 'react';

const SubOption = ({ option, onChange }) => {
  return (
    <div className="mb-2">
      <input
        type="text"
        className="form-control"
        value={option}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sub-Option"
      />
    </div>
  );
};

export default SubOption;
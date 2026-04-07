import React, { useState } from "react";
import * as XLSX from "xlsx";

const Option = ({
  option,
  index,
  onChange,
  onBulkOptions,
  allOptions = [],
}) => {
  const [inputMode, setInputMode] = useState("manual"); // 'manual' or 'xlsx'
  const [fileName, setFileName] = useState("");

  const handleLabelChange = (e) => {
    const label = e.target.value;
    let baseName = label.toLowerCase().replace(/[^a-z0-9-._:]/g, "_");

    // Ensure uniqueness among all options
    let name = baseName;
    let suffix = 1;

    // Check if this name already exists in other options (excluding current option)
    while (allOptions.some((opt, i) => i !== index && opt.name === name)) {
      suffix++;
      name = `${baseName}_${suffix}`;
    }

    onChange("label", label);
    onChange("name", name);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    // Get all values from the first column, skipping header if present
    const options = rows
      .map((row) => row[0])
      .filter((v) => v !== undefined && v !== null && v !== "");
    // Remove header if it's a string and not a number
    if (
      options.length &&
      typeof options[0] === "string" &&
      options[0].toLowerCase().includes("option")
    ) {
      options.shift();
    }
    // Call parent to set all options at once
    if (typeof onBulkOptions === "function") {
      onBulkOptions(options);
    }
  };

  return (
    <div className="mb-2">
      {inputMode === "manual" ? (
        <input
          type="text"
          className="mb-2 form-control"
          value={option.label}
          onChange={handleLabelChange}
          placeholder="Option Label"
        />
      ) : (
        <div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="mb-2 form-control"
          />
          {fileName && (
            <div className="text-sm text-gray-600">Uploaded: {fileName}</div>
          )}
          <div className="text-xs text-gray-500">
            First column values will be used as options.
          </div>
        </div>
      )}
    </div>
  );
};

export default Option;

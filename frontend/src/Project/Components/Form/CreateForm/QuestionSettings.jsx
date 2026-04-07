import React, { useState } from 'react';
import { Collapse, Form, Button } from 'react-bootstrap';

const QuestionSettings = ({ question, onChange }) => {
  const [openSkipLogic, setOpenSkipLogic] = useState(false);
  const [openAddCondition, setOpenAddCondition] = useState(false);
  const [openManualSkipLogic, setOpenManualSkipLogic] = useState(false);
  const [manualSkipLogic, setManualSkipLogic] = useState(question.relevant || '');

  const handleLabelChange = (e) => {
    onChange('label', e.target.value);
  };

  const handleRequiredChange = (e) => {
    onChange('required', e.target.checked);
  };

  const handleAppearanceChange = (e) => {
    onChange('appearance', e.target.value);
  };

  const handleManualSkipLogicChange = (e) => {
    setManualSkipLogic(e.target.value);
  };

  const handleManualSkipLogicSubmit = () => {
    onChange('relevant', manualSkipLogic);
  };

  return (
    <div className="question-settings">
      <div className="mb-3">
        <label className="form-label">Label:</label>
        <input
          type="text"
          className="form-control"
          value={question.label}
          onChange={handleLabelChange}
        />
      </div>
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          checked={question.required}
          onChange={handleRequiredChange}
        />
        <label className="form-check-label">Required</label>
      </div>
      <div className="mb-3">
        <label className="form-label">Appearance:</label>
        <Form.Select value={question.appearance} onChange={handleAppearanceChange}>
          <option value="">Select</option>
          <option value="minimal">Minimal</option>
          <option value="autocomplete">Autocomplete</option>
          <option value="quick">Quick</option>
          <option value="horizontal">Horizontal</option>
          <option value="likert">Likert</option>
          <option value="compact">Compact</option>
          <option value="list-nolabel">List-nolabel</option>
        </Form.Select>
      </div>

      <Button onClick={() => setOpenSkipLogic(!openSkipLogic)} aria-controls="skip-logic-collapse" aria-expanded={openSkipLogic}>
        Skip Logic
      </Button>
      <Collapse in={openSkipLogic}>
        <div id="skip-logic-collapse">
          <Button onClick={() => setOpenAddCondition(!openAddCondition)} aria-controls="add-condition-collapse" aria-expanded={openAddCondition}>
            Add a Condition
          </Button>
          <Collapse in={openAddCondition}>
            <div id="add-condition-collapse">
              {/* Add your condition form here */}
            </div>
          </Collapse>

          <Button onClick={() => setOpenManualSkipLogic(!openManualSkipLogic)} aria-controls="manual-skip-logic-collapse" aria-expanded={openManualSkipLogic}>
            Manually enter your skip logic in XLSForm code
          </Button>
          <Collapse in={openManualSkipLogic}>
            <div id="manual-skip-logic-collapse">
              <Form>
                <Form.Group controlId="manualSkipLogic">
                  <Form.Label>Enter Skip Logic:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={manualSkipLogic}
                    onChange={handleManualSkipLogicChange}
                  />
                </Form.Group>
                <Button variant="primary" onClick={handleManualSkipLogicSubmit}>
                  Save Skip Logic
                </Button>
              </Form>
            </div>
          </Collapse>
        </div>
      </Collapse>
    </div>
  );
};

export default QuestionSettings;
import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import {
  BsCheckSquare,
  BsCardText,
  Bs123,
  BsCalendarDate,
  BsClock,
  BsCalendarEvent,
  BsGeo,
  BsGeoFill,
  BsArrowsAngleExpand,
  BsFillImageFill,
  BsMicFill,
  BsFillCameraVideoFill,
  BsSticky,
  BsUpcScan,
  BsPatchCheck,
  BsStarFill,
  BsFileEarmarkFill
} from 'react-icons/bs';

const iconMap = {
  select_one: <BsCheckSquare />,
  text: <BsCardText />,
  integer: <Bs123 />,
  date: <BsCalendarDate />,
  time: <BsClock />,
  datetime: <BsCalendarEvent />,
  geopoint: <BsGeo />,
  geotrace: <BsGeoFill />,
  geoshape: <BsArrowsAngleExpand />,
  decimal: <Bs123 />,
  select_multiple: <BsCheckSquare />,
  image: <BsFillImageFill />,
  audio: <BsMicFill />,
  video: <BsFillCameraVideoFill />,
  note: <BsSticky />,
  barcode: <BsUpcScan />,
  acknowledge: <BsPatchCheck />,
  rating: <BsStarFill />,
  range: <BsArrowsAngleExpand />,
  file: <BsFileEarmarkFill />
};

const QuestionTypeModal = ({ show, onHide, onSelectType }) => {
  const questionTypes = [
    'select_one',
    'text',
    'integer',
    'date',
    'time',
    'datetime',
    'geopoint',
    'geotrace',
    'geoshape',
    'decimal',
    'select_multiple',
    'image',
    'audio',
    'video',
    'note',
    'barcode',
    'acknowledge',
    'rating',
    'range',
    'file'
  ];

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Select Question Type</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          {questionTypes.map((type) => (
            <Col key={type} xs={6} md={3} className="mb-2">
              <button
                type="button"
                className="list-group-item d-flex align-items-center gap-2 p-1 w-100 border-0 bg-transparent"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectType(type);
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className='w-4 h-4'>{iconMap[type]}</span>
                <span>{type}</span>
              </button>
            </Col>
          ))}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QuestionTypeModal;
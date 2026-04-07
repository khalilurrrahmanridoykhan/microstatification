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

const formatTypeName = (type) =>
  type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const QuestionTypeModal = ({ show, onHide, onSelectType }) => {
  const questionTypes = Object.keys(iconMap);

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fw-semibold">Select Question Type</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          {questionTypes.map((type) => (
            <Col key={type} xs={6} md={4} lg={3}>
              <button
                type="button"
                className="w-100 text-start d-flex align-items-center gap-2 p-2 rounded border shadow-sm bg-white hover-shadow transition"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectType(type);
                }}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: '#dee2e6'
                }}
              >
                <span className="fs-5 text-black">{iconMap[type]}</span>
                <span className="text-capitalize">{formatTypeName(type)}</span>
              </button>
            </Col>
          ))}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QuestionTypeModal;

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BACKEND_URL } from "../../../../config";

function Gallery() {
  const { formId } = useParams();
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState("All questions");
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/forms/${formId}/media/`);
        const data = await res.json();
        const filesWithFullUrl = data.map((file) => ({
          ...file,
          url: file.url.startsWith("/media/")
            ? `${BACKEND_URL}${file.url}`
            : file.url,
        }));
        setMediaFiles(filesWithFullUrl);
      } catch (err) {
        setMediaFiles([]);
      }
    }
    fetchMedia();
  }, [formId]);

  const handleImageClick = (idx) => {
    setCurrentIndex(idx);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };

  return (
    <div>
      <div className="w-full">
        <h2 className="text-[22px] text-black">Gallery</h2>

        {/* Filter Section */}

        <div className="bg-white p-4 grid grid-cols-2 gap-4 mt-6 md:grid-cols-4 border border-black/70 rounded-lg">
          {mediaFiles.length === 0 && <div>No media found.</div>}
          {mediaFiles.map((file, idx) => (
            <div key={idx} className="p-2 border rounded">
              {file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={file.url}
                  alt={file.filename}
                  className="object-cover w-full h-40 rounded cursor-pointer"
                  onClick={() => handleImageClick(idx)}
                />
              ) : file.url.match(/\.(mp4|webm|ogg)$/i) ? (
                <video controls className="object-cover w-full h-40 rounded">
                  <source src={file.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.filename}
                </a>
              )}
              <div className="mt-1 text-xs text-gray-500">
                Submission: {file.submission_id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal Popup */}
      {showModal && mediaFiles[currentIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "transparent" }} // Remove black background
          onClick={handleCloseModal}
        >
          <div
            className="relative flex flex-col items-center bg-white rounded shadow-lg"
            style={{ maxWidth: "90vw", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute text-2xl text-gray-700 top-2 right-2"
              onClick={handleCloseModal}
            >
              &times;
            </button>
            <img
              src={mediaFiles[currentIndex].url}
              alt={mediaFiles[currentIndex].filename}
              className="max-h-[80vh] max-w-[80vw] rounded"
              style={{ objectFit: "contain" }}
            />
            <div className="flex justify-between w-full px-4 mt-2">
              <button
                className="px-4 py-1 text-lg bg-gray-200 rounded hover:bg-gray-300"
                onClick={handlePrev}
              >
                &#8592; Prev
              </button>
              <button
                className="px-4 py-1 text-lg bg-gray-200 rounded hover:bg-gray-300"
                onClick={handleNext}
              >
                Next &#8594;
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {mediaFiles[currentIndex].filename}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;

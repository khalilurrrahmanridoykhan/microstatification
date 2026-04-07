// components/ProgressBar.jsx
const ProgressBar = ({ currentStage }) => {
  const totalSteps = 3;

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto">
      {[...Array(totalSteps)].map((_, index) => {
        index++;
        const isActive = index <= currentStage;

        return (
          <div key={index} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold  transition-all duration-800 ease-in-out
                  ${
                    isActive
                      ? "bg-color-custom text-white"
                      : "bg-blue-100 text-color-custom"
                  }
                `}
            >
              {index}
            </div>
            {index < totalSteps && (
              <div
                className={`h-1 flex-1 mx-1  transition-all duration-800 ease-in-out
                    ${index < currentStage ? "bg-color-custom" : "bg-blue-100"}
                  `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBar;

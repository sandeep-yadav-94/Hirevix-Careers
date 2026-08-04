import React from "react";

const Loading = () => {
  return (
    <div
      className="flex w-full flex-col items-center justify-center mt-40"
      role="status"
    >
      <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-200 border-t-red-400"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loading;
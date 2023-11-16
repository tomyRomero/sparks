// LoadingBar
import React from 'react';

const LoadingBar = ({ progress }: any) => {
  const progressBarStyle = `h-full bg-primary-500 rounded-l-md transition-width duration-300 ease-in-out`;
  const progressTextStyle = `absolute inset-0 flex items-center justify-center text-white font-bold`;

  return (
    <div className="w-full h-10 rounded-full overflow-hidden border border-black">
      <div className={`relative ${progressBarStyle}`} style={{ width: `${progress}%` }}>
        <div className={progressTextStyle}>{progress}%</div>
      </div>
    </div>
  );
};

export default LoadingBar;

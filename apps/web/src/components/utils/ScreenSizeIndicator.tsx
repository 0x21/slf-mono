"use client";

import dynamic from "next/dynamic";
import { useLocalStorage, useWindowSize } from "@uidotdev/usehooks";
import { XIcon } from "lucide-react";

const ScreenSizeIndicator = () => {
  const [isVisible, setIsVisible] = useLocalStorage<boolean>(
    "screen-size-indicator-visible",
    true,
  );
  const { width, height } = useWindowSize();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-3 z-50 flex items-center rounded-full border border-gray-400 bg-gray-800 py-1.5 pr-3 pl-2 font-mono text-xs text-white">
      <button
        className="cursor-pointer p-0.5"
        onClick={() => {
          setIsVisible(false);
        }}
      >
        <XIcon className="size-4" />
      </button>
      <div className="mt-0.5 ml-2 flex items-center">
        <span className="mr-2">
          {width}x{height}
        </span>
        <div className="block sm:hidden">xs</div>
        <div className="hidden sm:block md:hidden">sm</div>
        <div className="hidden md:block lg:hidden">md</div>
        <div className="hidden lg:block xl:hidden">lg</div>
        <div className="hidden xl:block 2xl:hidden">xl</div>
        <div className="hidden 2xl:block">2xl</div>
      </div>
    </div>
  );
};

const DynamicScreenSizeIndicator = dynamic(
  () => Promise.resolve(ScreenSizeIndicator),
  { ssr: false },
);

export default DynamicScreenSizeIndicator;

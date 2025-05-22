import Image from "next/image";

import { BRAND_IMAGEURL, BRAND_TITLE, cn } from "@fulltemplate/common";

interface IProps {
  containerClassName?: string;
  textClassName?: string;
}

const Logo = ({ containerClassName, textClassName }: IProps) => {
  return (
    <div className={cn("flex items-center", containerClassName)}>
      <Image
        src={BRAND_IMAGEURL}
        alt={BRAND_TITLE}
        width={36}
        height={36}
        className="h-9 w-auto rounded-full"
        unoptimized
      />
      <span
        className={cn(
          "-mb-[2.5px] ml-[3px] text-2xl font-semibold tracking-[0.175em] text-black dark:text-white",
          textClassName,
        )}
      >
        {BRAND_TITLE}
      </span>
    </div>
  );
};

export default Logo;

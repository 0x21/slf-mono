import { Tooltip } from "@mui/material";
import moment from "moment";

import { cn } from "@fulltemplate/common";

import type { WithClassName } from "~/lib/types";

interface IProps extends WithClassName {
  date: Date;
  textType?: "short" | "long" | "combined";
  tooltipType?: "short" | "long" | "combined";
}

const DateText = ({ date, textType, tooltipType, className }: IProps) => {
  const shortText = moment(date).fromNow();
  const longText = `${moment(date).format("MMM DD YYYY, HH:mm")}`;
  // const longText = `${moment(date).format("MMM DD YYYY, HH:mm")}`;
  const combinedText = `${longText} - ${shortText}`;
  let text = longText;
  let tooltipText = combinedText;
  if (textType === "short") {
    text = shortText;
  } else if (textType === "long") {
    text = longText;
  } else if (textType === "combined") {
    text = combinedText;
  }
  if (tooltipType === "short") {
    tooltipText = shortText;
  } else if (tooltipType === "long") {
    tooltipText = longText;
  } else if (tooltipType === "combined") {
    tooltipText = combinedText;
  }

  return (
    <Tooltip
      title={tooltipText}
      placement="top"
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={5000}
    >
      <time
        dateTime={date.toISOString()}
        className={cn("underline decoration-dotted", className)}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {text}
      </time>
    </Tooltip>
  );
};

export default DateText;

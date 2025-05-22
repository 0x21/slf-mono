import { TriangleAlert } from "lucide-react";

const GenericError = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center">
        <TriangleAlert className="mr-2 h-4 w-4 text-red-500" />
        Error
      </div>
    </div>
  );
};

export default GenericError;

import { Loader2 } from "lucide-react";

const GenericLoading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading
      </div>
    </div>
  );
};

export default GenericLoading;

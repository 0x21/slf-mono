/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
  example: string;
  setExample: (example: string) => void;
}

const useExampleStore = create<StoreState>()(
  persist(
    (set) => ({
      example: "undefined",
      setExample: (example) => {
        set((state) => {
          return {
            example: example,
          };
        });
      },
    }),
    {
      name: "exampleStore",
    },
  ),
);

export default useExampleStore;

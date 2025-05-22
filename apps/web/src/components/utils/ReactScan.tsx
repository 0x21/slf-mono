"use client";

// sort-imports-ignore
// prettier-ignore
import { scan } from "react-scan";

import { useEffect } from "react";

function ReactScan() {
  useEffect(() => {
    scan({
      enabled: true,
    });
  }, []);

  return <></>;
}

export default ReactScan;

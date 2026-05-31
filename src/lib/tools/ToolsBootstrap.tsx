import { useEffect } from "react";
import { sweepExpiredToolEntries } from "../db/toolEntries";

export function ToolsBootstrap() {
  useEffect(() => {
    void sweepExpiredToolEntries();
  }, []);
  return null;
}

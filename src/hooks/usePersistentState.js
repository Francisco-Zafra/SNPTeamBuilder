import { useEffect, useState } from "react";
import { readJSON, writeJSON } from "../utils/storage.js";

/** `useState` que se guarda en localStorage. `restore` valida lo leído. */
export function usePersistentState(key, restore) {
  const [value, setValue] = useState(() => restore(readJSON(key)));

  useEffect(() => {
    writeJSON(key, value);
  }, [key, value]);

  return [value, setValue];
}

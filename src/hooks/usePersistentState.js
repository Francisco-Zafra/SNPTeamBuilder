import { useEffect, useReducer, useState } from "react";
import { readJSON, writeJSON } from "../utils/storage.js";

/** `useState` que se guarda en localStorage. `restore` valida lo leído. */
export function usePersistentState(key, restore) {
  const [value, setValue] = useState(() => restore(readJSON(key)));

  useEffect(() => {
    writeJSON(key, value);
  }, [key, value]);

  return [value, setValue];
}

/** `useReducer` que se guarda en localStorage. `restore` valida lo leído. */
export function usePersistentReducer(key, reducer, restore) {
  const [state, dispatch] = useReducer(reducer, undefined, () => restore(readJSON(key)));

  useEffect(() => {
    writeJSON(key, state);
  }, [key, state]);

  return [state, dispatch];
}

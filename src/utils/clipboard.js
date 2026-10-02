/** Copia texto al portapapeles. Devuelve `true` si lo consiguió. */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Sigue con el método antiguo.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * Abre la hoja nativa de compartir. Devuelve "shared", "cancelled" o
 * "unsupported" (en ese caso el llamador copia al portapapeles).
 */
export async function shareText({ title, text }) {
  if (!canShare()) return "unsupported";
  try {
    await navigator.share({ title, text });
    return "shared";
  } catch (error) {
    return error?.name === "AbortError" ? "cancelled" : "unsupported";
  }
}

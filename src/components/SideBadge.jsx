import { sideMeta } from "../ui/labels.js";

export function SideBadge({ side }) {
  const meta = sideMeta(side);
  return <span className={`sb ${meta.cls}`}>{meta.letter}</span>;
}

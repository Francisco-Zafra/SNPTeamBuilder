// Iconos de trazo del diseño (design/claude-design/Main.dc.html).
const PATHS = {
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6c3.2 2.4 3.2 10.4 0 12.8" />
      <path d="M18.4 5.6c-3.2 2.4-3.2 10.4 0 12.8" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>
  ),
  share: (
    <>
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  offline: (
    <>
      <path d="M3 3l18 18" />
      <path d="M8.5 16.4a5 5 0 0 1 7 0" />
      <path d="M5 12.6a10 10 0 0 1 4.6-2.6" />
      <path d="M19 12.6a10 10 0 0 0-2.8-1.9" />
      <path d="M2 8.8a15 15 0 0 1 4.2-2.6" />
      <path d="M22 8.8A15 15 0 0 0 11 5" />
      <path d="M12 20h.01" />
    </>
  ),
  retry: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  chevronDown: <path d="M7 10l5 5 5-5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  sort: (
    <>
      <path d="M7 4v16" />
      <path d="M3 16l4 4 4-4" />
      <path d="M14 6h7" />
      <path d="M14 11h5" />
      <path d="M14 16h3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3.5l9.5 16.5h-19z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.5h.01" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  move: (
    <>
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M9 6l3-3 3 3" />
      <path d="M9 18l3 3 3-3" />
    </>
  ),
  court: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 12h16" />
      <path d="M12 7v10" />
    </>
  ),
  cloudOk: (
    <>
      <path d="M7 18.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5z" />
      <path d="M9.5 13.8l2 2 3.5-3.6" />
    </>
  ),
  cloud: <path d="M7 18.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5z" />,
  cloudOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M8 18.5h9.5" />
      <path d="M20.5 15.5a4 4 0 0 0-2.4-5 6 6 0 0 0-7.4-4.6" />
      <path d="M6.8 8.2a6 6 0 0 0-.3 3.9A3.3 3.3 0 0 0 7 18.5" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 16l-4-4 4-4" />
      <path d="M6 12h10" />
    </>
  ),
  linkBroken: (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M11 6.5l1.2-1.2a4.2 4.2 0 0 1 6 6L17 12.5" />
      <path d="M13 17.5l-1.2 1.2a4.2 4.2 0 0 1-6-6L7 11.5" />
      <path d="M3 3l3 3" />
      <path d="M21 21l-3-3" />
    </>
  ),
  dots: (
    <>
      <path d="M5 12h.01" />
      <path d="M12 12h.01" />
      <path d="M19 12h.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.6a6.5 6.5 0 0 1 3.5 5.4" />
    </>
  ),
};

export function Icon({ name, size }) {
  const cls = "ic" + (size ? ` ic--${size}` : "");
  return (
    <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

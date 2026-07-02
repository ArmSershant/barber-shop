// Tiny inline SVG flags for the 3 UI languages (am/gb/ru). Avoids pulling the
// full flag-icons stylesheet (all ~250 flags) into every page's render-blocking
// CSS — that sheet now loads only where the phone country picker renders.

const box = { width: '1.33em', height: '1em', borderRadius: 2, display: 'block' } as const;

export function Flag({ code, title }: { code: string; title?: string }) {
  if (code === 'am') {
    return (
      <svg viewBox="0 0 3 2" style={box} role="img" aria-label={title}>
        <rect width="3" height="2" fill="#f2a800" />
        <rect width="3" height="0.667" y="0" fill="#d90012" />
        <rect width="3" height="0.667" y="0.667" fill="#0033a0" />
      </svg>
    );
  }
  if (code === 'ru') {
    return (
      <svg viewBox="0 0 3 2" style={box} role="img" aria-label={title}>
        <rect width="3" height="2" fill="#fff" />
        <rect width="3" height="0.667" y="0.667" fill="#0039a6" />
        <rect width="3" height="0.667" y="1.333" fill="#d52b1e" />
      </svg>
    );
  }
  // gb — compact union jack (diagonals not offset; fine at icon size).
  return (
    <svg viewBox="0 0 60 30" style={box} role="img" aria-label={title}>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#c8102e" strokeWidth="4" />
      <rect x="25" width="10" height="30" fill="#fff" />
      <rect y="10" width="60" height="10" fill="#fff" />
      <rect x="27" width="6" height="30" fill="#c8102e" />
      <rect y="12" width="60" height="6" fill="#c8102e" />
    </svg>
  );
}

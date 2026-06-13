'use client';

// A template re-mounts on every navigation, so this entrance animation
// replays on each route change — giving subtle motion site-wide.
// The animation itself (and its reduced-motion opt-out) lives in globals.scss.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

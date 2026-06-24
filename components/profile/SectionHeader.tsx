import type { ReactNode } from 'react';

/** Heritage section divider: italic Cormorant label + a hairline rule filling
 * the remaining width. Styling lives in globals.scss (.sectionHeader). */
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="sectionHeader">
      <span>{children}</span>
    </div>
  );
}

import type { ReactNode } from 'react';

/** 卓の上に置く小さな札（親・東場・ツモ など） */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-black/20 px-3 py-0.5 shadow-inner">
      {children}
    </span>
  );
}

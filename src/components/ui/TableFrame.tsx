import type { ReactNode } from 'react';

type Props = {
  /** 読み上げ用の名前（例: 第1問） */
  label: string;
  children: ReactNode;
  className?: string;
};

/** 雀卓の見た目の枠。木目の縁の内側に緑のフェルトを敷く（色と質感は globals.css） */
export function TableFrame({ label, children, className = '' }: Props) {
  return (
    <section
      aria-label={label}
      className="wood rounded-2xl p-2 shadow-lg sm:p-2.5"
    >
      <div
        className={`felt rounded-xl px-2 py-5 text-center text-on-dark shadow-[inset_0_2px_8px_rgb(0_0_0/0.35)] sm:px-4 ${className}`}
      >
        {children}
      </div>
    </section>
  );
}

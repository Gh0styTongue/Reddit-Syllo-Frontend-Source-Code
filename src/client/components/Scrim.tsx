interface ScrimProps {
  children: React.ReactNode;
}

export function Scrim(props: ScrimProps) {
  const { children } = props;
  return (
    <div className="fixed inset-0 justify-center p-8 flex flex-col gap-6 items-center bg-[var(--color-scrim)] select-none">
      {children}
    </div>
  );
}

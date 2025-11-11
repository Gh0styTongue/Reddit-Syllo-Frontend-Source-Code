import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type DevvitRecommendationsContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const DevvitRecommendationsContext = createContext<
  DevvitRecommendationsContextValue | undefined
>(undefined);

export function DevvitRecommendationsProvider(props: {
  children: React.ReactNode;
}) {
  const { children } = props;
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle]
  );

  return (
    <DevvitRecommendationsContext.Provider value={value}>
      {children}
    </DevvitRecommendationsContext.Provider>
  );
}

export function useDevvitRecommendations(): DevvitRecommendationsContextValue {
  const ctx = useContext(DevvitRecommendationsContext);
  if (!ctx) {
    throw new Error(
      "useDevvitRecommendations must be used within a DevvitRecommendationsProvider"
    );
  }
  return ctx;
}

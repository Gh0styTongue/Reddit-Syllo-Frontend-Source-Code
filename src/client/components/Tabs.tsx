import { WonkyRectangle } from "./WonkyRectangle";

interface Tab<T> {
  label: string;
  id: T;
}

export function Tabs<T>(props: {
  tabs: Tab<T>[];
  currentTab: T | null;
  onSelectTab: (tabId: T) => void;
}) {
  return (
    <nav className="flex flex-row items-center">
      {props.tabs.map((tab) => {
        const isActive = props.currentTab === tab.id;
        return (
          <button
            key={`tab-${tab.id}`}
            className={`py-4 px-3 text-[var(--color-text-strong)] relative ${isActive ? "cursor-default" : "cursor-pointer hover:scale-125 transition-all active:scale-95"}`}
            onClick={() => props.onSelectTab(tab.id)}
            disabled={isActive}
          >
            <div className="text-lg leading-6 font-black text-nowrap tracking-tight">
              {tab.label}
            </div>
            <div
              className={`absolute bottom-2 left-2 right-2 h-1 transition-all ${isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
            >
              <WonkyRectangle color="var(--color-text-strong)" />
            </div>
          </button>
        );
      })}
    </nav>
  );
}

import { ReactNode } from "react";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNavigation from "./BottomNavigation";

interface Props {
  children: ReactNode;
  mainClass?: string;
}

export default function AppShell({ children, mainClass }: Props) {
  return (
    <div className="bg-background flex min-h-screen">
      {/* Desktop only */}
      <aside className="border-border hidden w-64 border-r lg:flex">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className={`mt-16 flex-1 px-4 py-4 pb-2 ${mainClass ?? ""}`}>
          {children}
        </main>

        {/* Mobile only */}
        <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
}

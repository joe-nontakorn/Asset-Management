import { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import NewUserNotifier from "../apps/LineSupport/components/NewUserNotifier";
import ResolvedTicketNotifier from "../apps/LineSupport/components/ResolvedTicketNotifier";
import NewTicketNotifier from "../apps/LineSupport/components/NewTicketNotifier";
import type { ReactNode } from "react";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  return (
    <div className="font-sans text-sm text-gray-800 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar with mobile slide-in */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 z-40 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Sidebar className="h-full w-full" onClose={closeSidebar} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full overflow-x-hidden">
        {/* Fixed Header */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-20 bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors duration-200">
          <Header onMenuClick={toggleSidebar} />
        </div>
        {/* Scrollable Content */}
        <main className="pt-20 px-4 pb-8 sm:pt-24 sm:px-6 sm:pb-12 flex-1 w-full relative">
          {children}
        </main>
      </div>

      {/* Global Toast for New User Registration, Resolved Cases & New Tickets */}
      <NewUserNotifier />
      <ResolvedTicketNotifier />
      <NewTicketNotifier />
    </div>
  );
};

export default MainLayout;
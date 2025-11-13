// Index.tsx
import { useState } from "react";
import AntSidebar from "@/components/AntSidebar";
import MainContent from "@/components/MainContent";

const Index = () => {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <AntSidebar />

      {/* Main content scrollable area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <MainContent />
      </div>
    </div>
  );
};

export default Index;

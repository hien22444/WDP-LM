import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import "./MainLayout.scss";
import UniversalHeader from "./UniversalHeader";
import { ChatProvider } from "../../contexts/ChatContext";
import ChatManager from "../Chat/ChatManager";
// TEMPORARILY DISABLED - Causing lag
// import ChatBot from "../ChatBot/ChatBot";

const MainLayout = ({ children }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ChatProvider>
      <div className="main-layout">
        <UniversalHeader />
        <main className="main-content">
          <Outlet />
        </main>

        {/* Back to Top Button */}
        <button
          className={`back-to-top ${showBackToTop ? "visible" : ""}`}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Lên đầu trang"
        >
          <i className="fas fa-chevron-up"></i>
        </button>

        {/* ChatBot Component */}
        {/* TEMPORARILY DISABLED - Causing lag */}
        {/* <ChatBot /> */}

        {/* Chat Manager Component - Only show for authenticated users */}
        {isAuthenticated && <ChatManager />}
      </div>
    </ChatProvider>
  );
};

export default MainLayout;

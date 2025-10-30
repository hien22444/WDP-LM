import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import "./MainLayout.scss";
import UniversalHeader from "./UniversalHeader";
<<<<<<< HEAD
import ChatBot from "../ChatBot/ChatBot";
=======
// TEMPORARILY DISABLED - Causing lag
// import ChatBot from "../ChatBot/ChatBot";
>>>>>>> Quan3

const MainLayout = ({ children }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);

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
<<<<<<< HEAD
      <ChatBot />
=======
      {/* TEMPORARILY DISABLED - Causing lag */}
      {/* <ChatBot /> */}
>>>>>>> Quan3
    </div>
  );
};

export default MainLayout;

import { Outlet, useLocation } from "react-router-dom";
import ModernHeader from "./modern-header";
import { ThemeProvider } from "../ui/theme-provider";
import { motion } from "framer-motion";

function StudentViewCommonLayout() {
  const location = useLocation();

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 text-white">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_100px,rgba(120,119,198,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_600px,rgba(78,161,255,0.1),transparent)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {!location.pathname.includes("course-progress") ? (
          <ModernHeader />
        ) : null}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`relative z-10 ${!location.pathname.includes("course-progress") ? "pt-16" : ""}`}
        >
          <Outlet />
        </motion.div>
      </div>
    </ThemeProvider>
  );
}

export default StudentViewCommonLayout;

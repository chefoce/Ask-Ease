import { useContext } from "react";
import ThemeContext from "./context/ThemeContext";
import AppRouter from "./AppRouter";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Toaster } from "@/components/ui/toaster";

const App = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`${theme === "dark" ? "dark" : ""}`}>
      <div className="flex flex-col min-h-screen dark:bg-zinc-900 m-1">
        <Header />
        <Toaster />
        <main className="flex-grow dark:bg-zinc-800 rounded-3xl border-2 border-slate-200 mt-1 dark:border-accent">
          <AppRouter />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;

import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ThemeContext from "../context/ThemeContext";
import LanguageContext from "../context/LanguageContext";
import { useTranslation } from "react-i18next";
import { Sun, Moon, CircleHelp, CircleArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language, switchLanguage } = useContext(LanguageContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const authorInitials = user ? user.name.substring(0, 2) : "";
  const [searchQuery, setSearchQuery] = useState("");
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query) {
      navigate(`/search?q=${query}`);
    } else {
      navigate("/");
    }
  };

  return (
    <header className="px-4 py-2 md:px-6 md:py-4 border-2 border-accent rounded-3xl">
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4 md:space-x-6">
          {window.location.pathname !== "/" && (
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <CircleArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <Input
            type="text"
            name="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t("search")}
            className="w-40 md:w-48 bg-white dark:bg-zinc-800"
          />
        </div>

        <Link
          to="/"
          className="flex font-sans text-2xl md:text-4xl font-bold tracking-tighter text-accent"
        >
          <h1 className="mr-0.5">Ask</h1>
          <CircleHelp className="h-6 w-6 md:h-7 md:w-7 -mt-1 rounded-full bg-accent text-slate-100 hover:rotate-180 duration-200" />
          <h1 className="ml-0">Ease</h1>
        </Link>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={t("toggleTheme")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Select
            value={language}
            onValueChange={(value) => switchLanguage(value)}
          >
            <SelectTrigger className="w-16 md:w-20">
              <SelectValue placeholder={language.toUpperCase()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="es">ES</SelectItem>
            </SelectContent>
          </Select>
          {user ? (
            <>
              {user.isAdmin && (
                <Link to="/admin">
                  <Button size="sm" className="block">
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Avatar>
                  <AvatarFallback className="bg-accent uppercase text-slate-100 dark:bg-slate-100 dark:text-accent font-bold hover:transform hover:scale-110">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                className="hover:transform hover:scale-110 bg-red-400"
                onClick={handleLogout}
              >
                {t("logout")}
              </Button>
            </>
          ) : (
            <Button className="hover:transform hover:scale-110">
              <Link to="/login">{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

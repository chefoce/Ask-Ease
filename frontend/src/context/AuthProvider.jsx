import { useState, useEffect, useContext, useRef } from "react";
import PropTypes from "prop-types";
import api from "../utils/api";
import AuthContext from "./AuthContext";
import ThemeContext from "./ThemeContext";
import LanguageContext from "./LanguageContext";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const { theme, setTheme } = useContext(ThemeContext);
  const { language, switchLanguage } = useContext(LanguageContext);
  const preferencesApplied = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Obtener los datos del usuario
      api
        .get("/users/me")
        .then((res) => {
          setUser(res.data);
          if (!preferencesApplied.current) {
            setTheme(res.data.theme || "light");
            switchLanguage(res.data.language || "en");
            preferencesApplied.current = true;
          }
        })
        .catch((err) => {
          console.error(err);
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
        });
    }
  }, [setTheme, switchLanguage]);

  // Observe changes in theme and language to save preferences
  useEffect(() => {
    if (user) {
      savePreferences(theme, language);
    }
  }, [theme, language]);

  const savePreferences = async (theme, language) => {
    try {
      await api.patch("/users/preferences", { theme, language });
      setUser((prevUser) => ({
        ...prevUser,
        theme: theme ?? prevUser.theme,
        language: language ?? prevUser.language,
      }));
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  const login = async (credentials) => {
    try {
      const res = await api.post("/auth/login", credentials);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      setTheme(user.theme || "light");
      switchLanguage(user.language || "en");
      preferencesApplied.current = true;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    // Reset preferences to default values
    setTheme("light");
    switchLanguage("en");
    preferencesApplied.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;

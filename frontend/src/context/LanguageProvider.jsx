import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import i18n from "../i18n";
import LanguageContext from "./LanguageContext";

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem("language", language);
  }, [language]);

  const switchLanguage = (lang) => {
    setLanguage(lang);
  };

  const contextValue = useMemo(
    () => ({ language, switchLanguage, setLanguage }),
    [language]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default LanguageProvider;

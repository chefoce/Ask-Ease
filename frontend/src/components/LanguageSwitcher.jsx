import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

const LanguageSwitcher = () => {
  const { language, switchLanguage } = useContext(LanguageContext);

  return (
    <select
      value={language}
      onChange={(e) => switchLanguage(e.target.value)}
      className="border rounded p-2 dark:bg-gray-700 dark:text-white"
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
    </select>
  );
};

export default LanguageSwitcher;

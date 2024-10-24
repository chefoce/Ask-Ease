import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-2 border-accent rounded-3xl mt-1 mb-2">
      <div className="container mx-auto p-4 text-center">
        <p>
          © {new Date().getFullYear()} {t("appName")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;

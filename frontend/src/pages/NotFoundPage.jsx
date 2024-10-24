import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-5xl font-bold mb-4">{t("pageNotFound")}</h1>
      <p className="mb-4">{t("sorryPageDoesNotExist")}</p>
      <Link
        to="/"
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200"
      >
        {t("goToHomePage")}
      </Link>
    </div>
  );
};

export default NotFoundPage;

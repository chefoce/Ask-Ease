// Pagination.jsx

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Pagination = ({ meta }) => {
  const { t } = useTranslation();
  const { page, totalPages } = meta;

  const createPageLink = (pageNumber) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", pageNumber);
    return `${window.location.pathname}?${params.toString()}`;
  };

  return (
    <div className="flex space-x-2">
      {page > 1 && (
        <Link
          to={createPageLink(page - 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          {t("previous")}
        </Link>
      )}
      <span className="px-4 py-2">
        {t("page")} {page} {t("of")} {totalPages}
      </span>
      {page < totalPages && (
        <Link
          to={createPageLink(page + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          {t("next")}
        </Link>
      )}
    </div>
  );
};

export default Pagination;

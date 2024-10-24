import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { useTranslation } from "react-i18next";
import TemplateCard from "@/components/TemplateCard";

const SearchResultsPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const tags = searchParams.get("tags") || "";
  const topic = searchParams.get("topic") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;
  const tag = searchParams.get("tag") || "";
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const params = { search: query, tags, topic, sort, page, limit };
        const res = await api.get("/templates?", { params });
        if (res) {
          setTemplates(res.data);
        }
      } catch (err) {
        console.error(err);
        setError(t("failedToFetchResults"));
      }
    };
    fetchResults();
  }, [query, tags, topic, sort, page, limit, t]);
  let searchTitle;
  if (query) {
    searchTitle = `${t("searchResultsFor")} "${query}"`;
  } else if (tag) {
    searchTitle = `${t("searchResultsFor")} "${tag}"`;
  } else {
    searchTitle = `${t("searchResults")}`;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{searchTitle}</h1>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>
      )}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <p>{t("noResultsFound")}</p>
      )}
    </div>
  );
};

export default SearchResultsPage;

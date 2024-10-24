import { useEffect, useState } from "react";
import TemplateCard from "../components/TemplateCard";
import TagCloud from "../components/TagCloud";
import api from "../utils/api";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t } = useTranslation();
  const [latestTemplates, setLatestTemplates] = useState([]);
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Fetch latest templates
        const latestRes = await api.get("/templates?sort=latest&limit=5");
        setLatestTemplates(latestRes.data);

        // Fetch popular templates
        const popularRes = await api.get("/templates?sort=popular&limit=5");
        setPopularTemplates(popularRes.data);
      } catch (err) {
        console.error(err);
        setError(t("failedToFetchTemplates"));
      }
    };

    fetchTemplates();
  }, [t]);

  if (error) {
    return <div className="text-red-600 m-10">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 ">
      <h1 className="text-3xl font-bold mb-4">{t("latestTemplates")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {latestTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
      <h1 className="text-3xl font-bold my-4">{t("popularTemplates")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {popularTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
      <h1 className="text-3xl font-bold my-4">{t("tagCloud")}</h1>
      <TagCloud />
    </div>
  );
};

export default HomePage;

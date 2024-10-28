import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import TemplateTable from "../components/TemplateTable";
import FormsTable from "../components/FormsTable";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const UserProfilePage = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [forms, setForms] = useState([]);
  const [activeTab, setActiveTab] = useState("templates");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Manejo de errores
  const [page, setPage] = useState(1);
  const limit = 10; // Número de formularios por página

  useEffect(() => {
    const fetchUserTemplates = async () => {
      try {
        const res = await api.get("/templates/my");
        setTemplates(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchUserForms = async () => {
      try {
        const res = await api.get("/forms/my", {
          params: { page, limit }, // Paginación
        });
        console.log("Respuesta del servidor:", res.data); // Verificar estructura
        setForms(res.data.forms); // Establecer solo el arreglo de formularios
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "An error occurred.");
        setLoading(false);
      }
    };

    fetchUserTemplates();
    fetchUserForms();
  }, [page]);

  const handleCreateTemplate = () => {
    navigate("/templates/create");
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4 text-accent">
        {t("welcome")}, {user.name}
      </h1>
      <div className="mb-4">
        <nav className="flex space-x-4 justify-center">
          <Button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`p-2 ${activeTab === "templates" ? "font-bold" : "bg-secondary"}`}
          >
            {t("myTemplates")}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("forms")}
            className={`p-2 ${activeTab === "forms" ? "font-bold" : "bg-secondary"}`}
          >
            {t("myForms")}
          </Button>
        </nav>
      </div>
      {activeTab === "templates" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button type="button" onClick={handleCreateTemplate}>
              {t("createTemplate")}
            </Button>
          </div>
          <TemplateTable templates={templates} />
        </div>
      )}
      {activeTab === "forms" && <FormsTable forms={forms} />}

      {/* Controles de Paginación */}
      {activeTab === "forms" && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            {t("previousPage") || "Página Anterior"}
          </Button>
          <span>
            {t("page")} {page}
          </span>
          <Button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={forms.length < limit}
          >
            {t("nextPage") || "Página Siguiente"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;

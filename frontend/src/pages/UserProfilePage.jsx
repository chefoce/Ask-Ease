import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import TemplateTable from "../components/TemplateTable";
import FormsTable from "../components/FormsTable";
import TicketsTable from "../components/TicketsTable";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const UserProfilePage = () => {
  const { t } = useTranslation();
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [forms, setForms] = useState([]);
  const [activeTab, setActiveTab] = useState("templates");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageTemplates, setPageTemplates] = useState(1);
  const [pageForms, setPageForms] = useState(1);
  const { toast } = useToast();

  const limit = 10;

  const [showSalesforceForm, setShowSalesforceForm] = useState(false);
  const [salesforceFormData, setSalesforceFormData] = useState(() => {
    const [firstName, ...lastNameParts] = user.name.split(" ");
    return {
      name: firstName,
      lastName: lastNameParts.join(" "),
      email: user.email,
    };
  });

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDialogMessage, setSuccessDialogMessage] = useState("");

  const isConnectedToSalesforce = !!user.salesforceAccountId;

  const [tickets, setTickets] = useState([]);
  const [pageTickets, setPageTickets] = useState(1);

  const [apiToken, setApiToken] = useState(user.apiToken || "");

  const generateApiToken = async () => {
    try {
      const res = await api.post("/users/generate-api-token");
      setApiToken(res.data.apiToken);
      toast({
        title: t("success"),
        description: t("apiTokenGenerated"),
      });
    } catch (error) {
      console.error("Error generating API token:", error);
      toast({
        title: t("error"),
        description: t("apiTokenGenerationFailed"),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchUserTemplates = async () => {
      try {
        const res = await api.get("/templates/my", {
          params: { pageTemplates, limit },
        });
        setTemplates(res.data.templates);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "An error occurred.");
        setLoading(false);
      }
    };

    const fetchUserForms = async () => {
      try {
        const res = await api.get("/forms/my", {
          params: { pageForms, limit },
        });
        setForms(res.data.forms);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "An error occurred.");
        setLoading(false);
      }
    };

    fetchUserTemplates();
    fetchUserForms();
  }, [pageTemplates, pageForms]);

  useEffect(() => {
    const fetchUserTickets = async () => {
      try {
        const res = await api.get("/jira/tickets", {
          params: { page: pageTickets, limit: 10 },
        });
        setTickets(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserTickets();
  }, [pageTickets]);

  const handleCreateTemplate = () => {
    navigate("/templates/create");
  };

  const handleSalesforceFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("auth/salesforce/sync", salesforceFormData);
      setUser({
        ...user,
        salesforceAccountId: res.data.salesforceAccountId,
        salesforceContactId: res.data.salesforceContactId,
      });
      setShowSuccessDialog(true);
      setSuccessDialogMessage(t("salesforceSyncSuccess"));
      setShowSalesforceForm(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred.");
    }
  };

  const handleDisconnectSalesforce = async () => {
    try {
      await api.post("auth/salesforce/disconnect");
      setUser({
        ...user,
        salesforceAccountId: null,
        salesforceContactId: null,
      });
      setShowSuccessDialog(true);
      setSuccessDialogMessage(t("salesforceDisconnectSuccess"));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred.");
    }
  };

  if (loading) {
    return <div className="mt-10 ml-10">Loading...</div>;
  }
  if (error) {
    return <div className="mt-10 ml-10">Error: {error}</div>;
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4 text-accent">
        {t("welcome")}, {user.name}
      </h1>

      <div className="flex justify-end mb-4">
        {isConnectedToSalesforce ? (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDisconnectSalesforce}
          >
            {t("disconnectFromSalesforce")}
          </Button>
        ) : (
          <Button type="button" onClick={() => setShowSalesforceForm(true)}>
            {t("syncWithSalesforce")}
          </Button>
        )}
      </div>
      <div className="mt-4">
        {apiToken ? (
          <div className="bg-gray-100 p-4 rounded">
            <p className="font-mono">{apiToken}</p>
          </div>
        ) : (
          <Button onClick={generateApiToken}>{t("generateApiToken")}</Button>
        )}
      </div>

      <div className="mb-4">
        <nav className="flex space-x-4 justify-center">
          <Button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`p-2 ${
              activeTab === "templates" ? "font-bold" : "bg-secondary"
            }`}
          >
            {t("myTemplates")}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("forms")}
            className={`p-2 ${
              activeTab === "forms" ? "font-bold" : "bg-secondary"
            }`}
          >
            {t("myForms")}
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`p-2 ${
              activeTab === "tickets" ? "font-bold" : "bg-secondary"
            }`}
          >
            {t("myTickets")}
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
      {activeTab === "tickets" && <TicketsTable tickets={tickets} />}
      {/* Controles de Paginación */}
      {activeTab === "templates" && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => setPageTemplates((prev) => Math.max(prev - 1, 1))}
            disabled={pageTemplates === 1}
          >
            <ChevronLeft />
          </Button>
          <span>
            {t("page")} {pageTemplates}
          </span>
          <Button
            onClick={() => setPageTemplates((prev) => prev + 1)}
            disabled={templates.length < limit}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
      {activeTab === "forms" && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => setPageForms((prev) => Math.max(prev - 1, 1))}
            disabled={pageForms === 1}
          >
            <ChevronLeft />
          </Button>
          <span>
            {t("page")} {pageForms}
          </span>
          <Button
            onClick={() => setPageForms((prev) => prev + 1)}
            disabled={forms.length < limit}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
      {activeTab === "tickets" && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            onClick={() => setPageTickets((prev) => Math.max(prev - 1, 1))}
            disabled={pageTickets === 1}
          >
            <ChevronLeft />
          </Button>
          <span>
            {t("page")} {pageTickets}
          </span>
          <Button
            onClick={() => setPageTickets((prev) => prev + 1)}
            disabled={tickets.length < limit}
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      {/* Formulario de Salesforce */}
      <Dialog open={showSalesforceForm} onOpenChange={setShowSalesforceForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("salesforceFormTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalesforceFormSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">
                {t("name")}
                <input
                  type="text"
                  value={salesforceFormData.name}
                  onChange={(e) =>
                    setSalesforceFormData({
                      ...salesforceFormData,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full"
                />
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">
                {t("lastName")}
                <input
                  type="text"
                  value={salesforceFormData.lastName}
                  onChange={(e) =>
                    setSalesforceFormData({
                      ...salesforceFormData,
                      lastName: e.target.value,
                    })
                  }
                  className="mt-1 block w-full"
                />
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">
                {t("email")}
                <input
                  type="email"
                  value={salesforceFormData.email}
                  onChange={(e) =>
                    setSalesforceFormData({
                      ...salesforceFormData,
                      email: e.target.value,
                    })
                  }
                  className="mt-1 block w-full"
                />
              </label>
            </div>
            {/* Agrega otros campos si es necesario */}
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setShowSalesforceForm(false)}
                variant="secondary"
              >
                {t("cancel")}
              </Button>
              <Button type="submit">{t("submit")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de éxito */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("success")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">{successDialogMessage}</div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              {t("ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfilePage;

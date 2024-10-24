import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import CommentList from "../components/CommentList";
import LikeButton from "../components/LikeButton";
import FormTable from "../components/FormTable";
import AggregationResults from "../components/AggregationResults";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

const TemplatePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dialogAction, setDialogAction] = useState("");
  const [canAnswer, setCanAnswer] = useState(false);
  const [hasFilledForm, setHasFilledForm] = useState(false);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/templates/${id}`);
        setTemplate(res.data);

        const isAuthorOrAdmin =
          user && (res.data.author?.id === user.id || user.isAdmin);
        setIsAuthor(isAuthorOrAdmin);

        // Determine if the user can answer
        let canUserAnswer = false;

        if (res.data.isPublic) {
          canUserAnswer = true;
        } else if (user) {
          if (isAuthorOrAdmin) {
            canUserAnswer = true;
          } else if (
            res.data.accessUsers &&
            res.data.accessUsers.some((u) => u.id === user.id)
          ) {
            canUserAnswer = true;
          }
        }

        setCanAnswer(canUserAnswer);
      } catch (err) {
        console.error(err);
        setError(t("templateNotFound") || "Template not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/comments/template/${id}`);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchComments();
  }, [id]);

  useEffect(() => {
    const checkIfUserHasFilledForm = async () => {
      if (user && template) {
        try {
          const res = await api.get(`/forms/my?templateId=${template.id}`);
          if (res.data && res.data.length > 0) {
            setHasFilledForm(true);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    checkIfUserHasFilledForm();
  }, [user, template]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        // If the user is an admin or author, fetch all forms
        if (user && (user.isAdmin || isAuthor)) {
          const res = await api.get(`/forms/template/${id}`);
          setForms(res.data);
        } else if (user && hasFilledForm) {
          // If the user has filled out the form, fetch only their forms
          const res = await api.get(`/forms/my?templateId=${id}`);
          setForms(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchForms();
  }, [user, isAuthor, hasFilledForm, id]);

  const handleDelete = async () => {
    setSelectedTemplate({ id: template.id });
    setDialogAction("delete");
    setIsDialogOpen(true);
  };

  const confirmDialogAction = async () => {
    if (dialogAction === "delete") {
      const { id } = selectedTemplate;
      try {
        await api.delete(`/templates/${id}`);
        navigate("/profile");
      } catch (err) {
        console.error(err);
        setError(t("deleteFailed") || "Failed to delete the template.");
      }
    }
  };

  if (loading) {
    return <div className="ml-20 mt-20">{t("loading") || "Loading..."}</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Template Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{template.title}</h1>
        <div className="flex items-center sm:space-x-4 space-x-2">
          <LikeButton templateId={template.id} />
          {canAnswer && (
            <Button
              className="bg-blue-500"
              onClick={() => navigate(`/templates/fill/${id}`)}
            >
              {t("fill") || "Fill"}
            </Button>
          )}
          {isAuthor && (
            <>
              <Button onClick={() => navigate(`/templates/edit/${id}`)}>
                {t("edit")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="p-1"
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Template Image and Description */}
      {template.imageUrl && (
        <img
          src={template.imageUrl}
          alt={template.title}
          className="my-4 w-full max-h-64 object-cover rounded"
        />
      )}
      <div className="prose dark:prose-dark my-4">
        <p>{template.description}</p>
      </div>

      {/* Template Tabs */}
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="questions">{t("questions")}</TabsTrigger>
          {user && (user.isAdmin || isAuthor || hasFilledForm) && (
            <TabsTrigger value="results">{t("results")}</TabsTrigger>
          )}
          {user && (user.isAdmin || isAuthor) && (
            <TabsTrigger value="aggregation">{t("aggregation")}</TabsTrigger>
          )}
        </TabsList>
        <div className="mt-4">
          <TabsContent value="general">
            <div>
              {/* Template Settings */}
              <h2 className="text-2xl font-semibold mb-4">
                {t("generalData")}
              </h2>
              <p>
                <strong>{t("topic")}:</strong> {template.topic?.name}
              </p>
              <p>
                <strong>{t("tags")}:</strong> {template.tags?.join(", ")}
              </p>
              <p>
                <strong>{t("author")}:</strong> {template.author?.name}
              </p>
              <p>
                <strong>{t("access")}:</strong>{" "}
                {template.isPublic ? t("public") : t("private")}
              </p>
              {!template.isPublic && (
                <div>
                  <h3 className="text-xl font-semibold mt-4">
                    {t("allowedUsers")}
                  </h3>
                  {/* Display list of users with access */}
                  {template.accessUsers && template.accessUsers.length > 0 ? (
                    <ul>
                      {template.accessUsers.map((user) => (
                        <li key={user.id}>{user.name || user.email}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t("noAllowedUsers") || "No allowed users."}</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <div>
              {/* Template Questions */}
              <h2 className="text-2xl font-semibold mb-4">{t("questions")}</h2>
              {template.questions.map((question, index) => (
                <div key={question.id} className="mb-4">
                  <h3 className="text-xl font-semibold">{`${index + 1}. ${
                    question.title
                  }`}</h3>
                  <p>{question.description}</p>
                  <p>
                    <strong>{t("type")}:</strong> {t(question.type)}
                  </p>
                  <p>
                    <strong>{t("showInTable")}:</strong>{" "}
                    {question.showInTable ? t("yes") : t("no")}
                  </p>
                </div>
              ))}
              {isAuthor && (
                <Button onClick={() => navigate(`/templates/edit/${id}`)}>
                  {t("editQuestions")}
                </Button>
              )}
            </div>
          </TabsContent>

          {user && (user.isAdmin || isAuthor || hasFilledForm) && (
            <TabsContent value="results">
              <div>
                {/* Template Results */}
                <h2 className="text-2xl font-semibold mb-4">{t("results")}</h2>
                <FormTable forms={forms} template={template} />
              </div>
            </TabsContent>
          )}

          {user && (user.isAdmin || isAuthor) && (
            <TabsContent value="aggregation">
              <div>
                {/* Template Aggregation */}
                <h2 className="text-2xl font-semibold mb-4">
                  {t("aggregation")}
                </h2>
                <AggregationResults templateId={id} />
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">{t("comments")}</h2>
        <CommentList comments={comments} templateId={id} />
      </div>
      {/* AlertDialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteTemplate") || "Delete Template"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDelete") ||
                "Are you sure you want to delete this template? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialogAction}>
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplatePage;

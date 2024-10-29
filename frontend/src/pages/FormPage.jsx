import { useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AuthContext from "../context/AuthContext";
import {
  Dialog as AlertDialog,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
  DialogFooter as AlertDialogFooter,
  DialogDescription as AlertDialogDescription,
} from "@/components/ui/dialog";

const FormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formState, setFormState] = useState({});
  const [template, setTemplate] = useState({});
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchFormAndTemplate = async () => {
      try {
        // Fetch the filled form
        const formRes = await api.get(`/forms/${id}`);
        const form = formRes.data;
        setFormState(form);

        // Fetch the associated template
        const templateRes = await api.get(`/templates/${form.templateId}`);
        const templateData = templateRes.data;
        setTemplate(templateData);

        // Determine permissions
        const isFormCreator = user && user.id === form.userId;
        const isTemplateAuthor = user && user.id === templateData.authorId;
        const isAdmin = user && user.isAdmin;

        // Set read-only mode
        if (isAdmin || isFormCreator) {
          setIsReadOnly(false); // Can edit
        } else if (isTemplateAuthor) {
          setIsReadOnly(true); // Read-only
        } else {
          // No tiene permisos para ver el formulario
          setError(t("accessDenied") || "Access denied.");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching form or template:", err);
        setError(t("formNotFound") || "Form not found.");
        setLoading(false);
      }
    };
    fetchFormAndTemplate();
  }, [id, user, t]);

  const handleInputChange = (questionId, value) => {
    setFormState((prevState) => ({
      ...prevState,
      answers: {
        ...prevState.answers,
        [questionId]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/forms/${id}`, {
        answers: formState.answers,
      });
      toast({
        title: t("formUpdated"),
        description: t("formUpdatedSuccessfully"),
      });
      navigate(-1);
    } catch (error) {
      console.error(
        "Error updating form:",
        error.response?.data || error.message
      );
      toast({
        title: t("formUpdateFailed"),
        description:
          error.response?.data?.message || t("formUpdateFailedDescription"),
        variant: "destructive",
      });
    }
  };

  /*   const handleDelete = async () => {
    try {
      await api.delete(`/forms/${id}`);
      toast({
        title: t("formDeleted"),
        description: t("formDeletedSuccessfully"),
      });
      navigate(-1);
    } catch (error) {
      console.error(
        "Error deleting form:",
        error.response?.data || error.message
      );
      toast({
        title: t("formDeleteFailed"),
        description:
          error.response?.data?.message || t("formDeleteFailedDescription"),
        variant: "destructive",
      });
    }
  }; */

  if (loading) {
    return <div className="mt-10 ml-10">{t("loading")}</div>;
  }

  if (error) {
    return <div className="text-red-500 mt-10 ml-10">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-accent text-2xl font-bold mb-4">
        {isReadOnly ? t("viewForm") : t("editForm")}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-6 border-2 border-accent rounded-3xl dark:bg-zinc-900 shadow-md "
      >
        {/* Show template Info */}
        <div className="mb-6">
          <Label className="text-accent text-xl font-bold">
            {t("templateTitle")}
          </Label>
          <p className="mt-1 text-lg">{template.title}</p>
        </div>
        {/* Show information about the user who filled out the form */}
        <div className="mb-6">
          <Label className="text-accent text-xl font-bold">
            {t("filledBy")}
          </Label>
          <p className="mt-1 text-lg">{formState.user.name}</p>
        </div>
        {/* Creation date */}
        <div className="mb-6">
          <Label className="text-accent text-xl font-bold">{t("date")}</Label>
          <p className="mt-1 text-lg">
            {new Date(formState.createdAt).toLocaleDateString()}
          </p>
        </div>
        {/* Show questions and answers */}
        {template.questions.map((question, index) => {
          const answer = formState.answers[question.id];
          return (
            <div key={question.id} className="mb-6">
              <Label className="text-accent text-xl font-bold">
                {`${index + 1}. ${question.title}`}
              </Label>
              {question.type === "multi-line" ? (
                <Textarea
                  className="mt-2 text-lg"
                  value={answer || ""}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  readOnly={isReadOnly}
                  required
                />
              ) : question.type === "single-line" ? (
                <Input
                  className="mt-2 text-lg"
                  type="text"
                  value={answer || ""}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  readOnly={isReadOnly}
                  required
                />
              ) : question.type === "positive-integer" ? (
                <Input
                  className="mt-2 text-lg"
                  type="number"
                  min="1"
                  value={answer || ""}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  readOnly={isReadOnly}
                  required
                />
              ) : question.type === "checkbox" ? (
                question.options.map((option, idx) => (
                  <div key={idx} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={answer?.includes(option)}
                      onChange={(e) => {
                        let updatedAnswer = answer || [];
                        if (e.target.checked) {
                          updatedAnswer = [...updatedAnswer, option];
                        } else {
                          updatedAnswer = updatedAnswer.filter(
                            (opt) => opt !== option
                          );
                        }
                        handleInputChange(question.id, updatedAnswer);
                      }}
                      disabled={isReadOnly}
                    />
                    <Label className="ml-2">{option}</Label>
                  </div>
                ))
              ) : question.type === "select" ? (
                <select
                  className="mt-2 text-lg w-full dark:bg-zinc-800"
                  value={answer || ""}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  disabled={isReadOnly}
                  required
                >
                  <option value="" disabled>
                    {t("selectAnOption")}
                  </option>
                  {question.options.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          );
        })}
        {/* Actions Buttons */}
        {!isReadOnly && (
          <Button type="submit" className="w-full p-6 text-lg">
            {t("updateForm")}
          </Button>
        )}
      </form>
      {/* Button delete */}
      {/*    {!isReadOnly && (
        <Button
          variant="destructive"
          className="mt-4 w-full p-6 text-lg"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          {t("deleteForm")}
        </Button>
      )} */}
      {/* Delete Dialog */}
      {/*       <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteForm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteFormConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </div>
  );
};

export default FormPage;

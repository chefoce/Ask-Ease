import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const FormFill = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/templates/${id}`);
        setTemplate(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(t("templateNotFound") || "Template not found");
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, t]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Limpiar el error al cambiar el valor
    setErrors((prev) => ({ ...prev, [questionId]: undefined }));
  };

  const validateAnswers = () => {
    const newErrors = {};
    template.questions.forEach((question) => {
      const value = answers[question.id];
      // Asumiendo que todas las preguntas son obligatorias
      if (value === undefined || value === null || value === "") {
        newErrors[question.id] =
          t("fieldIsRequired") || "This field is required.";
      } else if (question.type === "positive-integer") {
        const intValue = parseInt(value, 10);
        if (isNaN(intValue) || intValue < 1) {
          newErrors[question.id] =
            t("enterPositiveInteger") || "Please enter a positive integer.";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAnswers()) {
      return;
    }
    try {
      await api.post(`/forms`, {
        templateId: id,
        answers,
      });
      navigate(`/templates/${id}`);
    } catch (err) {
      console.error(err);
      setError(t("formSubmissionFailed") || "Form submission failed");
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return <div>{t("loading") || "Loading..."}</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t("error") || "Error"}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto p-6 border-2 border-accent rounded-3xl dark:bg-zinc-900 shadow-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              {t("fillOutForm") || "Fill out the form"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {template.questions.map((question) => (
              <div key={question.id} className="mb-6">
                <Label className="block mb-2 font-semibold">
                  {question.title} <span className="text-red-600">*</span>
                </Label>
                {question.description && (
                  <p className="text-sm mb-2">{question.description}</p>
                )}
                {renderInputField(
                  question,
                  answers[question.id],
                  handleChange,
                  t
                )}
                {errors[question.id] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[question.id]}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit">{t("submit") || "Submit"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

const renderInputField = (question, value, handleChange, t) => {
  switch (question.type) {
    case "single-line":
      return (
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => handleChange(question.id, e.target.value)}
          aria-required="true"
        />
      );
    case "multi-line":
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => handleChange(question.id, e.target.value)}
          aria-required="true"
        />
      );
    case "positive-integer":
      return (
        <Input
          type="number"
          min="1"
          step="1"
          value={value || ""}
          onChange={(e) => handleChange(question.id, e.target.value)}
          aria-required="true"
        />
      );
    case "checkbox":
      return (
        <div>
          {question.options &&
            question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  className="mb-1"
                  id={`${question.id}-${index}`}
                  checked={value?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    let newValue = value ? [...value] : [];
                    if (checked) {
                      newValue.push(option);
                    } else {
                      newValue = newValue.filter((val) => val !== option);
                    }
                    handleChange(question.id, newValue);
                  }}
                  aria-required="true"
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          {(!question.options || question.options.length === 0) && (
            <p className="text-sm text-red-600">
              {t("noOptionsAvailable") || "No options available."}
            </p>
          )}
        </div>
      );
    case "select":
      return (
        <Select
          value={value}
          onValueChange={(val) => handleChange(question.id, val)}
        >
          <SelectTrigger aria-required="true">
            <SelectValue
              placeholder={t("selectAnOption") || "Select an option"}
            />
          </SelectTrigger>
          <SelectContent>
            {question.options &&
              question.options.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      );
    default:
      return null;
  }
};

export default FormFill;

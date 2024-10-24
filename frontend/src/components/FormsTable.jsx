import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit2, Trash2 } from "lucide-react";

const FormsTable = ({ forms = [] }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [formList, setFormList] = useState(forms);

  const handleDelete = async (formId) => {
    if (
      window.confirm(
        t("confirmDeleteForm") || "Are you sure you want to delete this form?"
      )
    ) {
      try {
        await api.delete(`/forms/${formId}`);
        // Update the list of forms after deletion
        setFormList((prevForms) =>
          prevForms.filter((form) => form.id !== formId)
        );
      } catch (err) {
        console.error(err);
        alert(t("deleteFormFailed") || "Failed to delete the form.");
      }
    }
  };

  return (
    <div className="min-w-full bg-gray-300 dark:bg-zinc-600 border border-gray-300 dark:border-white rounded-lg">
      <Table>
        <TableHeader className="text-lg font-bold">
          <TableRow>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              #
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("user")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("template")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("date")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("questions")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("actions")}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formList.length > 0 ? (
            formList.map((form, index) => {
              const isFormCreator = user && user.id === form.userId;
              const canEdit = isFormCreator || (user && user.isAdmin);

              // Get the questions to display in the table for this form
              const questionsToShow = form.template.questions.filter(
                (q) => q.showInTable
              );

              return (
                <TableRow
                  key={form.id}
                  className={
                    index % 2 === 0
                      ? "bg-gray-100 dark:bg-zinc-800"
                      : "bg-white dark:bg-zinc-900"
                  }
                >
                  <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                    {form.user.name}
                  </TableCell>
                  <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                    {form.template.title}
                  </TableCell>
                  <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                    {new Date(form.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                    {questionsToShow.map((question) => (
                      <div key={question.id}>
                        <strong>{question.title}:</strong>{" "}
                        {form.answers[question.id]}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                    <div className="flex space-x-2">
                      <Link
                        to={`/forms/${form.id}`}
                        className="text-accent hover:text-green-300"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      {canEdit && (
                        <>
                          <Link
                            to={`/forms/${form.id}`}
                            className="text-accent hover:text-blue-500"
                          >
                            <Edit2 className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(form.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan="6" className="py-2 px-4 border-b text-center">
                {t("noFormsAvailable") || "No forms available."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

FormsTable.propTypes = {
  forms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      userId: PropTypes.string.isRequired,
      user: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }).isRequired,
      template: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        author: PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
        }).isRequired,
        questions: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            showInTable: PropTypes.bool.isRequired,
          })
        ).isRequired,
      }).isRequired,
      createdAt: PropTypes.string.isRequired,
      answers: PropTypes.object.isRequired,
    })
  ).isRequired,
};

export default FormsTable;

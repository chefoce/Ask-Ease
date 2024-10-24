import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";

const TemplateTable = ({ templates }) => {
  const { t } = useTranslation();

  return (
    <div className="min-w-full bg-gray-300 dark:bg-zinc-600 border border-gray-300 dark:border-white rounded-lg">
      <Table>
        <TableHeader className="text-lg font-bold">
          <TableRow>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("title")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("description")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("tags")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("createdAt")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("actions")}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template, index) => (
            <TableRow
              key={template.id}
              className={
                index % 2 === 0
                  ? "bg-gray-100 dark:bg-zinc-800"
                  : "bg-white dark:bg-zinc-900"
              }
            >
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {template.title}
              </TableCell>
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {template.description}
              </TableCell>
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {template.tags.join(", ")}
              </TableCell>
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {new Date(template.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="py-2 px-10 border-b border-gray-300 dark:border-white">
                <Link
                  to={`/templates/${template.id}`}
                  className="text-accent hover:text-green-300"
                >
                  <Eye className="h-7 w-7" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

TemplateTable.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      topicId: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default TemplateTable;

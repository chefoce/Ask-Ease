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

const TicketsTable = ({ tickets }) => {
  const { t } = useTranslation();

  return (
    <div className="min-w-full bg-gray-300 dark:bg-zinc-600 border border-gray-300 dark:border-white rounded-lg">
      <Table>
        <TableHeader className="text-lg font-bold">
          <TableRow>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("summary")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("priority")}
            </TableCell>
            <TableCell className="py-2 px-5 border-b border-gray-300 dark:border-white">
              {t("status")}
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
          {tickets.map((ticket, index) => (
            <TableRow
              key={ticket.id}
              className={
                index % 2 === 0
                  ? "bg-gray-100 dark:bg-zinc-800"
                  : "bg-white dark:bg-zinc-900"
              }
            >
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {ticket.summary}
              </TableCell>
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {ticket.priority}
              </TableCell>
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {ticket.status}
              </TableCell>
              <TableCell className="py-2 px-6 border-b border-gray-300 dark:border-white">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="py-2 px-10 border-b border-gray-300 dark:border-white">
                <Link
                  to={`${ticket.link}`}
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

TicketsTable.propTypes = {
  tickets: PropTypes.array.isRequired,
};

export default TicketsTable;

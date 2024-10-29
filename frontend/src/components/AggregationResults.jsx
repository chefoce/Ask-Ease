import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../utils/api";
import { useTranslation } from "react-i18next";

const AggregationResults = ({ templateId }) => {
  const { t } = useTranslation();
  const [aggregation, setAggregation] = useState({});
  const [metaData, setMetaData] = useState({
    responseCount: 0,
    lastResponseDate: null,
    lastResponder: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAggregation = async () => {
      try {
        const res = await api.get(`/aggregation/template/${templateId}`);
        setAggregation(res.data.aggregation);
        setMetaData({
          responseCount: res.data.responseCount,
          lastResponseDate: res.data.lastResponseDate,
          lastResponder: res.data.lastResponder,
        });
      } catch (err) {
        console.error(err);
        setError(
          t("failedToLoadAggregation") || "Failed to load aggregation results."
        );
      }
    };

    fetchAggregation();
  }, [templateId]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${formattedDate} ${formattedTime}`;
  };

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (Object.keys(aggregation).length === 0) {
    return <div>{t("noAggregationData")}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold">{t("formMetaData")}</h2>
      <p>
        <strong>{t("responseCount")}:</strong> {metaData.responseCount}
      </p>
      <p>
        <strong>{t("lastResponseDate")}:</strong>{" "}
        {formatDateTime(metaData.lastResponseDate)}
      </p>
      <p>
        <strong>{t("lastResponder")}:</strong> {metaData.lastResponder || "N/A"}
      </p>

      {Object.entries(aggregation).map(([questionTitle, result]) => (
        <div key={questionTitle} className="mb-4 mt-5">
          <h3 className="text-xl font-bold">{questionTitle}</h3>
          {Object.entries(result).map(([key, value]) => (
            <p key={key}>
              <strong>{t(key)}:</strong> {value}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};

AggregationResults.propTypes = {
  templateId: PropTypes.string.isRequired,
};

export default AggregationResults;

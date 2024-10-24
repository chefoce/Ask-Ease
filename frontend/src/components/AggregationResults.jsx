import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../utils/api";
import { useTranslation } from "react-i18next";

const AggregationResults = ({ templateId }) => {
  const { t } = useTranslation();
  const [aggregation, setAggregation] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAggregation = async () => {
      try {
        const res = await api.get(`/aggregation/template/${templateId}`);
        setAggregation(res.data);
      } catch (err) {
        console.error(err);
        setError(
          t("failedToLoadAggregation") || "Failed to load aggregation results."
        );
      }
    };

    fetchAggregation();
  }, [templateId]);

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (Object.keys(aggregation).length === 0) {
    return <div>{t("noAggregationData")}</div>;
  }

  return (
    <div>
      {Object.entries(aggregation).map(([questionTitle, result]) => (
        <div key={questionTitle} className="mb-4">
          <h3 className="text-xl font-semibold">{questionTitle}</h3>
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

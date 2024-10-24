import { useEffect, useState } from "react";
import api from "../utils/api";
import { Link } from "react-router-dom";
import React from "react";

const TagCloud = () => {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    api
      .get("/tags")
      .then((res) => {
        setTags(res.data);
      })
      .catch((err) => {
        console.error("Error fetching tags:", err);
      });
  }, []);

  return (
    <div className="flex flex-wrap space-x-2">
      {tags.map((tag) => (
        <Link
          to={`/search?tag=${tag}`}
          key={tag}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
};

export default React.memo(TagCloud);

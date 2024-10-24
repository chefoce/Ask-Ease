import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import PropTypes from "prop-types";

const CommentList = ({ templateId }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    // Fetch initial comments
    api.get(`/comments/template/${templateId}`).then((res) => {
      setComments(res.data);
    });
    // Setup Socket for real-time updates
    const socket = io(
      import.meta.env.VITE_REACT_APP_SOCKET_URL || "http://localhost:5000"
    );

    socket.emit("joinTemplate", templateId);

    socket.on("newComment", (comment) => {
      setComments((prevComments) => [...prevComments, comment]);
    });

    return () => {
      socket.disconnect();
    };
  }, [templateId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await api.post("/comments", {
        templateId,
        content,
      });
      setContent("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">{t("comments")}</h3>
      {user && (
        <form onSubmit={handleSubmit} className="mb-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-3 dark:bg-gray-700"
            placeholder={t("addComment")}
          />
          <Button type="submit">{t("submit")}</Button>
        </form>
      )}
      <ul>
        {comments.map((comment) => (
          <li key={comment.id} className="border-b py-2">
            <p className="text-sm text-gray-500">
              {comment.user.name} -{" "}
              {new Date(comment.createdAt).toLocaleString()}
            </p>
            <p className="dark:text-gray-300">{comment.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

CommentList.propTypes = {
  templateId: PropTypes.string.isRequired,
};

export default CommentList;

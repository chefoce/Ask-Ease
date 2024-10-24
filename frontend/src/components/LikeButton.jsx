import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const LikeButton = ({ templateId }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await api.get(`/likes/template/${templateId}`);
        setLikesCount(res.data.count);
        if (user) {
          const userHasLiked = res.data.users.includes(user.id);
          setLiked(userHasLiked);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchLikes();
  }, [templateId, user]);

  const handleLike = async () => {
    if (!user) {
      alert(t("mustBeLoggedInToLike"));
      return;
    }

    try {
      if (liked) {
        await api.delete(`/likes/${templateId}`);
        setLikesCount((prev) => prev - 1);
      } else {
        await api.post("/likes", { templateId });
        setLikesCount((prev) => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`p-2 rounded ${liked ? "text-red-600" : "text-gray-600"}`}
    >
      ❤️ {likesCount}
    </button>
  );
};

LikeButton.propTypes = {
  templateId: PropTypes.string.isRequired,
};

export default LikeButton;

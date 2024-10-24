import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

const TagInput = ({ tags, setTags, existingTags }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const lastTag = value.split(",").pop().trim().toLowerCase();
    if (lastTag !== "") {
      const filteredSuggestions = existingTags.filter((tag) =>
        tag.toLowerCase().includes(lastTag)
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTags(inputValue);
    } else if (e.key === "Backspace" && inputValue === "") {
      removeTag(tags.length - 1);
    }
  };

  const addTags = (value) => {
    const newTags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "" && !tags.includes(tag));

    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
    }

    setInputValue("");
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion) => {
    if (!tags.includes(suggestion)) {
      setTags([...tags, suggestion]);
    }
    setInputValue("");
    setSuggestions([]);
    inputRef.current.focus();
  };

  const removeTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap mb-1">
        {tags.map((tag, index) => (
          <div
            key={tag}
            className="m-1 flex items-center bg-gray-200 dark:bg-zinc-800 px-2 py-1 rounded-full"
          >
            <span className="text-sm">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-2 text-red-500"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("enterTags")}
          className="w-full dark:bg-zinc-800 text-lg"
          ref={inputRef}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border rounded shadow-md max-h-40 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                onClick={() => handleSuggestionClick(suggestion)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSuggestionClick(suggestion);
                  }
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
TagInput.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  setTags: PropTypes.func.isRequired,
  existingTags: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default TagInput;

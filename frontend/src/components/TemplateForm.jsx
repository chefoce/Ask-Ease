import { useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import TagInput from "@/components/TagInput";
import ImageUploadWithCrop from "./ImageUploadWithCrop";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import MarkdownIt from "markdown-it";
import { X } from "lucide-react";
import AsyncSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import ThemeContext from "../context/ThemeContext";

const mdParser = new MarkdownIt();

const TemplateForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [topics, setTopics] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    topicId: "",
    tags: [],
    isPublic: true,
    accessUserIds: [],
    questions: [
      {
        id: uuidv4(),
        title: "",
        description: "",
        type: "single-line",
        options: [],
        showInTable: false,
      },
    ],
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [resetImageUpload, setResetImageUpload] = useState(false);
  const [displayUserField, setDisplayUserField] = useState("name");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleImageCropped = (image) => {
    setFormState({ ...formState, image: image });
  };

  const handleRemoveImage = () => {
    setFormState({ ...formState, image: null });
    setResetImageUpload((prev) => !prev); //
  };

  const { toast } = useToast();
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogDescription, setDialogDescription] = useState("");
  const { theme } = useContext(ThemeContext);

  const loadUserOptions = async (inputValue) => {
    if (!inputValue.trim()) {
      return [];
    }
    try {
      const response = await api.get(`/users/autocomplete`, {
        params: { query: inputValue },
      });
      // Filter selected users by name or email
      const filteredUsers = response.data.filter(
        (user) =>
          !selectedUsers.some(
            (selected) =>
              selected.value === user.id ||
              (displayUserField === "name"
                ? selected.name === user.name
                : selected.email === user.email)
          )
      );

      return filteredUsers.map((user) => ({
        value: user.id,
        label: displayUserField === "name" ? user.name : user.email,
        name: user.name,
        email: user.email,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  useEffect(() => {
    // Fetch topics and existing tags
    const fetchData = async () => {
      try {
        const [topicsRes, tagsRes] = await Promise.all([
          api.get("/topics"),
          api.get("/tags"),
        ]);
        setTopics(topicsRes.data);
        setExistingTags(tagsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      if (id) {
        // Editing existing template
        try {
          const res = await api.get(`/templates/${id}`);
          const template = res.data;
          const usersWithAccess = template.accessUsers || [];
          setFormState({
            title: template.title,
            description: template.description,
            topicId: template.topic.id,
            tags: template.tags,
            isPublic: template.isPublic,
            accessUserIds: usersWithAccess.map((user) => user.id),
            questions: template.questions,
            image: template.imageUrl || null,
          });
          setSelectedUsers(
            usersWithAccess.map((user) => ({
              value: user.id,
              label: displayUserField === "name" ? user.name : user.email,
              name: user.name,
              email: user.email,
            }))
          );
          setLoading(false);
        } catch (error) {
          console.error("Error fetching template:", error);
          setLoading(false);
        }
      } else {
        // Creating new template
        setFormState({
          title: "",
          description: "",
          topicId: "",
          tags: [],
          isPublic: true,
          accessUserIds: [],
          questions: [
            {
              id: uuidv4(),
              title: "",
              description: "",
              type: "single-line",
              options: [],
              showInTable: false,
            },
          ],
          image: null,
        });
        setSelectedUsers([]);
        setLoading(false);
      }
    };
    initializeForm();
  }, [id]);

  useEffect(() => {
    if (!loading && selectedUsers.length > 0) {
      setSelectedUsers((prevSelectedUsers) =>
        prevSelectedUsers.map((user) => ({
          ...user,
          label: displayUserField === "name" ? user.name : user.email,
        }))
      );
    }
  }, [displayUserField]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const updatedQuestions = Array.from(formState.questions);
    const [movedQuestion] = updatedQuestions.splice(result.source.index, 1);
    updatedQuestions.splice(result.destination.index, 0, movedQuestion);
    setFormState({ ...formState, questions: updatedQuestions });
  };

  const handleAddQuestion = () => {
    setFormState({
      ...formState,
      questions: [
        ...formState.questions,
        {
          id: uuidv4(),
          title: "",
          description: "",
          type: "single-line",
          options: [],
          showInTable: false,
        },
      ],
    });
  };

  const handleRemoveQuestion = (index) => {
    if (formState.questions.length <= 1) {
      setDialogTitle(t("minQuestionsReachedTitle"));
      setDialogDescription(t("minQuestionsReachedDescription"));
      setIsDialogOpen(true);
      return;
    }
    const updatedQuestions = formState.questions.filter((_, i) => i !== index);
    setFormState({ ...formState, questions: updatedQuestions });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formState.questions];
    updatedQuestions[index][field] = value;

    if (field === "type" && (value === "checkbox" || value === "select")) {
      updatedQuestions[index].options = updatedQuestions[index].options || [""];
    }

    setFormState({ ...formState, questions: updatedQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const processedQuestions = formState.questions.map((question) => ({
      title: question.title || "",
      description: question.description || "",
      type: question.type || "single-line",
      options: question.options || [],
      showInTable: question.showInTable || false,
    }));

    const payload = {
      title: formState.title,
      description: formState.description,
      topicId: formState.topicId,
      tags: formState.tags || [],
      isPublic: formState.isPublic,
      accessUserIds: formState.isPublic ? [] : formState.accessUserIds || [],
      questions: processedQuestions,
    };

    // FormData initialization
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("topicId", payload.topicId.toString());
    formData.append("isPublic", payload.isPublic.toString());
    formData.append("tags", JSON.stringify(payload.tags));
    formData.append("accessUserIds", JSON.stringify(payload.accessUserIds));
    formData.append("questions", JSON.stringify(payload.questions));

    if (formState.image) {
      if (formState.image instanceof File) {
        formData.append("image", formState.image, formState.image.name);
      }
    }
    try {
      if (id) {
        await api.put(`/templates/${id}`, formData);
        toast({
          title: t("templateUpdated"),
          description: t("templateUpdatedSuccessfully"),
        });
      } else {
        await api.post("/templates", formData);
        toast({
          title: t("templateCreated"),
          description: t("templateCreatedSuccessfully"),
        });
      }
      navigate("/profile");
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response?.data || error.message
      );
      setDialogTitle(t("formSubmissionFailedTitle"));
      setDialogDescription(
        error.response?.data?.message || t("formSubmissionFailedDescription")
      );
      setIsDialogOpen(true);
    }
  };

  if (loading) {
    return <div>{t("loading")}</div>;
  }

  const isDarkMode = theme === "dark";
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.selectProps.isDarkMode ? "#27272a" : "#fff",
      borderColor: state.isFocused ? "#1db954" : "#cbd5e0",
    }),
    input: (provided, state) => ({
      ...provided,
      backgroundColor: state.selectProps.isDarkMode ? "#27272a" : "#fff",

      color: state.selectProps.isDarkMode ? "#e2e8f0" : "#1a202c",
    }),
    menu: (provided, state) => ({
      ...provided,
      backgroundColor: state.selectProps.isDarkMode ? "#27272a" : "#fff",
      color: state.selectProps.isDarkMode ? "#e2e8f0" : "#1a202c",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#1db954"
        : state.isFocused
          ? "#1db954e"
          : state.selectProps.isDarkMode
            ? "#27272a"
            : "#fff",
      color: state.selectProps.isDarkMode ? "#e2e8f0" : "#1a202c",
    }),
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-accent text-2xl font-bold mb-4">
        {id ? t("editTemplate") : t("createTemplate")}
      </h2>
      {formState.image && (
        <div className="relative mb-4 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <img
              src={id ? formState.image : URL.createObjectURL(formState.image)}
              alt="Header"
              className="w-full h-auto object-cover rounded-md shadow-lg"
            />
            <button
              type="button"
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              onClick={() => {
                handleRemoveImage();
                document.querySelector(".relative.mt-4 button").click();
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-6 border-2 border-accent rounded-3xl dark:bg-zinc-900 shadow-md "
        encType="multipart/form-data"
      >
        {/* Title */}
        <div className="mb-6">
          <Label htmlFor="title" className="text-accent text-xl font-bold">
            {t("title")}
          </Label>
          <Input
            type="text"
            name="title"
            id="title"
            className="mt-1 dark:bg-zinc-800 text-lg"
            value={formState.title}
            onChange={(e) =>
              setFormState({ ...formState, title: e.target.value })
            }
            required
            placeholder={t("templateTitle")}
          />
        </div>
        {/* Description */}
        <div className="mb-6">
          <div className="flex mb-4">
            <Label className="text-accent text-xl font-bold mr-4">
              {t("description")}
            </Label>
            <div className="ml-auto flex items-center">
              <span className="mr-2">{t("useMarkdown")}</span>
              <Switch checked={isMarkdown} onCheckedChange={setIsMarkdown} />
            </div>
          </div>
          {isMarkdown ? (
            <MdEditor
              className="rounded "
              value={formState.description}
              style={{ height: "300px" }}
              renderHTML={(text) => mdParser.render(text)}
              onChange={({ text }) =>
                setFormState({ ...formState, description: text })
              }
            />
          ) : (
            <Textarea
              value={formState.description}
              onChange={(e) =>
                setFormState({ ...formState, description: e.target.value })
              }
              rows={10}
              className="w-full mt-1 dark:bg-zinc-800 text-lg"
              placeholder={t("templateDescription")}
              required
            />
          )}
        </div>
        {/* Topic */}
        <div className="mb-6">
          <Label htmlFor="topic" className="text-accent text-xl font-bold">
            {t("topic")}
          </Label>
          <Select
            className="mt-1 dark:bg-zinc-800 text-lg"
            value={formState.topicId}
            onValueChange={(value) =>
              setFormState({ ...formState, topicId: value })
            }
            required
          >
            <SelectTrigger className="mt-2 dark:bg-zinc-800 text-lg dark:text-gray-400">
              <SelectValue placeholder={t("selectTopic")} />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Tags */}
        <div className="mb-6">
          <Label className="text-accent text-xl font-bold">{t("tags")}</Label>
          <TagInput
            tags={formState.tags}
            setTags={(newTags) => setFormState({ ...formState, tags: newTags })}
            existingTags={existingTags}
          />
        </div>
        {/* Image Upload */}
        <div className="mb-6">
          <ImageUploadWithCrop
            onImageCropped={handleImageCropped}
            onRemoveImage={handleRemoveImage}
            reset={resetImageUpload}
          />
        </div>
        {/* Access Settings */}
        <div className="mb-6">
          <Label className="text-accent text-xl font-bold">{t("access")}</Label>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              <Switch
                checked={formState.isPublic}
                onCheckedChange={(checked) =>
                  setFormState({ ...formState, isPublic: checked })
                }
              />
              <span className="ml-2">{t("public")}</span>
            </div>
          </div>

          {!formState.isPublic && (
            <div className="mt-4">
              <Label className="text-accent text-xl font-bold">
                {t("selectUsers")}
              </Label>
              {/* Button to switch between name and email */}
              <div className="flex items-center mt-2 mb-2">
                <span>{t("displayBy")}:</span>
                <Button
                  type="button"
                  onClick={() =>
                    setDisplayUserField(
                      displayUserField === "name" ? "email" : "name"
                    )
                  }
                  className="ml-2"
                >
                  {displayUserField === "name" ? t("email") : t("name")}
                </Button>
              </div>

              {/* Autocomplete Component*/}
              <AsyncSelect
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadUserOptions}
                onChange={(selectedOptions) => {
                  const userIds = selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : [];
                  setFormState({ ...formState, accessUserIds: userIds });
                  setSelectedUsers(selectedOptions || []);
                }}
                value={selectedUsers}
                placeholder={t("searchUsers")}
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => option.value}
                components={makeAnimated()}
                styles={customStyles}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="mb-6">
          <Label className="text-accent text-xl font-bold">
            {t("questions")}
          </Label>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {formState.questions.map((question, index) => (
                    <Draggable
                      key={question.id}
                      draggableId={question.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mt-2 mb-4 p-4 border rounded-lg dark:bg-zinc-800"
                        >
                          <Label>{`${t("question")} ${index + 1}`}</Label>
                          <Input
                            className="mt-2 text-lg"
                            type="text"
                            placeholder={t("questionTitle")}
                            value={question.title}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "title",
                                e.target.value
                              )
                            }
                            required
                          />
                          <Textarea
                            className="mt-2 text-lg"
                            placeholder={t("questionDescription")}
                            value={question.description}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                          />
                          <Select
                            value={question.type}
                            onValueChange={(value) =>
                              handleQuestionChange(index, "type", value)
                            }
                          >
                            <SelectTrigger className="mt-2 text-lg">
                              <SelectValue placeholder={t("selectType")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single-line">
                                {t("singleLine")}
                              </SelectItem>
                              <SelectItem value="multi-line">
                                {t("multiLine")}
                              </SelectItem>
                              <SelectItem value="positive-integer">
                                {t("positiveInteger")}
                              </SelectItem>
                              <SelectItem value="checkbox">
                                {t("multipleChoiceCheckbox")}
                              </SelectItem>
                              <SelectItem value="select">
                                {t("selectOneOption")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {/* Options Input for 'checkbox' and 'select' types */}
                          {(question.type === "checkbox" ||
                            question.type === "select") && (
                            <div className="mt-4">
                              <Label className="text-accent mr-4">
                                {t("options")}
                              </Label>
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center mt-2"
                                >
                                  <Input
                                    type="text"
                                    className="flex-1"
                                    value={option}
                                    onChange={(e) => {
                                      const updatedOptions = [
                                        ...question.options,
                                      ];
                                      updatedOptions[optIndex] = e.target.value;
                                      handleQuestionChange(
                                        index,
                                        "options",
                                        updatedOptions
                                      );
                                    }}
                                    placeholder={`${t("option")} ${optIndex + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    className="ml-2"
                                    onClick={() => {
                                      const updatedOptions =
                                        question.options.filter(
                                          (_, i) => i !== optIndex
                                        );
                                      handleQuestionChange(
                                        index,
                                        "options",
                                        updatedOptions
                                      );
                                    }}
                                  >
                                    {t("remove")}
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                className="mt-2"
                                onClick={() => {
                                  const updatedOptions = [
                                    ...question.options,
                                    "",
                                  ];
                                  handleQuestionChange(
                                    index,
                                    "options",
                                    updatedOptions
                                  );
                                }}
                              >
                                {t("addOption")}
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center mt-4">
                            <Checkbox
                              checked={question.showInTable}
                              onCheckedChange={(checked) =>
                                handleQuestionChange(
                                  index,
                                  "showInTable",
                                  checked
                                )
                              }
                            />
                            <Label className="ml-2">{t("showInTable")}</Label>
                          </div>
                          {formState.questions.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => handleRemoveQuestion(index)}
                              className="mt-4"
                            >
                              {t("removeQuestion")}
                            </Button>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <Button type="button" onClick={handleAddQuestion} className="mt-1">
            {t("addQuestion")}
          </Button>
        </div>
        {/* Submit Button */}
        <Button type="submit" className="w-full p-6 text-lg">
          {id ? t("updateTemplate") : t("createTemplate")}
        </Button>
      </form>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p>{dialogDescription}</p>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsDialogOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateForm;

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cropper } from "react-cropper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "cropperjs/dist/cropper.css";
import { X } from "lucide-react";

const ImageUploadWithCrop = ({ onImageCropped, onRemoveImage, reset }) => {
  const { t } = useTranslation();
  const [image, setImage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cropper, setCropper] = useState(null);
  const [croppedImage, setCroppedImage] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".tiff", ".webp"],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setIsDialogOpen(true);
      };
      reader.readAsDataURL(file);
    },
    onDropRejected: (fileRejections) => {
      const errorMessages = fileRejections
        .map((rejection) => {
          const { file, errors } = rejection;
          return errors.map((e) => `• ${file.name}: ${e.message}`).join("\n");
        })
        .join("\n");

      setErrorMessage(errorMessages);
      setIsErrorDialogOpen(true);
    },
  });

  useEffect(() => {
    if (reset) {
      setCroppedImage("");
      setImage(null);
    }
  }, [reset]);

  const handleCrop = () => {
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      croppedCanvas.toBlob(
        (blob) => {
          const file = new File([blob], "cropped_image.png", {
            type: "image/png",
          });
          const imageUrl = URL.createObjectURL(file);
          setCroppedImage(imageUrl);
          onImageCropped(file);
          setIsDialogOpen(false);
        },
        "image/png",
        1
      );
    }
  };

  const handleRemoveImage = () => {
    setCroppedImage("");
    setImage(null);
    onImageCropped(null);
    onRemoveImage();
  };

  return (
    <div className="mb-6">
      <Label className="text-accent text-xl font-bold">
        {t("uploadImage")}
      </Label>
      <div
        {...getRootProps()}
        className="border-dashed border-2 p-4 rounded-md text-center cursor-pointer mt-1 dark:bg-zinc-800"
      >
        <Input {...getInputProps({ name: "", form: "" })} />
        <p className="text-gray-400">{t("dragAndDropImage")}</p>
      </div>
      {croppedImage && (
        <div className="mt-4">
          <Label>{t("selectedImage")}</Label>
          <div className="flex">
            <img
              src={croppedImage}
              alt="Cropped"
              className="w-24 h-12 object-cover mt-2"
            />
            <Button
              type="button"
              className="h-5 ml-2 bg-red-500 text-white p-1 rounded-full"
              onClick={handleRemoveImage}
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>{t("cropImage")}</DialogTitle>
          <DialogDescription>{t("selectAreaCrop")}</DialogDescription>
          {image && (
            <Cropper
              src={image}
              style={{ height: 150, width: "100%" }}
              aspectRatio={16 / 9}
              viewMode={1}
              guides={false}
              scalable={false}
              cropBoxResizable={false}
              onInitialized={(instance) => setCropper(instance)}
            />
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleCrop}>
              {t("cropSave")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogTitle>{t("invalidFileType")}</DialogTitle>
          <DialogDescription>
            {t("onlyImagesAllowed")}
            <pre className="mt-2 whitespace-pre-wrap">{errorMessage}</pre>
          </DialogDescription>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsErrorDialogOpen(false)}
            >
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

ImageUploadWithCrop.propTypes = {
  onImageCropped: PropTypes.func.isRequired,
  onRemoveImage: PropTypes.func.isRequired,
  reset: PropTypes.bool.isRequired,
};

export default ImageUploadWithCrop;

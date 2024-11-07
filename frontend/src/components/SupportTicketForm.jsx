import { useState } from "react";
import PropTypes from "prop-types";
import api from "../utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const SupportTicketForm = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    summary: "",
    priority: "lowest",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/jira/tickets", {
        ...formData,
        link: window.location.href,
      });
      toast({
        title: t("ticketCreated"),
        description: t("ticketCreatedSuccessfully"),
      });
      onClose();
    } catch (error) {
      toast({
        title: t("error"),
        description: error.response?.data?.message || t("ticketCreationFailed"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createSupportTicket")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("summary")}</Label>
            <Input
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label>{t("priority")}</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger className="w-full mt-2 mb-3">
                <SelectValue placeholder={t("selectOption")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Highest">{t("highest")}</SelectItem>
                <SelectItem value="High">{t("high")}</SelectItem>
                <SelectItem value="Low">{t("low")}</SelectItem>
                <SelectItem value="Lowest">{t("lowest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" type="submit">
            {t("submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

SupportTicketForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

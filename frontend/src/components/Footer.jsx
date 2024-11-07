import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SupportTicketForm } from "./SupportTicketForm";
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const { t } = useTranslation();
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);

  const openTicketForm = () => {
    setIsTicketFormOpen(true);
  };

  return (
    <footer className="border-2 border-accent rounded-3xl mt-1 mb-2">
      <div className="container mx-auto p-4 text-center">
        <Button onClick={openTicketForm} className="mb-4">
          <MessageCircleQuestion className="mr-1" />
          {t("createSupportTicket")}
        </Button>

        <SupportTicketForm
          isOpen={isTicketFormOpen}
          onClose={() => setIsTicketFormOpen(false)}
        />
        <p>
          © {new Date().getFullYear()} {t("appName")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;

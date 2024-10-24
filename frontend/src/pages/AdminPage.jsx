import { useState, useEffect, useContext } from "react";
import api from "../utils/api";
import AuthContext from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  LockKeyhole,
  LockKeyholeOpen,
  Trash2,
  UserPlus,
  UserMinus,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const AdminPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [setError] = useState("");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        setError(t("failedToFetchUsers"));
        toast({
          title: t("error"),
          description: t("failedToFetchUsers"),
          variant: "destructive",
        });
      }
    };
    fetchUsers();
  }, [t, toast]);

  const handleBlockToggle = (userId, isBlocked) => {
    setSelectedUser({ id: userId, isBlocked });
    setDialogAction("block");
    setIsDialogOpen(true);
  };

  const handleAdminToggle = (userId, isAdmin) => {
    setSelectedUser({ id: userId, isAdmin });
    setDialogAction("admin");
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (userId) => {
    setSelectedUser({ id: userId });
    setDialogAction("delete");
    setIsDialogOpen(true);
  };

  const confirmDialogAction = async () => {
    if (dialogAction === "block") {
      const { id, isBlocked } = selectedUser;
      try {
        await api.patch(`/admin/users/${id}/block`, {
          isBlocked: !isBlocked,
        });
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === id ? { ...u, isBlocked: !isBlocked } : u
          )
        );
        toast({
          title: t("success"),
          description: t(!isBlocked ? "userBlocked" : "userUnblocked"),
        });
      } catch (err) {
        console.error(err);
        setError(t("failedToUpdateUser"));
        toast({
          title: t("error"),
          description: t("failedToUpdateUser"),
          variant: "destructive",
        });
      }
    } else if (dialogAction === "admin") {
      const { id, isAdmin } = selectedUser;
      try {
        await api.patch(`/admin/users/${id}/admin`, { isAdmin: !isAdmin });
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === id ? { ...u, isAdmin: !isAdmin } : u))
        );
        toast({
          title: t("success"),
          description: t(isAdmin ? "adminRoleRemoved" : "adminRoleGranted"),
        });

        // If the current user has removed their own admin privileges
        if (id === user.id && isAdmin) {
          logout();
          navigate("/");
          toast({
            title: t("loggedOut"),
            description: t("adminPrivilegesRemoved"),
          });
        }
      } catch (err) {
        console.error(err);
        setError(t("failedToUpdateUser"));
        toast({
          title: t("error"),
          description: t("failedToUpdateUser"),
          variant: "destructive",
        });
      }
    } else if (dialogAction === "delete") {
      const { id } = selectedUser;
      try {
        await api.delete(`/admin/users/${id}`);
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
        toast({
          title: t("success"),
          description: t("userDeletedSuccessfully"),
        });

        // If the current user deleted their own account
        if (id === user.id) {
          logout();
          navigate("/");
          toast({
            title: t("loggedOut"),
            description: t("accountDeleted"),
          });
        }
      } catch (err) {
        console.error(err);
        setError(t("failedToDeleteUser"));
        toast({
          title: t("error"),
          description: t("failedToDeleteUser"),
          variant: "destructive",
        });
      }
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{t("adminPanel")}</h1>
      <Table className="min-w-full bg-white dark:bg-gray-800">
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("email")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("role")}</TableHead>
            <TableHead>{t("block")}</TableHead>
            <TableHead>{t("admin")}</TableHead>
            <TableHead>{t("delete")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.isBlocked ? t("blocked") : t("active")}</TableCell>
              <TableCell>{u.isAdmin ? t("admin") : t("user")}</TableCell>

              <>
                <TableCell>
                  <Button
                    variant={u.isBlocked ? "destructive" : ""}
                    onClick={() => handleBlockToggle(u.id, u.isBlocked)}
                    className="mr-2"
                  >
                    {u.isBlocked ? <LockKeyhole /> : <LockKeyholeOpen />}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant={u.isAdmin ? "destructive" : ""}
                    onClick={() => handleAdminToggle(u.id, u.isAdmin)}
                    className="mr-2"
                  >
                    {u.isAdmin ? <UserMinus /> : <UserPlus />}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* AlertDialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === "block"
                ? selectedUser?.isBlocked
                  ? t("confirmUnblockUser")
                  : t("confirmBlockUser")
                : dialogAction === "admin"
                  ? selectedUser?.isAdmin
                    ? t("confirmRemoveAdmin")
                    : t("confirmMakeAdmin")
                  : t("confirmDeleteUser")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === "block"
                ? selectedUser?.isBlocked
                  ? t("confirmUnblockUserDescription")
                  : t("confirmBlockUserDescription")
                : dialogAction === "admin"
                  ? selectedUser?.isAdmin
                    ? t("confirmRemoveAdminDescription")
                    : t("confirmMakeAdminDescription")
                  : t("confirmDeleteUserDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialogAction}>
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;

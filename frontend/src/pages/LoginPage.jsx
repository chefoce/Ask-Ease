import { useState, useContext } from "react";
import api from "../utils/api";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [loginSuccessMessage, setLoginSuccessMessage] = useState("");

  const resetFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setLoginSuccessMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/");
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || t("loginFailed");
      setPassword("");
      setError(errorMessage);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", { name, email, password });
      resetFields();
      setActiveTab("login");
      setLoginSuccessMessage(t("registrationSuccessful"));
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setPassword("");
        let errorMessage = err.response.data.message;
        setError(t(errorMessage));
      } else {
        setPassword("");
        //console.error(err);
        setError(t("registrationFailed"));
      }
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    resetFields();
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="container mx-auto p-4 max-w-md"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">{t("login")}</TabsTrigger>
        <TabsTrigger value="register">{t("register")}</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card className="dark:bg-zinc-700 dark:border-slate-100">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>{t("login")}</CardTitle>
              {loginSuccessMessage && (
                <p className="text-green-600 mb-4">{t(loginSuccessMessage)}</p>
              )}
              {error && <p className="text-red-600 mb-4">{t(error)}</p>}
              <CardDescription>{t("loginDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label={t("email")}
                  className="bg-slate-50 dark:bg-zinc-800 dark:border-slate-100"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-label={t("password")}
                  className="bg-slate-50 dark:bg-zinc-800 dark:border-slate-100"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">
                {t("login")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value="register">
        <Card className="dark:bg-zinc-700 dark:border-slate-100">
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle>{t("register")}</CardTitle>
              {error && <p className="text-red-600 mb-4">{error}</p>}
              <CardDescription>{t("registerDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  aria-label={t("name")}
                  className="bg-slate-50 dark:bg-zinc-800 dark:border-slate-100"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label={t("email")}
                  className="bg-slate-50 dark:bg-zinc-800 dark:border-slate-100"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-label={t("password")}
                  className="bg-slate-50 dark:bg-zinc-800 dark:border-slate-100"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">
                {t("register")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default LoginPage;

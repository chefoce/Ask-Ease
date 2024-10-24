import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import TemplatePage from "./pages/TemplatePage";
import TemplateForm from "./components/TemplateForm";
import FormFill from "./pages/FormFill";
import UserProfilePage from "./pages/UserProfilePage";
import AdminPage from "./pages/AdminPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivateRoute from "./utils/PrivateRoute";
import AdminRoute from "./utils/AdminRoute";
import FormPage from "./pages/FormPage";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/templates/create" element={<TemplateForm />} />
      <Route path="/templates/edit/:id" element={<TemplateForm />} />
      <Route path="/templates/:id" element={<TemplatePage />} />
      <Route
        path="/templates/fill/:id"
        element={
          <PrivateRoute>
            <FormFill />
          </PrivateRoute>
        }
      />
      <Route
        path="/forms/view/:id"
        element={
          <PrivateRoute>
            <FormPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/forms/edit/:id"
        element={
          <PrivateRoute>
            <FormPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <UserProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;

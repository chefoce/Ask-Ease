import { useContext } from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Si el estado de user es undefined, aún estamos cargando
  if (user === null) {
    return <div>Loading...</div>; // Puedes mostrar un indicador de carga personalizado
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;

 import { useContext } from "react";
  import AuthContext from "./AuthContext";  // Ruta correcta de tu AuthContext
  
  const useAuth = () => {
    const context = useContext(AuthContext);
    return context;  // Regresamos todo el contexto
  };
  
  export default useAuth;
  
import React, { createContext, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setearAuth] = useState({});  // Aquí definimos setearAuth

  const logout = () => {
    setearAuth({});
    sessionStorage.setItem("username", "loggedOut");  // Puede que necesites usar AsyncStorage para React Native
  };

  return (
    <AuthContext.Provider value={{ auth, setearAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

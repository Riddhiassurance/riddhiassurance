import { createContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();

/* eslint react/prop-types: "off" */
const AppContextProvider = ({ children }) => {
  const currencySymbol = "₹";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") ? localStorage.getItem("token") : "");
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : localStorage.getItem("atoken") || ""
  );
  const [userData, setUserData] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");

  // Getting Doctors using API
  const getDoctosData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/list");
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message || "Failed to load doctors");
    }
  };

  // Getting User Profile using API (user/advisor only)
  const loadUserProfileData = async () => {
    const currentToken = localStorage.getItem("token") || token;
    if (!currentToken) return;

    try {
      const { data } = await axios.get(backendUrl + "/api/user/get-profile", {
        headers: { token: currentToken },
      });

      if (data.success) {
        setUserData(data.userData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // initialize from localStorage (session persistence)
    setToken(localStorage.getItem("token") ? localStorage.getItem("token") : "");
    setAdminToken(
      localStorage.getItem("aToken") ? localStorage.getItem("aToken") : localStorage.getItem("atoken") || ""
    );

    getDoctosData();
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (token && localStorage.getItem("token") && role !== 'admin') {
      loadUserProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isLoggedIn = useMemo(() => {
    return Boolean(
      localStorage.getItem("token") ||
        token ||
        localStorage.getItem("aToken") ||
        adminToken ||
        localStorage.getItem("atoken")
    );
  }, [token, adminToken]);

  const value = {
    doctors,
    getDoctosData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    adminToken,
    setAdminToken,
    userData,
    setUserData,
    loadUserProfileData,
    isLoggedIn,
    userRole,
    setUserRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;

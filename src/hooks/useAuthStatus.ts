import { useEffect, useState } from "react";

function readUserLoginStatus() {
  return (
    Boolean(localStorage.getItem("gaming_token")) &&
    localStorage.getItem("gaming_user_role")?.toLowerCase() === "user"
  );
}

export function useAuthStatus() {
  const [isLoggedIn, setIsLoggedIn] = useState(readUserLoginStatus);

  useEffect(() => {
    const syncAuthStatus = () => setIsLoggedIn(readUserLoginStatus());

    window.addEventListener("storage", syncAuthStatus);
    window.addEventListener("auth_changed", syncAuthStatus);

    return () => {
      window.removeEventListener("storage", syncAuthStatus);
      window.removeEventListener("auth_changed", syncAuthStatus);
    };
  }, []);

  return isLoggedIn;
}

import React, { createContext, useContext, useState } from "react";

type AdminContextType = {
  adminUnlocked: boolean;
  setAdminUnlocked: (unlocked: boolean) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  return (
    <AdminContext.Provider value={{ adminUnlocked, setAdminUnlocked }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};

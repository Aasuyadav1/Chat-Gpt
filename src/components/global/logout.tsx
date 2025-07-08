"use client";
import React from "react";
import { signOut } from "next-auth/react";

const Logout = ({ children }: { children: React.ReactNode }) => {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth" });
  };
  return (
    <div className="w-full" onClick={handleLogout}>
      {children}
    </div>
  );
};

export default Logout; 
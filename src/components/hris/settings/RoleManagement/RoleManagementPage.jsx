/** @format */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TbLayoutList } from "react-icons/tb";
import { AiOutlineAppstoreAdd } from "react-icons/ai";
import usePermissions from "../../../permissions/permission";

import RoleCreation from "./RoleCreation";
import RoleManagement from "./RoleManagement";

function RoleManagementPage() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("RoleCreation"); // Start with 'RoleCreation' active

  const allTabs = [
    { key: "RoleCreation", label: "Role Creation", permissionId: 1023 },
    { key: "RoleManagement", label: "Role Management", permissionId: 1024 },
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter((tab) => hasPermission(tab.permissionId));

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
  };

  const pageTitle =
    activeTab === "RoleCreation" ? "Role Creation" : "Role Management";

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl text-gray-400 mb-4">
        Settings
        <span className="text-gray-700"> / {pageTitle}</span>
      </h1>

      {/* TABS */}
      <div className="flex gap-3 justify-start mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-md font-medium ${
              activeTab === tab.key ? "bg-blue-500 text-white" : "text-gray-400"
            }`}
          >
            {tab.key === "RoleCreation" && (
              <TbLayoutList className="text-base" />
            )}
            {tab.key === "RoleManagement" && (
              <AiOutlineAppstoreAdd className="text-base" />
            )}
            {tab.label} {tab.count ? `(${tab.count})` : ""}
          </button>
        ))}
      </div>

      {/* Conditional Rendering of Content */}
      {activeTab === "RoleCreation" && hasPermission(1023) && <RoleCreation />}
      {activeTab === "RoleManagement" && hasPermission(1024) && (
        <RoleManagement />
      )}
    </motion.div>
  );
}

export default RoleManagementPage;

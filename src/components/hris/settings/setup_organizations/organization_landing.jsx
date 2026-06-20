import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { Building2, Settings2 } from "lucide-react";
import usePermissions from "../../../permissions/permission";

const OrganizationLanding = [
  {
    title: "Add Organizations",
    subtitle: "Explore organization structure and details",
    icon: <Building2 size={32} />,
    gradient: "from-blue-500 to-blue-600",
    hoverGradient: "from-blue-600 to-blue-700",
    path: "/setup-organizations",
    permission: 10044
  },
  {
    title: "View & Edit Organizations",
    subtitle: "Manage and update organization configurations",
    icon: <Settings2 size={32} />,
    gradient: "from-emerald-500 to-emerald-600",
    hoverGradient: "from-emerald-600 to-emerald-700",
    path: "/view-org",
    permission: 10045
  },
];

const OrganizationLanding1 = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  return (
    <div className="w-full mt-5 min-h-screen font-montserrat">
      {/* Header Section */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {OrganizationLanding
          .filter(item => hasPermission(item.permission))
          .map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative p-6 flex flex-col h-full">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <div className="text-white">{item.icon}</div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-white transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm group-hover:text-white/90 transition-colors duration-300">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-4 flex items-center text-gray-400 group-hover:text-white transition-colors duration-300">
                  <span className="text-sm font-medium mr-2">View</span>
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default OrganizationLanding1;
import React from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUserCheck } from "react-icons/fi";
import { IoBagOutline } from "react-icons/io5";
import { LuUser } from "react-icons/lu";
import { GoLink } from "react-icons/go";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import EditPersonalDetails from "./EditPersonalDetails";
import "react-toastify/dist/ReactToastify.css";
import EditOfficialDetails from "./EditOfficialDetails";
import EditNextOfKinDetails from "./EditNextOfKin";
import EditBankDetails from "./EditbankDetails";
import { useEffect, useState } from "react";
import PdfIcon from "../../../assets/pdf (1).png";
import { FaRegUser, FaCamera } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { FaRegFilePdf } from "react-icons/fa";
import EditPersonalDocuments from "./EditPersonalDocuments";
import { CiCirclePlus } from "react-icons/ci";
import { FiDownload } from "react-icons/fi";
import axios from "axios";
import { apiFetch } from "../../../utils/apiClient";

const ViewRegisteredMembers = () => {
  const location = useLocation();
  const [employeeNo, setEmployeeNo] = useState("");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [showEditNextOfKinModal, setShowEditNextOfKinModal] = useState(false);
  const [selectedNextOfKin, setSelectedNextOfKin] = useState(null);
  const [showEditOfficialModal, setShowEditOfficialModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showOfficialConfirm, setShowOfficialConfirm] = useState(false);
  const [showEditPersonalModal, setShowEditPersonalModal] = useState(false);
  const [personalData, setPersonalData] = useState(null);
  const [searchParams] = useSearchParams();
  const [memberNo, setMemberNo] = useState("");
  const { state } = useLocation();
  const [showAddEmploymentModal, setShowAddEmploymentModal] = useState(false);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [personalDocs, setPersonalDocs] = useState([]);

  const fetchPersonalDocs = async () => {
    if (!employeeNo) return;
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/files/${employeeNo}`,
        {},
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPersonalDocs(json.data);
      } else {
        setPersonalDocs([]);
      }
    } catch (err) {
      console.error("Error fetching personal docs:", err);
      setPersonalDocs([]);
    }
  };
  useEffect(() => {
    fetchPersonalDocs();
  }, [employeeNo]);

  useEffect(() => {
    if (!employeeNo) return;

    const fetchPersonalDocs = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/employees/files/${employeeNo}`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPersonalDocs(json.data);
        } else {
          setPersonalDocs([]);
        }
      } catch (err) {
        console.error("Error fetching personal docs:", err);
        setPersonalDocs([]);
      }
    };

    fetchPersonalDocs();
  }, [employeeNo]);

  const fetchOfficialData = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/official/${employeeNo}`,
      );
      const json = await res.json();
      if (json.success && json.data) {
        const orgId = json.data.organization_id;
        await fetchEmploymentTypes(orgId); // 👈 use orgId here
      }
    } catch (error) {
      console.error("Error fetching official data:", error);
    }
  };
  const fetchEmploymentTypes = async (organizationId) => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/organizations/employment-types?organization_id=${organizationId}`,
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmploymentTypes(json.data);
      } else {
        setEmploymentTypes([]);
      }
    } catch (error) {
      console.error("Error fetching employment types:", error);
    }
  };
  useEffect(() => {
    if (showAddEmploymentModal) {
      fetchOfficialData();
    }
  }, [showAddEmploymentModal]);

  useEffect(() => {
    if (!showAddEmploymentModal) return;
    (async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];
        const res = await apiFetch(`${API_URL}/v1/hris/employmentType/all`, {});
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEmploymentTypes(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch employment types", err);
      }
    })();
  }, [showAddEmploymentModal]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const empNoFromURL = searchParams.get("employee_no");
    if (empNoFromURL) {
      setEmployeeNo(empNoFromURL);
    }
  }, [location]);
  const [isMemberActive, setIsMemberActive] = useState(true); // default to true

  // Update it from personalData when fetched
  useEffect(() => {
    if (personalData?.is_active !== undefined) {
      setIsMemberActive(personalData.is_active === 1);
    }
  }, [personalData]);
  useEffect(() => {
    if (personalData?.employee_no) {
      setMemberNo(personalData.employee_no);
    }
  }, [personalData?.employee_no]);

  const [officialData, setOfficialData] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [nextOfKinData, setNextOfKinData] = useState([]);
  const [bankData, setBankData] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [hierarchyHistory, setHierarchyHistory] = useState([]);

  const downloadFile = async (s3Url, originalName) => {
    try {
      // Extract parts from S3 URL
      const parts = s3Url.split("/");
      const fileName = parts[parts.length - 1];
      const employeeNo = parts[parts.length - 2];
      const filePath = parts[parts.length - 3];

      const response = await apiFetch(
        `${API_URL}/v1/hris/download/file/common?employee_no=${employeeNo}&file_path=${filePath}&file_name=${fileName}`,
      );

      const blob = await response.blob();

      // Create blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName || fileName); // keep user-friendly name
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
    }
  };
  const fetchHierarchyHistory = async () => {
    if (!memberNo) return;

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const response = await apiFetch(
        `${API_URL}/hierarchy/summary/${memberNo}`,
      );

      const result = await response.json();

      // Static map of hierarchy IDs to names (you can also fetch this from API if available)

      if (result.success && result.data?.hierarchy_history?.length) {
        setHierarchyHistory(result.data.hierarchy_history);
      }
    } catch (error) {
      console.error("Error fetching hierarchy history:", error);
    }
  };

  useEffect(() => {
    fetchHierarchyHistory();
  }, [memberNo]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!memberNo) return;

      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];

        const response = await apiFetch(
          `${API_URL}/memberProfilePicture/get/${memberNo}`,
        );

        if (!response.ok) {
          console.error("Failed to fetch image");
          return;
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setProfilePictureUrl(imageUrl);
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    fetchProfilePicture();
  }, [memberNo]);

  const tabs = [
    { key: "personal", label: "Personal" },
    { key: "official", label: "Official" },
    { key: "nextOfKin", label: "Next of Kin" },
    { key: "bankDocs", label: "Bank & Documents" },
    { key: "personalDocs", label: "Personal Documents" },
  ];

  const inputStyle =
    "p-2 rounded-md border border-gray-300 bg-gray-100 text-sm w-full";
  const labelStyle = "text-sm text-gray-600 mb-1 block";

  const fetchPersonalDetails = async () => {
    if (!employeeNo) return;

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/employees/personal/${employeeNo}`,
      );

      const result = await response.json();
      if (result.success) {
        setPersonalData(result.data);
      } else {
        console.error("Failed to fetch personal data");
      }
    } catch (error) {
      console.error("Error fetching personal details:", error);
    }
  };

  useEffect(() => {
    fetchPersonalDetails();
  }, [employeeNo]);
  useEffect(() => {
    fetchPersonalDetails();
  }, [memberNo]);

  // 👇 Move this out from useEffect and place it at top level in your component
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const empNoFromURL = searchParams.get("employee_no");
    if (empNoFromURL) {
      setEmployeeNo(empNoFromURL);
    }
  }, [location]);

  const fetchOfficialDetails = async () => {
    if (!employeeNo) return;

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/official/${employeeNo}`,
      );

      const json = await res.json();
      if (!res.ok || !json?.success) {
        console.error(
          "Failed to fetch official data:",
          json?.message || res.status,
        );
        return;
      }

      const d = json.data || {};
      setOfficialData({
        employee_no: d.employee_no ?? "",

        organization_id: d.organization_id ?? "",
        organization_name: d.organization_details?.organization_name ?? "",
        organization_code: d.organization_details?.code ?? "",

        working_office: d.working_office ?? "",
        working_office_name: d.workingOfficeDetails?.name ?? "",

        branch_id: d.branch ?? "",
        branch_name: d.branch_details?.branch ?? "",

        employment_type: d.employment_type ?? "",
        employment_type_name: d.employmentTypeDetails?.type_name ?? "",

        date_of_appointment: d.date_of_appointment ?? "",
        employee_basic_salary: d.employee_basic_salary ?? "",
        employee_active_status: d.employee_active_status ?? "",

        department_designation_id: d.department_designation_id ?? "",
        designation_title: d.designation?.title ?? "",

        grade_id: d.grade_id ?? "",
        grade_name: d.grade_details?.grade_name ?? "",

        epf_no: d.epf_no ?? "",
        occupation_classification_grade:
          d.occupation_classification_grade ?? "",

        employee_category: d.employee_category ?? "",
        payroll_group: d.payroll_group ?? "",
        payroll_scheme: d.payroll_scheme ?? "",

        checkpoint_id: d.checkpoint_id ?? "",
        checkpoint_name: d.checkpoint_details?.checkpoint_name ?? "",
        checkpoint_address: d.checkpoint_details?.address ?? "",
        checkpoint_client_name: d.checkpoint_details?.client_name ?? "",
        per_shift_rate: d.checkpoint_details?.per_shift_rate ?? "",
        ot_hour_rate: d.checkpoint_details?.ot_hour_rate ?? "",

        designated_mails: d.designated_mails ?? [],

        supervisor_name: d.supervisor?.supervisor_fullname ?? "",
        supervisor_id: d.supervisor?.id ?? d.supervisor_id ?? "",

        timetable_id: d.timetable_id ?? "",
        timetable_name: d.timetable_name ?? "",
      });
    } catch (err) {
      console.error("Error fetching official data:", err);
    }
  };

  useEffect(() => {
    fetchOfficialDetails();
  }, [employeeNo]);

  useEffect(() => {
    fetchOfficialDetails();
  }, [memberNo]);

  const fetchNextOfKinDetails = async () => {
    if (!employeeNo) return;

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const response = await apiFetch(
        `${API_URL}/v1/hris/employees/employee/dependents/${employeeNo}`,
      );

      const result = await response.json();
      if (result.success) {
        setNextOfKinData(result.data);
      } else {
        setNextOfKinData([]);
      }
    } catch (error) {
      console.error("Error fetching next of kin data:", error);
    }
  };

  // 🔁 And use it inside useEffect like this:
  useEffect(() => {
    fetchNextOfKinDetails();
  }, [employeeNo]);

  //  MOVE THIS OUTSIDE useEffect
  const fetchBankDetails = async () => {
    if (!employeeNo) return;

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const response = await apiFetch(
        `${API_URL}/v1/hris/employees/bank/${employeeNo}`,
      );

      const result = await response.json();
      if (result.success) {
        setBankData(result.data);
      }
    } catch (error) {
      console.error("Error fetching bank data:", error);
    }
  };
  useEffect(() => {
    fetchBankDetails();
  }, [employeeNo]);

  const downloadDocument = async (filePath) => {
    if (!filePath) return;

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    if (!token) {
      console.error("Access token not found");
      return;
    }

    try {
      const response = await apiFetch(
        `${API_URL}/downloads/download?path=${encodeURIComponent(filePath)}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filePath.split("/").pop(); // optional: use a fallback name
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error.message);
    }
  };

  const handleToggleStatus = async () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];
    console.log("memberNo", memberNo);

    try {
      const response = await apiFetch(
        `${API_URL}/personalEmployment/update-status/${memberNo}`,
        {
          method: "PUT",

          body: JSON.stringify({ is_active: isMemberActive ? 0 : 1 }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setIsMemberActive((prev) => !prev);
      } else {
        console.error("Failed to update status:", result.message);
      }
    } catch (error) {
      console.error("Error updating member status:", error);
    }
  };
  const ViewField = ({ label, value }) => (
    <div>
      <label className={labelStyle}>{label}</label>
      <input className={inputStyle} value={value || ""} disabled />
    </div>
  );
  const downloadBankFile = async (s3Url, suggestedName) => {
    if (!s3Url) return;

    // Extract the S3 object key (strip the domain)
    let key = "";
    try {
      const u = new URL(s3Url);
      key = u.pathname.replace(/^\/+/, "");
    } catch {
      key = s3Url.replace(/^https?:\/\/[^/]+\//, "");
    }

    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/download/file?key=${encodeURIComponent(key)}`,
        {
          method: "GET",
          // no Authorization header — API only expects `key`
          credentials: "include", // harmless; keeps cookies if your server uses them
        },
      );

      if (!res.ok) {
        console.error(`Download failed: ${res.status} ${res.statusText}`);
        return;
      }

      // Your server returns JSON with a pre-signed `url`
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (data?.url) {
          const a = document.createElement("a");
          a.href = data.url; // presigned URL (includes content-disposition)
          a.download = suggestedName || key.split("/").pop() || "download";
          document.body.appendChild(a);
          a.click();
          a.remove();
          return;
        }
        console.warn("Unexpected JSON from download endpoint:", data);
        return;
      }

      // Fallback: server streamed the file directly
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName || key.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Bank file download error:", err);
    }
  };

  // --- Employment timeline helpers ---
  const toDate = (s) => (s ? new Date(s) : null);
  const formatMonthYear = (s) => {
    const d = toDate(s);
    if (!d) return "Present";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  const formatRange = (start, end) =>
    `${formatMonthYear(start)} — ${end ? formatMonthYear(end) : "Present"}`;

  // measure how far down the first item’s dot sits -> to color the rail to that point
  const [coloredHeight, setColoredHeight] = useState(0);
  const timelineRef = React.useRef(null);
  const firstDotRef = React.useRef(null);

  // recompute when data changes
  useEffect(() => {
    // wait for layout to paint
    const id = requestAnimationFrame(() => {
      try {
        const railTop = timelineRef.current?.getBoundingClientRect()?.top ?? 0;
        const firstTop = firstDotRef.current?.getBoundingClientRect()?.top ?? 0;
        // add half the dot size so the colored bar reaches the center of the circle
        const DOT_RADIUS = 8; // dot is 16x16
        const h = Math.max(0, firstTop - railTop + DOT_RADIUS);
        setColoredHeight(h);
      } catch {
        setColoredHeight(0);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [personalData?.employment_history]);

  const handleProfilePicUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !memberNo) return;

    try {
      const token = Cookies.get("accessToken");
      const formData = new FormData();
      formData.append("employee_no", memberNo);
      formData.append("profile_picture", file); // 👈 must match backend key exactly

      const method = profilePictureUrl ? "PUT" : "POST";
      const endpoint = profilePictureUrl
        ? `${API_URL}/v1/hris/employees/profile-picture/update`
        : `${API_URL}/v1/hris/employees/profile-picture/upload`;

      const res = await apiFetch(endpoint, {
        method,
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(
          method === "POST"
            ? " Profile picture uploaded successfully!"
            : " Profile picture updated successfully!",
        );
        fetchProfilePicture(); // refresh image
      } else {
        toast.error(result.message || "❌ Failed to save profile picture");
      }
    } catch (err) {
      console.error("Profile picture error:", err);
      toast.error("❌ Error uploading profile picture");
    }
  };

  const fetchProfilePicture = async () => {
    if (!memberNo) return;

    try {
      const token = Cookies.get("accessToken");
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/profile-picture/${memberNo}`,
      );

      if (!res.ok) {
        console.error("Failed to fetch profile picture");
        setProfilePictureUrl(null);
        return;
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      setProfilePictureUrl(imageUrl);
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      setProfilePictureUrl(null);
    }
  };
  useEffect(() => {
    fetchProfilePicture();
  }, [memberNo]);

  const downloadPersonalDoc = async (filePath, suggestedName) => {
    if (!filePath) return;

    // 🔹 Clean the path before sending
    const key = filePath.replace(/^.*uploads\//, "");

    try {
      const token = Cookies.get("accessToken");

      const res = await apiFetch(
        `${API_URL}/v1/hris/download/file?key=${encodeURIComponent(key)}`,
      );

      const json = await res.json();
      if (json.success && json.url) {
        const a = document.createElement("a");
        a.href = json.url;
        a.download = suggestedName || key.split("/").pop();
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        toast.error("❌ Failed to get download link");
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error("❌ Error downloading document");
    }
  };

  const handleDownloadPersonalDoc = async (file) => {
    if (!file?.employee_upload_path) return;

    try {
      const urlParts = file.employee_upload_path.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const employeeNo = file.employee_no;
      const filePath = "personal_files"; // 👈 fixed for personal docs

      const response = await axios.get(
        `${API_URL}/v1/hris/download/file/common`,
        {
          params: {
            employee_no: employeeNo,
            file_path: filePath,
            file_name: fileName,
          },
          responseType: "blob",
        },
      );

      // Trigger file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.original_file_name || fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
      toast.error("❌ Failed to download file");
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="space-y-4 font-montserrat">
            <div className="flex items-center justify-between my-4">
              <p className="text-[18px]">Personal Details</p>
              <button
                onClick={() => setShowEditPersonalModal(true)}
                className="border border-blue-600 p-1 hover:bg-primary hover:text-black duration-500 font-semibold rounded-md w-[80px] text-[13px] bg-white text-blue-600"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Employee Number</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_no || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Employee Full Name</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_fullname || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>N.I.C</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_nic || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Name with Initial</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_name_initial || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Calling Name</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_calling_name || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>N.I.C</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_nic || ""}
                  disabled
                />
              </div>
              <div>
                <label className={labelStyle}>Date of Birth</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_dob || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Gender</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_gender || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Marital Status</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_marital_status || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Contact Number</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_contact_no || ""}
                  disabled
                />
              </div>

              <div className="col-span-2">
                <label className={labelStyle}>Permanent Address</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_permanent_address || ""}
                  disabled
                />
              </div>

              <div className="col-span-2">
                <label className={labelStyle}>Temporary Address</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_temporary_address || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Official Email</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_email || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Personal Email</label>
                <input
                  className={inputStyle}
                  value={personalData?.personal_email || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Nationality</label>
                <input
                  className={inputStyle}
                  value={personalData?.nationality || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Religion</label>
                <input
                  className={inputStyle}
                  value={personalData?.religion || ""}
                  disabled
                />
              </div>

              <div>
                <label className={labelStyle}>Land Number</label>
                <input
                  className={inputStyle}
                  value={personalData?.employee_land_no || ""}
                  disabled
                />
              </div>
            </div>

            <AnimatePresence>
              {showEditPersonalModal && (
                <EditPersonalDetails
                  personalData={personalData}
                  onClose={() => setShowEditPersonalModal(false)}
                  onUpdateSuccess={fetchPersonalDetails}
                />
              )}
            </AnimatePresence>
          </div>
        );

      case "official":
        return (
          <div className="space-y-4 font-montserrat">
            <div className="flex items-center justify-between my-4">
              <p className="text-[18px]">Official Details</p>
              <button
                onClick={() => setShowOfficialConfirm(true)}
                className="border border-blue-600 p-1 hover:bg-primary hover:text-black duration-500 font-semibold rounded-md w-[80px] text-[13px] bg-white"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ViewField
                label="Employee Number"
                value={officialData?.employee_no}
              />
              <ViewField
                label="Organization"
                value={officialData?.organization_name}
              />
              <ViewField
                label="Working Office"
                value={
                  officialData?.working_office_name ||
                  officialData?.working_office
                }
              />
              <ViewField label="Branch" value={officialData?.branch_name} />
              <ViewField
                label="Employment Type"
                value={
                  officialData?.employment_type_name ||
                  officialData?.employment_type
                }
              />
              <ViewField
                label="Designation"
                value={
                  officialData?.designation_title ||
                  officialData?.department_designation_id
                }
              />
              <ViewField label="Grade" value={officialData?.grade_name} />
              <ViewField label="E.P.F No" value={officialData?.epf_no} />

              <ViewField
                label="Date of Appointment"
                value={officialData?.date_of_appointment}
              />
              <ViewField
                label="Basic Salary"
                value={officialData?.employee_basic_salary}
              />
              <ViewField
                label="Employment Status"
                value={officialData?.employee_active_status}
              />
              <ViewField
                label="Employee Category"
                value={officialData?.employee_category}
              />

              <ViewField
                label="Payroll Group"
                value={officialData?.payroll_group}
              />
              <ViewField
                label="Payroll Scheme"
                value={officialData?.payroll_scheme}
              />
              <ViewField
                label="Occupation Grade"
                value={officialData?.occupation_classification_grade}
              />
              <ViewField
                label="Supervisor"
                value={officialData?.supervisor_name}
              />

              <ViewField
                label="TimeTable Name"
                value={officialData?.timetable_name}
              />

              {officialData?.payroll_group === "SECURITY" && (
                <>
                  <ViewField
                    label="Checkpoint"
                    value={officialData?.checkpoint_name}
                  />
                  <ViewField
                    label="Checkpoint Client"
                    value={officialData?.checkpoint_client_name}
                  />
                  <ViewField
                    label="Checkpoint Address"
                    value={officialData?.checkpoint_address}
                  />
                  <ViewField
                    label="Per Shift Rate"
                    value={officialData?.per_shift_rate}
                  />
                  <ViewField
                    label="OT Hour Rate"
                    value={officialData?.ot_hour_rate}
                  />
                </>
              )}

              <div className="col-span-2">
                <label className={labelStyle}>Designated Mails</label>
                <input
                  className={inputStyle}
                  value={
                    Array.isArray(officialData?.designated_mails)
                      ? officialData.designated_mails
                          .map((m) => m.designated_mail)
                          .join(", ")
                      : ""
                  }
                  disabled
                />
              </div>
            </div>

            {/* Optional: Document Section (if exists in future) */}
            {officialData?.document_file_path && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={labelStyle}>Membership Document</label>
                  <button
                    onClick={() =>
                      downloadDocument(officialData.document_file_path)
                    }
                    className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50"
                  >
                    <img src="/pdf-icon.svg" alt="PDF" className="w-6 h-6" />
                    <div>
                      <p className="text-sm font-medium">
                        Download Membership Document
                      </p>
                      <p className="text-xs text-gray-500">Click to download</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {showOfficialConfirm && (
                <EditOfficialDetails
                  officialData={officialData}
                  employeeNo={officialData?.employee_no}
                  organizationId={officialData?.organization_id} //  add this line
                  onClose={() => setShowOfficialConfirm(false)}
                  onUpdateSuccess={fetchOfficialDetails}
                />
              )}
            </AnimatePresence>
          </div>
        );

      case "nextOfKin":
        return (
          <div className="space-y-10 font-montserrat">
            <div className="flex items-center justify-between my-4">
              <p className="text-[18px] mb-4">Next Of Kin Details</p>
              {nextOfKinData.length === 0 && (
                <button
                  onClick={() => {
                    setSelectedNextOfKin(null); // prepare to add new
                    setShowEditNextOfKinModal(true);
                  }}
                  className="border border-blue-600 p-1 hover:bg-primary hover:text-black duration-500 font-semibold rounded-md w-[150px] text-[13px] bg-white text-blue-600"
                >
                  Add Next of kin here
                </button>
              )}
            </div>

            {nextOfKinData.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No next of kin records found.
              </p>
            ) : (
              nextOfKinData.map((kin, i) => (
                <div
                  key={kin.employee_dependent_details_id}
                  className="space-y-4 border-b pb-6 mb-6"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Kin #{i + 1}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedNextOfKin({
                          id: kin.employee_dependent_details_id,
                          relationship: kin.employee_dependent_relationship,
                          name: kin.employee_dependent_name,
                          address: kin.employee_dependent_address,
                          nic: kin.employee_dependent_nic,
                          date_of_birth: kin.employee_dependent_dob,
                          is_guardian: kin.is_guardian,
                          birth_certificate_path: kin.birth_certificate_path,
                        });
                        setShowEditNextOfKinModal(true);
                      }}
                      className="border border-blue-600 p-1 hover:bg-primary hover:text-black duration-500 font-semibold rounded-md w-[80px] text-[13px] bg-white text-blue-600"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Relationship</label>
                      <input
                        className={inputStyle}
                        value={kin.employee_dependent_relationship || ""}
                        disabled
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Name</label>
                      <input
                        className={inputStyle}
                        value={kin.employee_dependent_name || ""}
                        disabled
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>NIC</label>
                      <input
                        className={inputStyle}
                        value={kin.employee_dependent_nic || ""}
                        disabled
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Date of Birth</label>
                      <input
                        className={inputStyle}
                        value={kin.employee_dependent_dob || ""}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <AnimatePresence>
              {showEditNextOfKinModal && (
                <EditNextOfKinDetails
                  kinData={selectedNextOfKin}
                  memberNo={employeeNo}
                  onClose={() => setShowEditNextOfKinModal(false)}
                  onUpdateSuccess={fetchNextOfKinDetails}
                />
              )}
            </AnimatePresence>
          </div>
        );
      case "bankDocs":
        return (
          <div className="space-y-6 font-montserrat">
            <div className="flex items-center justify-between my-4">
              <p className="text-[18px]">Bank Documents Details</p>
              <button
                onClick={() => setShowEditBankModal(true)}
                className="border border-blue-600 p-1 hover:bg-primary hover:text-black duration-500 font-semibold rounded-md w-[80px] text-[13px] bg-white text-blue-600"
              >
                Edit
              </button>
            </div>

            {!bankData ? (
              <p className="text-sm text-gray-500">
                Bank details not available.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Account Number</label>
                    <input
                      className={inputStyle}
                      value={bankData?.employee_account_no || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Account Name</label>
                    <input
                      className={inputStyle}
                      value={bankData?.employee_account_name || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Bank Name</label>
                    <input
                      className={inputStyle}
                      value={bankData?.bank_name || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Branch Name</label>
                    <input
                      className={inputStyle}
                      value={bankData?.branch_name || ""}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold">Uploaded Bank Files</label>
                </div>

                <div className="space-y-3 w-full">
                  {Array.isArray(bankData?.bank_files) &&
                  bankData.bank_files.length > 0 ? (
                    bankData.bank_files.map((file) => {
                      const parts = file.s3_url.split("/");
                      const fileName = parts[parts.length - 1]; // e.g. 1759826141263_test_infB.pdf
                      const employeeNo = parts[parts.length - 2]; // e.g. EMP000100
                      const filePath = parts[parts.length - 3]; // e.g. bank_files

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-white shadow-sm rounded-lg p-3 border hover:shadow-md transition"
                        >
                          <div className="flex items-center space-x-3">
                            <img src={PdfIcon} alt="PDF" className="w-8 h-8" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {file.original_file_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded:{" "}
                                {new Date(file.uploaded_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                const res = await axios.get(
                                  `${API_URL}/v1/hris/download/file/common`,
                                  {
                                    params: {
                                      employee_no: employeeNo,
                                      file_path: filePath,
                                      file_name: fileName,
                                    },
                                    responseType: "blob",
                                  },
                                );

                                const url = window.URL.createObjectURL(
                                  new Blob([res.data]),
                                );
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute(
                                  "download",
                                  file.original_file_name || fileName,
                                );
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                              } catch (err) {
                                console.error("Download failed", err);
                                toast.error("❌ Failed to download file");
                              }
                            }}
                            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                          >
                            <FiDownload className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-3">
                      No bank documents uploaded.
                    </p>
                  )}
                </div>
              </>
            )}

            <AnimatePresence>
              {showEditBankModal && (
                <EditBankDetails
                  bankData={bankData}
                  memberNo={employeeNo}
                  accountName={bankData?.employee_account_name || ""}
                  accountNumber={bankData?.employee_account_no || ""}
                  bankId={bankData?.employee_bank_id || ""}
                  branchId={bankData?.employee_bank_branch_id || ""}
                  onClose={() => setShowEditBankModal(false)}
                  onUpdateSuccess={async () => {
                    await fetchBankDetails(); // 🔁 soft refresh
                    setShowEditBankModal(false);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        );

      case "personalDocs":
        return (
          <div className="space-y-6 font-montserrat">
            <div className="flex items-center justify-between my-4">
              <p className="text-[18px]">Personal Documents</p>
              <button
                onClick={() => setShowEditPersonalModal(true)}
                className="border border-blue-600 p-1 hover:bg-primary hover:text-black duration-500 font-semibold rounded-md w-[80px] text-[13px] bg-white text-blue-600"
              >
                Edit
              </button>
            </div>

            {personalDocs.length === 0 ? (
              <p className="text-sm text-gray-500">
                No personal documents uploaded.
              </p>
            ) : (
              personalDocs.map((doc) => (
                <div
                  key={doc.employee_upload_files_id}
                  className="flex items-center justify-between border p-3 rounded-md bg-gray-50 mb-2"
                >
                  <div className="flex items-center space-x-2">
                    <FaRegFilePdf className="text-red-500 w-5 h-5" />
                    <span className="text-sm truncate">
                      {doc.original_file_name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadPersonalDoc(doc)}
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                  >
                    <FiDownload className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ))
            )}

            <AnimatePresence>
              {showEditPersonalModal && (
                <EditPersonalDocuments
                  employeeNo={employeeNo}
                  onClose={() => setShowEditPersonalModal(false)}
                  onUpdateSuccess={fetchPersonalDocs}
                />
              )}
            </AnimatePresence>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl text-gray-400 mb-4 mt-5 font-montserrat">
        Registered Member List{" "}
        <span className="text-gray-700">/ Member Profile</span>
      </h1>

      <div className="flex items-start gap-6 font-montserrat">
        <div className="bg-white p-6 rounded-lg shadow-md w-[300px]">
          <div className="flex flex-col items-center">
            {/* Profile picture + camera icon */}
            <div className="pt-2 rounded-md mb-3 relative">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-[150px] h-[150px] object-cover rounded-full border"
                />
              ) : (
                <div className="bg-blue-100 text-blue-600 p-5 rounded-full w-[120px] h-[120px] flex items-center justify-center">
                  <FaRegUser className="w-18 h-18" />
                </div>
              )}

              {/* Status dot on profile pic */}
              <span
                className={`absolute top-3 right-6 w-4 h-4 rounded-full border-2 border-white 
    ${isMemberActive ? "bg-green-500 animate-blink" : "bg-red-500 animate-blink"}`}
                title={isMemberActive ? "Active" : "Inactive"}
              />

              {/* 📷 Camera Icon Overlay */}
              <button
                type="button"
                onClick={() =>
                  document.getElementById("profilePicInput").click()
                }
                className="absolute bottom-2 right-2 bg-blue-500 p-2 rounded-full shadow-md hover:bg-blue-600 transition"
              >
                <FaCamera className="text-white w-4 h-4" />
              </button>

              {/* Hidden File Input */}
              <input
                id="profilePicInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicUpload}
              />
            </div>

            {/* Employee name + status */}
            <p className="text-xl font-semibold text-gray-800 mt-3">
              {personalData?.employee_name_initial}
            </p>

            {/* Contact details */}
            <p className="text-[13px] font-light text-gray-400 w-full text-left my-2">
              DETAILS
            </p>
            <div className="text-left w-full text-[15px] text-gray-600 space-y-2">
              <p>
                <strong>Email:</strong>{" "}
                <p className="text-sm">{personalData?.employee_email}</p>
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                <p className="text-sm">{personalData?.employee_contact_no}</p>
              </p>
            </div>

            {/* Employment History */}
            <div className="mt-6 w-full">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-light text-gray-400 mb-2">
                  Employment History
                </p>
                <button
                  onClick={() => setShowAddEmploymentModal(true)}
                  className="text-blue-400 px-2 py-1 rounded text-xs hover:text-blue-600 duration-300"
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <CiCirclePlus className="w-5 h-5 font-bold" />
                    Add New
                  </div>
                </button>
              </div>

              {Array.isArray(personalData?.employment_history) &&
              personalData.employment_history.length > 0 ? (
                <div className="relative pl-12" ref={timelineRef}>
                  {/* Gray vertical rail */}
                  <span className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />
                  {/* Colored segment */}
                  <span
                    className="absolute left-6 top-0 w-0.5 bg-blue-500 transition-all"
                    style={{ height: `${coloredHeight}px` }}
                  />
                  <div className="flex flex-col gap-8">
                    {[...personalData.employment_history]
                      .sort((a, b) => {
                        const endA = a.end_date
                          ? new Date(a.end_date).getTime()
                          : Infinity;
                        const endB = b.end_date
                          ? new Date(b.end_date).getTime()
                          : Infinity;
                        if (endA !== endB) return endA - endB;
                        const startA = a.start_date
                          ? new Date(a.start_date).getTime()
                          : 0;
                        const startB = b.start_date
                          ? new Date(b.start_date).getTime()
                          : 0;
                        return startA - startB;
                      })
                      .map((job) => {
                        const showTick =
                          job.end_date && new Date(job.end_date) < new Date();
                        return (
                          <div
                            key={job.id}
                            className="relative flex items-start"
                          >
                            <span
                              className={`absolute left-3 top-0 h-6 w-6 flex items-center justify-center rounded-full border-2 ${
                                showTick
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "bg-white border-gray-300 text-gray-400"
                              }`}
                            >
                              {showTick ? "✓" : ""}
                            </span>
                            <div className="ml-12">
                              <div className="text-sm font-semibold text-gray-800">
                                {job.employment_type_name || "—"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatRange(job.start_date, job.end_date)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No employment history.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="bg-white p-6 rounded-lg shadow-md flex-1 ">
          {/* TABS */}
          <div className="flex gap-3 justify-start mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-md font-medium ${
                  activeTab === tab.key
                    ? "bg-blue-400 text-white"
                    : "text-gray-400"
                }`}
              >
                {tab.key === "personal" && (
                  <FiUserCheck className="text-base" />
                )}
                {tab.key === "official" && (
                  <IoBagOutline className="text-base" />
                )}
                {tab.key === "nextOfKin" && <LuUser className="text-base" />}
                {tab.key === "bankDocs" && <GoLink className="text-base" />}
                {tab.label} {tab.count ? `(${tab.count})` : ""}
              </button>
            ))}
          </div>

          {/* FORM CONTENT */}
          {renderForm()}
        </div>

        {showAddEmploymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Add Employment</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm block mb-1">Employment Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select type</option>
                    {employmentTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>

                <div>
                  <label className="text-sm block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddEmploymentModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await apiFetch(
                        `${API_URL}/v1/hris/employees/changeEmploymentType/${employeeNo}`,
                        {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            new_employment_type_id: Number(selectedType),
                            start_date: startDate,
                            end_date: endDate || null,
                          }),
                        },
                      );

                      const json = await res.json();
                      if (json.success) {
                        toast.success(
                          "Employment history updated successfully!",
                        );
                        setShowAddEmploymentModal(false);
                        setSelectedType("");
                        setStartDate("");
                        setEndDate("");
                        fetchPersonalDetails();
                      } else {
                        toast.error(
                          json.message ||
                            "Failed to update employment history.",
                        );
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error("Error saving employment history.");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </motion.div>
  );
};

export default ViewRegisteredMembers;

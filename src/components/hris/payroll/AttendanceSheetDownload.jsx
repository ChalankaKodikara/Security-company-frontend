/** @format */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Building2,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

/*
|--------------------------------------------------------------------------
| API Configuration
|--------------------------------------------------------------------------
*/

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8598";

const CHECKPOINT_SEARCH_ENDPOINT = "/v1/hris/client/checkpoints";

const ATTENDANCE_SHEET_DOWNLOAD_ENDPOINT =
  "/v1/hris/client/attendance-sheet/download";

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

const getAccessToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("authToken") ||
  "";

/*
|--------------------------------------------------------------------------
| Checkpoint Helpers
|--------------------------------------------------------------------------
*/

const getCheckpointId = (checkpoint) =>
  checkpoint?.id ?? checkpoint?.checkpoint_id ?? checkpoint?.checkpointId ?? "";

const getCheckpointName = (checkpoint) =>
  checkpoint?.checkpoint_name ??
  checkpoint?.checkpointName ??
  checkpoint?.name ??
  "Unnamed checkpoint";

const getClientName = (checkpoint) =>
  checkpoint?.client_name ??
  checkpoint?.clientName ??
  checkpoint?.client?.client_name ??
  checkpoint?.client?.name ??
  "";

const getEmployeeCount = (checkpoint) =>
  checkpoint?.employee_count ?? checkpoint?.employeeCount ?? "";

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

const extractCheckpointArray = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.data?.data)) {
    return responseData.data.data;
  }

  if (Array.isArray(responseData?.data?.checkpoints)) {
    return responseData.data.checkpoints;
  }

  if (Array.isArray(responseData?.data?.rows)) {
    return responseData.data.rows;
  }

  if (Array.isArray(responseData?.checkpoints)) {
    return responseData.checkpoints;
  }

  if (Array.isArray(responseData?.rows)) {
    return responseData.rows;
  }

  return [];
};

const getFetchErrorMessage = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const errorData = await response.json();

      return errorData?.message || errorData?.error || fallbackMessage;
    }

    const errorText = await response.text();

    return errorText || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

/*
|--------------------------------------------------------------------------
| File Helpers
|--------------------------------------------------------------------------
*/

const sanitizeFileName = (value) =>
  String(value || "attendance-sheet")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

const getFileNameFromHeader = (contentDisposition) => {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
    } catch {
      return utf8Match[1].replace(/["']/g, "");
    }
  }

  const standardMatch = contentDisposition.match(
    /filename\s*=\s*"?([^";\n]+)"?/i,
  );

  return standardMatch?.[1]?.trim() || null;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const AttendanceSheetDownload = () => {
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const requestControllerRef = useRef(null);

  const [checkpointSearch, setCheckpointSearch] = useState("");

  const [checkpoints, setCheckpoints] = useState([]);

  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const selectedCheckpointId = useMemo(
    () => getCheckpointId(selectedCheckpoint),
    [selectedCheckpoint],
  );

  const selectedCheckpointName = useMemo(
    () => getCheckpointName(selectedCheckpoint),
    [selectedCheckpoint],
  );

  /*
  |--------------------------------------------------------------------------
  | Common Headers
  |--------------------------------------------------------------------------
  */

  const getRequestHeaders = useCallback((accept = "application/json") => {
    const token = getAccessToken();

    return {
      Accept: accept,
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Checkpoints
  |--------------------------------------------------------------------------
  */

  const loadCheckpoints = useCallback(
    async (searchValue = "") => {
      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
      }

      const controller = new AbortController();

      requestControllerRef.current = controller;

      try {
        setIsLoadingCheckpoints(true);

        const queryParams = new URLSearchParams({
          page: "1",
          limit: "50",
          is_active: "1",
        });

        if (searchValue.trim()) {
          queryParams.set("search", searchValue.trim());
        }

        const response = await fetch(
          `${API_BASE_URL}${CHECKPOINT_SEARCH_ENDPOINT}?${queryParams.toString()}`,
          {
            method: "GET",
            headers: getRequestHeaders("application/json"),
            signal: controller.signal,

            // Keep this when your backend authentication uses cookies.
            credentials: "include",
          },
        );

        if (!response.ok) {
          const errorMessage = await getFetchErrorMessage(
            response,
            "Failed to load checkpoints.",
          );

          throw new Error(errorMessage);
        }

        const responseData = await response.json();

        const checkpointList = extractCheckpointArray(responseData);

        const validCheckpoints = checkpointList.filter(
          (checkpoint) => getCheckpointId(checkpoint) !== "",
        );

        setCheckpoints(validCheckpoints);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Load checkpoints error:", error);

        setCheckpoints([]);

        toast.error(error?.message || "Failed to load checkpoints.");
      } finally {
        if (requestControllerRef.current === controller) {
          setIsLoadingCheckpoints(false);
          requestControllerRef.current = null;
        }
      }
    },
    [getRequestHeaders],
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Checkpoint Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadCheckpoints("");

    return () => {
      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
      }
    };
  }, [loadCheckpoints]);

  /*
  |--------------------------------------------------------------------------
  | Search Debounce
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadCheckpoints(checkpointSearch);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [checkpointSearch, isDropdownOpen, loadCheckpoints]);

  /*
  |--------------------------------------------------------------------------
  | Close Dropdown
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Focus Dropdown Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isDropdownOpen]);

  /*
  |--------------------------------------------------------------------------
  | Checkpoint Actions
  |--------------------------------------------------------------------------
  */

  const handleSelectCheckpoint = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setCheckpointSearch("");
    setIsDropdownOpen(false);
  };

  const handleClearCheckpoint = (event) => {
    event?.stopPropagation();

    setSelectedCheckpoint(null);
    setCheckpointSearch("");
    setIsDropdownOpen(false);

    loadCheckpoints("");
  };

  const handleReset = () => {
    setSelectedCheckpoint(null);
    setCheckpointSearch("");
    setIsDropdownOpen(false);

    loadCheckpoints("");
  };

  /*
  |--------------------------------------------------------------------------
  | Download Excel
  |--------------------------------------------------------------------------
  */

  const handleDownloadAttendanceSheet = async () => {
    if (!selectedCheckpointId) {
      toast.warning("Please select a checkpoint first.");

      return;
    }

    try {
      setIsDownloading(true);

      const queryParams = new URLSearchParams({
        checkpoint_id: String(selectedCheckpointId),
      });

      const response = await fetch(
        `${API_BASE_URL}${ATTENDANCE_SHEET_DOWNLOAD_ENDPOINT}?${queryParams.toString()}`,
        {
          method: "GET",
          headers: getRequestHeaders(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ),

          // Keep this when your backend authentication uses cookies.
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorMessage = await getFetchErrorMessage(
          response,
          "Failed to download attendance sheet.",
        );

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const responseData = await response.json();

        throw new Error(
          responseData?.message ||
            "The backend returned JSON instead of an Excel file.",
        );
      }

      const fileBlob = await response.blob();

      if (!fileBlob || fileBlob.size === 0) {
        throw new Error("The backend returned an empty Excel file.");
      }

      const contentDisposition = response.headers.get("content-disposition");

      const backendFileName = getFileNameFromHeader(contentDisposition);

      const fallbackFileName = `${sanitizeFileName(
        selectedCheckpointName,
      )}-attendance-sheet.xlsx`;

      const downloadFileName = backendFileName || fallbackFileName;

      const fileUrl = window.URL.createObjectURL(fileBlob);

      const anchor = document.createElement("a");

      anchor.href = fileUrl;
      anchor.download = downloadFileName;
      anchor.style.display = "none";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(fileUrl);
      }, 1000);

      toast.success("Attendance sheet downloaded successfully.");
    } catch (error) {
      console.error("Attendance sheet download error:", error);

      toast.error(error?.message || "Failed to download attendance sheet.");
    } finally {
      setIsDownloading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <FileSpreadsheet className="text-emerald-700" size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Attendance Sheet Download
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Select a checkpoint and download its blank employee attendance
              Excel file.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="rounded-t-2xl border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2.5">
                <Download className="text-white" size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Generate Blank Attendance Sheet
                </h2>

                <p className="mt-0.5 text-sm text-emerald-50">
                  The Excel file will contain the checkpoint name and assigned
                  employee numbers.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              {/* Checkpoint Selection */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Checkpoint
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((previous) => !previous)}
                    className={`flex min-h-[54px] w-full items-center justify-between rounded-xl border bg-white px-4 text-left outline-none transition ${
                      isDropdownOpen
                        ? "border-emerald-500 ring-4 ring-emerald-100"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Building2
                        className="shrink-0 text-slate-400"
                        size={20}
                      />

                      {selectedCheckpoint ? (
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {selectedCheckpointName}
                          </p>

                          {(getClientName(selectedCheckpoint) ||
                            getEmployeeCount(selectedCheckpoint) !== "") && (
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {[
                                getClientName(selectedCheckpoint),
                                getEmployeeCount(selectedCheckpoint) !== ""
                                  ? `${getEmployeeCount(
                                      selectedCheckpoint,
                                    )} employees`
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Search and select a checkpoint
                        </span>
                      )}
                    </div>

                    <div className="ml-3 flex shrink-0 items-center gap-1">
                      {selectedCheckpoint && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={handleClearCheckpoint}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              handleClearCheckpoint(event);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                        >
                          <X size={17} />
                        </span>
                      )}

                      <ChevronDown
                        size={19}
                        className={`text-slate-400 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-[62px] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 p-3">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />

                          <input
                            ref={searchInputRef}
                            type="text"
                            value={checkpointSearch}
                            onChange={(event) =>
                              setCheckpointSearch(event.target.value)
                            }
                            placeholder="Search checkpoint..."
                            className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                          />

                          {checkpointSearch && (
                            <button
                              type="button"
                              onClick={() => setCheckpointSearch("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            >
                              <X size={17} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto p-2">
                        {isLoadingCheckpoints ? (
                          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                            <Loader2 className="animate-spin" size={19} />
                            Loading checkpoints...
                          </div>
                        ) : checkpoints.length === 0 ? (
                          <div className="py-10 text-center">
                            <Building2
                              className="mx-auto mb-2 text-slate-300"
                              size={30}
                            />

                            <p className="text-sm font-medium text-slate-600">
                              No checkpoints found
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Try another checkpoint name.
                            </p>
                          </div>
                        ) : (
                          checkpoints.map((checkpoint) => {
                            const checkpointId = getCheckpointId(checkpoint);

                            const checkpointName =
                              getCheckpointName(checkpoint);

                            const isSelected =
                              String(checkpointId) ===
                              String(selectedCheckpointId);

                            return (
                              <button
                                key={checkpointId}
                                type="button"
                                onClick={() =>
                                  handleSelectCheckpoint(checkpoint)
                                }
                                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition last:mb-0 ${
                                  isSelected
                                    ? "bg-emerald-50"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                      isSelected
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    <Building2 size={18} />
                                  </div>

                                  <div className="min-w-0">
                                    <p
                                      className={`truncate text-sm font-medium ${
                                        isSelected
                                          ? "text-emerald-800"
                                          : "text-slate-800"
                                      }`}
                                    >
                                      {checkpointName}
                                    </p>

                                    {(getClientName(checkpoint) ||
                                      getEmployeeCount(checkpoint) !== "") && (
                                      <p className="mt-0.5 truncate text-xs text-slate-400">
                                        {[
                                          getClientName(checkpoint),
                                          getEmployeeCount(checkpoint) !== ""
                                            ? `${getEmployeeCount(
                                                checkpoint,
                                              )} employees`
                                            : "",
                                        ]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <Check
                                    className="shrink-0 text-emerald-600"
                                    size={18}
                                  />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>

                      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => loadCheckpoints(checkpointSearch)}
                          disabled={isLoadingCheckpoints}
                          className="flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-emerald-700 disabled:cursor-not-allowed"
                        >
                          <RefreshCw
                            size={14}
                            className={
                              isLoadingCheckpoints ? "animate-spin" : ""
                            }
                          />
                          Refresh checkpoint list
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Employees assigned to the selected checkpoint will be added to
                  the Excel workbook.
                </p>

                {selectedCheckpoint && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Building2 size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Selected checkpoint
                        </p>

                        <p className="mt-1 break-words text-base font-bold text-slate-900">
                          {selectedCheckpointName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Checkpoint ID: {selectedCheckpointId}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Excel Information */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <FileSpreadsheet className="text-emerald-700" size={21} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Excel Output
                    </h3>

                    <p className="text-xs text-slate-500">
                      Blank attendance workbook
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <TemplateItem label="Point name" value="Checkpoint name" />

                  <TemplateItem
                    label="Employee field"
                    value="Employee number"
                  />

                  <TemplateItem
                    label="Attendance columns"
                    value="D/S, N/S and OT"
                  />

                  <TemplateItem label="Attendance values" value="Blank" />

                  <TemplateItem label="Bottom row" value="SUM formulas" />
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs leading-5 text-amber-800">
                    The backend creates one worksheet for each active employee
                    assigned to the selected checkpoint.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleReset}
                disabled={isDownloading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={17} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleDownloadAttendanceSheet}
                disabled={!selectedCheckpointId || isDownloading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Generating Excel...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download Attendance Sheet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Template Information Row
|--------------------------------------------------------------------------
*/

const TemplateItem = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
    <span className="text-xs font-medium text-slate-500">{label}</span>

    <span className="max-w-[180px] text-right text-xs font-semibold text-slate-800">
      {value}
    </span>
  </div>
);

export default AttendanceSheetDownload;

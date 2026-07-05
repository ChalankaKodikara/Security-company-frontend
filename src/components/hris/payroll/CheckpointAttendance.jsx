import React, { useEffect, useState } from "react";
import {
  Upload,
  Download,
  Building2,
  Calendar,
  FileSpreadsheet,
  Eye,
  Hash,
} from "lucide-react";

const API_URL = process.env.REACT_APP_FRONTEND_URL || "http://localhost:5000";

const CheckpointAttendance = () => {
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState("");
  const [downloadCheckpoint, setDownloadCheckpoint] = useState("");
  const [checkpointSearch, setCheckpointSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [downloadMonth, setDownloadMonth] = useState("");
  const [downloadYear, setDownloadYear] = useState("");

  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceMonth, setInvoiceMonth] = useState("");
  const [invoiceYear, setInvoiceYear] = useState("");
  const [generatedInvoiceMonths, setGeneratedInvoiceMonths] = useState([]);
  const [viewInvoiceNumbers, setViewInvoiceNumbers] = useState([]);
  const [loadingGenerateInvoice, setLoadingGenerateInvoice] = useState(false);
  const [loadingInvoiceMonths, setLoadingInvoiceMonths] = useState(false);
  const [selectedInvoiceViewTitle, setSelectedInvoiceViewTitle] = useState("");

  const [uploadsPage, setUploadsPage] = useState(1);
  const [uploadsTotalPages, setUploadsTotalPages] = useState(1);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [uploads, setUploads] = useState([]);

  const token = localStorage.getItem("token");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = ["2024", "2025", "2026", "2027", "2028"];

  const uniqueClients = Array.from(
    new Map(
      checkpoints
        .filter((item) => item.client_id)
        .map((item) => [
          item.client_id,
          {
            client_id: item.client_id,
            client_name: item.client_name || `Client ${item.client_id}`,
          },
        ]),
    ).values(),
  );

  useEffect(() => {
    fetchCheckpoints();
    fetchAttendanceUploads();
    fetchGeneratedInvoiceMonths();
  }, []);
  const filteredDownloadCheckpoints = checkpoints.filter((checkpoint) =>
    `${checkpoint.checkpoint_name} ${checkpoint.client_name}`
      .toLowerCase()
      .includes(checkpointSearch.toLowerCase()),
  );
  const fetchCheckpoints = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/hris/client/checkpoints`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setCheckpoints(data.checkpoints || []);
    } catch (error) {
      console.error("Error fetching checkpoints:", error);
    }
  };

  const fetchAttendanceUploads = async (page = 1) => {
    try {
      setLoadingUploads(true);

      const response = await fetch(
        `${API_URL}/v1/hris/client/attendance?page=${page}&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setUploads(data.data || []);
        setUploadsPage(data.pagination?.page || 1);
        setUploadsTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching attendance uploads:", error);
    } finally {
      setLoadingUploads(false);
    }
  };

  const fetchGeneratedInvoiceMonths = async () => {
    try {
      setLoadingInvoiceMonths(true);

      const response = await fetch(
        `${API_URL}/v1/hris/generate-pdf/generated-months`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setGeneratedInvoiceMonths(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching generated invoice months:", error);
    } finally {
      setLoadingInvoiceMonths(false);
    }
  };

  const handleGenerateInvoiceNumbers = async () => {
    if (!invoiceClientId || !invoiceMonth || !invoiceYear) {
      alert("Please select client, month and year.");
      return;
    }

    try {
      setLoadingGenerateInvoice(true);

      const response = await fetch(`${API_URL}/v1/hris/generate-pdf/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: invoiceClientId,
          invoice_month: invoiceMonth,
          invoice_year: invoiceYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invoice number generation failed.");
        return;
      }

      alert(
        `Invoice numbers generated successfully. ${data.start_invoice_number} - ${data.end_invoice_number}`,
      );

      setViewInvoiceNumbers(data.data || []);
      setSelectedInvoiceViewTitle(`${invoiceMonth} ${invoiceYear}`);

      await fetchGeneratedInvoiceMonths();
    } catch (error) {
      console.error("Generate invoice numbers error:", error);
      alert("Invoice number generation failed.");
    } finally {
      setLoadingGenerateInvoice(false);
    }
  };

  const handleViewInvoiceNumbers = async (item) => {
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/generate-pdf/view?client_id=${item.client_id}&invoice_month=${item.invoice_month}&invoice_year=${item.invoice_year}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load invoice numbers.");
        return;
      }

      setViewInvoiceNumbers(data.data || []);
      setSelectedInvoiceViewTitle(
        `${item.client_name || "Client"} - ${item.invoice_month} ${item.invoice_year}`,
      );
    } catch (error) {
      console.error("View invoice numbers error:", error);
      alert("Failed to load invoice numbers.");
    }
  };

  const getInvoiceNumber = async (
    checkpoint_id,
    attendance_month,
    attendance_year,
  ) => {
    const response = await fetch(
      `${API_URL}/v1/hris/generate-pdf/checkpoint-invoice-number?checkpoint_id=${checkpoint_id}&invoice_month=${attendance_month}&invoice_year=${attendance_year}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Invoice number not found.");
    }

    return data.data.invoice_number;
  };

  const handleDownloadPdfByRow = async (item) => {
    try {
      const invoiceNo = await getInvoiceNumber(
        item.checkpoint_id,
        item.attendance_month,
        item.attendance_year,
      );

      const url = `${API_URL}/v1/hris/generate-pdf/generate-pdf?checkpoint_id=${item.checkpoint_id}&attendance_month=${item.attendance_month}&attendance_year=${item.attendance_year}&invoice_no=${invoiceNo}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert("PDF generation failed.");
        return;
      }

      const blob = await res.blob();
      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `attendance-${item.checkpoint_name}-${item.attendance_month}-${item.attendance_year}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("PDF download error:", error);
      alert(error.message || "PDF download failed.");
    }
  };

  const handleDownloadInvoiceByRow = async (item) => {
    try {
      const invoiceNo = await getInvoiceNumber(
        item.checkpoint_id,
        item.attendance_month,
        item.attendance_year,
      );

      const url = `${API_URL}/v1/hris/generate-pdf/generate-invoice-pdf?checkpoint_id=${item.checkpoint_id}&attendance_month=${item.attendance_month}&attendance_year=${item.attendance_year}&invoice_no=${invoiceNo}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert("Invoice PDF generation failed.");
        return;
      }

      const blob = await res.blob();
      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `invoice-${item.checkpoint_name}-${item.attendance_month}-${item.attendance_year}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Invoice download error:", error);
      alert(error.message || "Invoice download failed.");
    }
  };

  const handleUpload = async () => {
    if (!selectedCheckpoint || !month || !year || !file) {
      alert("Please select checkpoint, month, year and file.");
      return;
    }

    const formData = new FormData();
    formData.append("checkpoint_id", selectedCheckpoint);
    formData.append("attendance_month", month);
    formData.append("attendance_year", year);
    formData.append("file", file);

    try {
      setLoadingUpload(true);

      const res = await fetch(`${API_URL}/v1/hris/upload-attendance/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Upload failed");
        return;
      }

      alert(`Upload success. Inserted rows: ${data.inserted_count}`);
      await fetchAttendanceUploads();
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!downloadCheckpoint || !downloadMonth || !downloadYear) {
      alert("Please select checkpoint, month and year.");
      return;
    }

    try {
      setLoadingDownload(true);

      const selected = checkpoints.find(
        (item) => String(item.id) === String(downloadCheckpoint),
      );

      await handleDownloadPdfByRow({
        checkpoint_id: downloadCheckpoint,
        checkpoint_name: selected?.checkpoint_name || "checkpoint",
        attendance_month: downloadMonth,
        attendance_year: downloadYear,
      });
    } finally {
      setLoadingDownload(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-500">
          Home / Attendance / Upload Attendance Sheet
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          Attendance Sheet Management
        </h1>
        <p className="text-slate-500">
          Upload attendance sheets, generate invoice numbers and download
          checkpoint attendance reports.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="text-blue-600" />
            <h2 className="text-lg font-semibold">Upload Attendance Sheet</h2>
          </div>

          <p className="text-sm text-slate-500 mb-5">
            Upload Excel attendance sheet for the selected checkpoint.
          </p>

          <label className="text-sm font-medium">Select Checkpoint</label>
          <div className="relative mt-2 mb-4">
            <Building2
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <select
              value={selectedCheckpoint}
              onChange={(e) => setSelectedCheckpoint(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Checkpoint</option>
              {checkpoints.map((checkpoint) => (
                <option key={checkpoint.id} value={checkpoint.id}>
                  {checkpoint.checkpoint_name} - {checkpoint.client_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="text-sm font-medium block mt-5">
            Upload File Excel
          </label>

          <label className="mt-2 border border-dashed border-slate-300 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
            <FileSpreadsheet className="text-slate-500 mb-1" />
            <span className="text-sm text-slate-700">
              {file ? file.name : "Click to browse Excel file"}
            </span>
            <span className="text-xs text-slate-400">
              Only .xlsx or .xls files allowed
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={loadingUpload}
            className="mt-5 float-right bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg flex items-center gap-2"
          >
            <Upload size={16} />
            {loadingUpload ? "Uploading..." : "Upload Sheet"}
          </button>

          <div className="clear-both" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Download className="text-green-600" />
            <h2 className="text-lg font-semibold">
              Download Attendance Sheet & Invoice
            </h2>
          </div>

          <p className="text-sm text-slate-500 mb-5">
            Download generated PDF attendance sheet or invoice for the selected
            checkpoint.
          </p>

          <label className="text-sm font-medium">Select Checkpoint</label>

          <div className="relative mt-2 mb-4">
            <Building2
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />

            <input
              list="checkpoint-options"
              value={checkpointSearch}
              onChange={(e) => {
                const value = e.target.value;
                setCheckpointSearch(value);

                const selected = checkpoints.find(
                  (checkpoint) =>
                    `${checkpoint.checkpoint_name} - ${checkpoint.client_name}` ===
                    value,
                );

                setDownloadCheckpoint(selected ? selected.id : "");
              }}
              placeholder="Search and select checkpoint..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />

            <datalist id="checkpoint-options">
              {checkpoints.map((checkpoint) => (
                <option
                  key={checkpoint.id}
                  value={`${checkpoint.checkpoint_name} - ${checkpoint.client_name}`}
                />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Month</label>
              <select
                value={downloadMonth}
                onChange={(e) => setDownloadMonth(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Year</label>
              <select
                value={downloadYear}
                onChange={(e) => setDownloadYear(e.target.value)}
                className="w-full mt-2 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleDownloadPdf}
              disabled={loadingDownload}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-5 py-2 rounded-lg flex items-center gap-2"
            >
              <Download size={16} />
              {loadingDownload ? "Downloading..." : "Download Sheet"}
            </button>

            <button
              onClick={async () => {
                if (!downloadCheckpoint || !downloadMonth || !downloadYear) {
                  alert("Please select checkpoint, month and year.");
                  return;
                }

                const selected = checkpoints.find(
                  (item) => String(item.id) === String(downloadCheckpoint),
                );

                await handleDownloadInvoiceByRow({
                  checkpoint_id: downloadCheckpoint,
                  checkpoint_name: selected?.checkpoint_name || "checkpoint",
                  attendance_month: downloadMonth,
                  attendance_year: downloadYear,
                });
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg flex items-center gap-2"
            >
              <Download size={16} />
              Download Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
        <div className="flex items-center gap-3 mb-2">
          <Hash className="text-purple-600" />
          <h2 className="text-lg font-semibold">Generate Invoice Numbers</h2>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          Generate fixed invoice numbers for selected client, month and year.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Client</label>
            <select
              value={invoiceClientId}
              onChange={(e) => setInvoiceClientId(e.target.value)}
              className="w-full mt-2 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Client</option>
              {uniqueClients.map((client) => (
                <option key={client.client_id} value={client.client_id}>
                  {client.client_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Month</label>
            <select
              value={invoiceMonth}
              onChange={(e) => setInvoiceMonth(e.target.value)}
              className="w-full mt-2 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Month</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Year</label>
            <select
              value={invoiceYear}
              onChange={(e) => setInvoiceYear(e.target.value)}
              className="w-full mt-2 px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateInvoiceNumbers}
              disabled={loadingGenerateInvoice}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-5 py-3 rounded-lg"
            >
              {loadingGenerateInvoice ? "Generating..." : "Generate Numbers"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Generated Invoice Months</h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="border p-3">#</th>
                  <th className="border p-3">Client</th>
                  <th className="border p-3">Month</th>
                  <th className="border p-3">Year</th>
                  <th className="border p-3">Total</th>
                  <th className="border p-3">Start No</th>
                  <th className="border p-3">End No</th>
                  <th className="border p-3 text-center">View</th>
                </tr>
              </thead>

              <tbody>
                {loadingInvoiceMonths ? (
                  <tr>
                    <td colSpan="8" className="text-center p-5 text-slate-400">
                      Loading generated invoices...
                    </td>
                  </tr>
                ) : generatedInvoiceMonths.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-5 text-slate-400">
                      No generated invoice numbers yet.
                    </td>
                  </tr>
                ) : (
                  generatedInvoiceMonths.map((item, index) => (
                    <tr
                      key={`${item.client_id}-${item.invoice_month}-${item.invoice_year}`}
                    >
                      <td className="border p-3">{index + 1}</td>
                      <td className="border p-3">{item.client_name}</td>
                      <td className="border p-3">{item.invoice_month}</td>
                      <td className="border p-3">{item.invoice_year}</td>
                      <td className="border p-3">{item.total_invoices}</td>
                      <td className="border p-3">
                        {item.start_invoice_number}
                      </td>
                      <td className="border p-3">{item.end_invoice_number}</td>
                      <td className="border p-3 text-center">
                        <button
                          onClick={() => handleViewInvoiceNumbers(item)}
                          className="border border-purple-500 text-purple-600 p-2 rounded hover:bg-purple-50"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewInvoiceNumbers.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">
              Invoice Numbers - {selectedInvoiceViewTitle}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="border p-3">Order</th>
                    <th className="border p-3">Invoice No</th>
                    <th className="border p-3">Checkpoint</th>
                    <th className="border p-3">Month</th>
                    <th className="border p-3">Year</th>
                  </tr>
                </thead>

                <tbody>
                  {viewInvoiceNumbers.map((item) => (
                    <tr key={item.id || item.checkpoint_id}>
                      <td className="border p-3">{item.invoice_order}</td>
                      <td className="border p-3 font-semibold">
                        {item.invoice_number}
                      </td>
                      <td className="border p-3">{item.checkpoint_name}</td>
                      <td className="border p-3">{item.invoice_month}</td>
                      <td className="border p-3">{item.invoice_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
        <h2 className="text-lg font-semibold">Previous Attendance Sheets</h2>
        <p className="text-sm text-slate-500 mb-4">
          Recently uploaded attendance sheets.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="border p-3">#</th>
                <th className="border p-3">Client</th>
                <th className="border p-3">Checkpoint</th>
                <th className="border p-3">Month</th>
                <th className="border p-3">Year</th>
                <th className="border p-3">Employees</th>
                <th className="border p-3">Completed Shifts</th>
                <th className="border p-3">OT Hours</th>
                <th className="border p-3">Payable Shifts</th>
                <th className="border p-3">Uploaded At</th>
                <th className="border p-3 text-center">PDF</th>
                <th className="border p-3 text-center">Invoice</th>
              </tr>
            </thead>

            <tbody>
              {loadingUploads ? (
                <tr>
                  <td colSpan="12" className="text-center p-6 text-slate-400">
                    Loading uploads...
                  </td>
                </tr>
              ) : uploads.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center p-6 text-slate-400">
                    No uploads yet.
                  </td>
                </tr>
              ) : (
                uploads.map((item, index) => (
                  <tr
                    key={`${item.checkpoint_id}-${item.attendance_month}-${item.attendance_year}`}
                  >
                    <td className="border p-3">{index + 1}</td>
                    <td className="border p-3">{item.client_name}</td>
                    <td className="border p-3">{item.checkpoint_name}</td>
                    <td className="border p-3">{item.attendance_month}</td>
                    <td className="border p-3">{item.attendance_year}</td>
                    <td className="border p-3">{item.total_employees}</td>
                    <td className="border p-3">
                      {item.total_completed_shifts}
                    </td>
                    <td className="border p-3">{item.total_overtime_hours}</td>
                    <td className="border p-3">{item.total_payable_shifts}</td>
                    <td className="border p-3">
                      {new Date(item.first_uploaded_at).toLocaleString()}
                    </td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => handleDownloadPdfByRow(item)}
                        className="border border-green-500 text-green-600 p-2 rounded hover:bg-green-50"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => handleDownloadInvoiceByRow(item)}
                        className="border border-purple-500 text-purple-600 p-2 rounded hover:bg-purple-50"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-end gap-2 mt-4">
            <button
              disabled={uploadsPage <= 1}
              onClick={() => fetchAttendanceUploads(uploadsPage - 1)}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="px-3 py-2 text-sm">
              Page {uploadsPage} of {uploadsTotalPages}
            </span>

            <button
              disabled={uploadsPage >= uploadsTotalPages}
              onClick={() => fetchAttendanceUploads(uploadsPage + 1)}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckpointAttendance;

/** @format */

import React, { useState } from "react";

const FileUpload = ({ setUploadedFiles, uploadedFiles, onClose }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  console.log("files", files);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = () => {
    setUploading(true);

    // Simulate file upload
    setTimeout(() => {
      setUploadedFiles((prev) => [...prev, ...files]);
      setFiles([]);
      setUploading(false);
      onClose(); // Close the modal after upload
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Upload</h2>
      <div className="border-dashed border-2 border-purple-500 p-6 rounded-lg text-center">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="block cursor-pointer text-purple-600"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="text-3xl mb-2">📂</div>
            <div className="text-lg font-medium">
              Drag & drop files or <span className="underline">Browse</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Supported format: PDF
            </div>
          </div>
        </label>
      </div>

      <button
        onClick={handleUpload}
        className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
        disabled={!files.length}
      >
        {uploading ? "Uploading..." : "Upload Files"}
      </button>

      {uploading && (
        <div className="mt-4 text-center">
          <p>
            Uploading - {files.length} {files.length === 1 ? "file" : "files"}
          </p>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-purple-600">
                  Progress
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
              <div
                style={{ width: "100%" }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
              ></div>
            </div>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Files to Upload</h3>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-lg mb-2 bg-yellow-100"
            >
              <span>{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

/** @format */

import React, { useState } from "react";
import Navigator from "./navigator";
import Personal_Doc from "./personal_doc";
import Personal_Details from "./personal_details";
import NextOfKings from "./next_of_kings";
import Employment_Details from "./employment_details";
import Bank_Details from "./bank_details";
import Cookies from "js-cookie";

import { useSelector, useDispatch } from "react-redux";
import {
  saveEmployeeData,
  resetEmployeeState,
} from "../../../../reducers/employeeSlice"; // Import saveEmployeeData

const OnboardNew = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const dispatch = useDispatch();
  const employeeData = useSelector((state) => state.employee.employee_details);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState(""); // Error message state
  const [completedSteps, setCompletedSteps] = useState([]);
  const token = Cookies.get("accessToken");

  const handleNextStep = (currentFormValid) => {
    if (currentFormValid) {
      setCompletedSteps((prevCompleted) =>
        prevCompleted.includes(currentStep)
          ? prevCompleted
          : [...prevCompleted, currentStep]
      );
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };

  const transformEmployeeData = (data) => {
    return {
      employee_no: data.employee_no, //
      employee_fullname: data.employee_fullname, //
      employee_name_initial: data.employee_name_initial, //
      employee_calling_name: data.employee_calling_name, //
      employee_dob: data.employee_dob, //
      employee_gender: data.employee_gender, //
      employee_marital_status: data.employee_marital_status, //
      employee_contact_no: data.employee_contact_no, //
      employee_permanent_address: data.employee_permanent_address, //
      employee_temporary_address: data.employee_temporary_address, //
      employee_email: data.employee_email, //
      personal_email: data.personal_email, //
      phone_number: data.phone_number, //
      nationality: data.employee_nationality, //
      religion: data.employee_religion, //
      working_office: data.employee_working_office, //
      branch_id: parseInt(data.branch_id, 10), //
      employment_type_id: parseInt(data.employment_type, 10), //
      employee_dependent_details: data.employee_dependent_details.map(
        (dep) => ({
          employee_dependent_name: dep.employee_dependent_name,
          employee_dependent_relationship: dep.employee_dependent_relationship,
          employee_dependent_dob: dep.employee_dependent_dob, // Make sure this field exists
        })
      ), //
      date_of_appointment: data.date_of_appointment, //
      employee_basic_salary: parseFloat(data.employee_basic_salary).toFixed(2), //
      employee_active_status: data.employee_active_status, //
      employee_account_no: data.employee_account_no, //
      employee_account_name: data.employee_account_name, //
      employee_bank_name: data.employee_bank_name, //
      employee_branch_name: data.employee_branch_name, //
      department_designation_id: parseInt(data.department_designation_id, 10), //
      supervisor_id: parseInt(data.supervisor_id, 10), //
      timetable_id: parseInt(data.timetable_id, 10), //
      bank_branch_code: "", //
      bank_code: "", //
      employee_nic: "", //
    };
  };

  const handleSaveEmployeeData = async () => {
    const transformedData = transformEmployeeData(employeeData);
    console.log("send Data", transformedData);

    try {
      // Get the token from cookies
      const response = await fetch(`${API_URL}/v1/hris/employees/addemployee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the token in the headers
        },
        body: JSON.stringify(transformedData),
      });

      const result = await response.json();

      if (result.success) {
        const employeeNo = result.employee_no;
        console.log("employeeNo", employeeNo);

        const bankDetailsUploadSuccess = await handleFileUploadBankDetails(
          employeeNo
        );
        const personalDocsUploadSuccess = await handleFileUpload(employeeNo);

        setTimeout(() => {
          if (bankDetailsUploadSuccess && personalDocsUploadSuccess) {
            window.alert("Employee data and all files uploaded successfully.");

            // Clear employeeSlice state
            dispatch(resetEmployeeState());

            // Option 1: Reset currentStep
            setCurrentStep(1);

            // Option 2: Refresh the page (optional)
            // window.location.reload();
          } else {
            window.alert(
              "Employee data submitted but some files failed to upload."
            );
          }
        }, 2000);
      } else {
        const errorMessage =
          result.error || result.message || "Failed to submit employee data";
        setErrorMessage(errorMessage);
      }
    } catch (error) {
      console.error("Error submitting employee data:", error);
      setErrorMessage("Error submitting employee data. Please try again.");
    }
  };

  // Handle Bank Details Upload
  const handleFileUploadBankDetails = async (employeeNo) => {
    const formData = new FormData();
    const file = employeeData.employee_bank_details_uploaded_file;
    if (file) {
      formData.append("file", file);
    }
    formData.append("employee_no", employeeNo);

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/uploadEmployeeBankFiles`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Bank Details uploaded successfully.");
        return true; // Upload success
      } else {
        console.error(
          "Bank Details failed to upload. Status:",
          response.status
        );
        return false; // Upload failed
      }
    } catch (error) {
      console.error("Error uploading bank details:", error);
      return false; // Upload failed
    }
  };

  // Handle Personal Documents Upload
  const handleFileUpload = async (employeeNo) => {
    const formData = new FormData();
    console.log("employee document", employeeData.employee_personal_document);
    if (employeeData.employee_personal_document) {
      formData.append("files", employeeData.employee_personal_document);
    }
    formData.append("employee_no", employeeNo);

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/uploadEmployeeFiles`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Personal documents uploaded successfully.");
        return true; // Upload success
      } else {
        console.error(
          "Personal Documents failed to upload. Status:",
          response.status
        );
        return false; // Upload failed
      }
    } catch (error) {
      console.error("Error uploading personal documents:", error);
      return false; // Upload failed
    }
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Personal_Details
            data={employeeData.personal_details}
            setData={(data) =>
              dispatch(saveEmployeeData({ personal_details: data }))
            }
            handleNextStep={handleNextStep}
          />
        );
      case 2:
        return (
          <NextOfKings
            data={employeeData.employee_dependent_details}
            setData={(data) =>
              dispatch(saveEmployeeData({ employee_dependent_details: data }))
            }
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 3:
        return (
          <Employment_Details
            data={{
              department_id: employeeData.department_id,
              employee_working_office: employeeData.employee_working_office,
              branch_id: employeeData.branch_id,
              supervisor_id: employeeData.supervisor_id,
              timetable_id: employeeData.timetable_id,
              employment_type: employeeData.employment_type,
              employee_basic_salary: employeeData.employee_basic_salary,
              date_of_appointment: employeeData.date_of_appointment,
              department_designation_id: employeeData.department_designation_id,
            }} // Pass only employment details
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 4:
        return (
          <Bank_Details
            data={{
              employee_account_no: employeeData.employee_account_no,
              employee_account_name: employeeData.employee_account_name,
              employee_bank_name: employeeData.employee_bank_name,
              employee_branch_name: employeeData.employee_branch_name,
              employee_visa_category: employeeData.employee_visa_category,
              employee_visa_office: employeeData.employee_visa_office,
              employee_bank_details_uploaded_file:
                employeeData.employee_bank_details_uploaded_file,
            }} // Pass only bank details
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 5:
        return (
          <Personal_Doc
            data={{
              employee_personal_document:
                employeeData.employee_personal_document,
            }} // Pass only personal docs
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleSaveEmployeeData}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
            errorMessage={errorMessage}
          />
        );
      default:
        return <Personal_Details onNext={handleNextStep} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen">
      <div className="col-span-1 hidden lg:block w-full sticky top-0 h-screen mt-[150px]">
        <Navigator currentStep={currentStep} completedSteps={completedSteps} />
      </div>
      <div className="col-span-3 w-full overflow-y-auto shadow-lg p-8 h-[78%]">
        {renderStepComponent()}
      </div>
    </div>
  );
};

export default OnboardNew;

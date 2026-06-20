import React, { useState } from "react";
import Navigator from "./navigator";
import Personal_Doc from "./personal_doc";
import Personal_Details from "./personal_details";
import NextOfKings from "./next_of_kings";
import Employment_Details from "./employment_details";
import Bank_Details from "./bank_details";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const Onboard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [memberNo, setMemberNo] = useState(""); // To hold the response member_no
  const location = useLocation();
  const orgCode = location.state?.code || "";
  const orgId = location.state?.id || null;
  const [employeeData, setEmployeeData] = useState({
    personal_details: {},
    employee_dependent_details: [],
    department_id: "",
    employee_working_office: "",
    branch_id: "",
    supervisor_id: "",
    timetable_id: "",
    employment_type: "",
    employee_basic_salary: "",
    date_of_appointment: "",
    department_designation_id: "",
  });

  const handleNextStep = (currentFormValid) => {
    if (currentFormValid) {
      setCompletedSteps((prevCompleted) =>
        prevCompleted.includes(currentStep)
          ? prevCompleted
          : [...prevCompleted, currentStep],
      );
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Personal_Details
            organizationCode={orgCode}
            organizationId={orgId} //  new line
            data={employeeData.personal_details}
            setData={(data) =>
              setEmployeeData((prev) => ({ ...prev, personal_details: data }))
            }
            handleNextStep={handleNextStep}
            setMemberNo={setMemberNo}
          />
        );
      case 2:
        return (
          <Employment_Details
            organizationId={orgId} //  pass to employment section too
            data={{
              member_no: memberNo,
              department_id: employeeData.department_id,
              employee_working_office: employeeData.employee_working_office,
              branch_id: employeeData.branch_id,
              supervisor_id: employeeData.supervisor_id,
              timetable_id: employeeData.timetable_id,
              employment_type: employeeData.employment_type,
              employee_basic_salary: employeeData.employee_basic_salary,
              date_of_appointment: employeeData.date_of_appointment,
              department_designation_id: employeeData.department_designation_id,
            }}
            setData={(data) =>
              setEmployeeData((prev) => ({ ...prev, ...data }))
            }
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
          />
        );
      case 3:
        return (
          <NextOfKings
            data={employeeData.employee_dependent_details}
            setData={(data) =>
              setEmployeeData((prev) => ({
                ...prev,
                employee_dependent_details: data,
              }))
            }
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
          />
        );
      case 4:
        return (
          <Bank_Details
            data={employeeData}
            setData={(data) =>
              setEmployeeData((prev) => ({ ...prev, ...data }))
            }
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep} //  navigate to Personal Documents
            memberNo={memberNo}
          />
        );

      case 5:
        return (
          <Personal_Doc
            data={employeeData}
            setData={(data) =>
              setEmployeeData((prev) => ({ ...prev, ...data }))
            }
            handlePrevStep={handlePrevStep} // keep back button working
            resetToFirstStep={() => {
              //  Clear all localStorage
              localStorage.clear();

              //  Reset state
              setEmployeeData({
                personal_details: {},
                employee_dependent_details: [],
                department_id: "",
                employee_working_office: "",
                branch_id: "",
                supervisor_id: "",
                timetable_id: "",
                employment_type: "",
                employee_basic_salary: "",
                date_of_appointment: "",
                department_designation_id: "",
              });

              //  Go back to first step
              setCurrentStep(1);
            }}
            memberNo={memberNo}
          />
        );

      default:
        return <Personal_Details onNext={handleNextStep} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="w-full text-left text-2xl text-gray-700 ">
          Member Registration
        </h1>
        <div className="w-full text-left">
          <Navigator
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        <div className="w-full max-w-10xl flex-1 overflow-y-auto">
          <div className="bg-white shadow-md rounded-lg p-6">
            {renderStepComponent()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Onboard;

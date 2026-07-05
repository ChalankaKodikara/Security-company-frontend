/** @format */

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
// Import utilities
import {
  disableReactDevTools,
  suppressReactDevToolsErrors,
  debugComponentImports,
} from "./utils/devToolsUtils.js";
// Import components
import Sidebar from "./components/sidebar/sidebar.jsx";
import Navbar from "./components/hris/navbar/navbar.jsx";
// import Login from "./components/hris/login/login.jsx";
import EditUser from "./components/hris/emp_management/user_account_creation/edit_user.jsx";
import AttendanceAdjustment from "./components/hris/time_and_attendance/attendance_adjustment.jsx";
import AdjustmentForEachEmployee from "./components/hris/time_and_attendance/attendance_adjustment_each_employee.jsx";
import PrivateRoute from "./components/hris/auth/PrivateRoute.jsx";
import Leave from "./components/hris/leave/leave/leave.jsx";
import LeaveManagement from "./components/hris/leave/leave_managment/leave_management.jsx";
import LeaveRequest from "./components/hris/leave/leave_request/leave_request.jsx";
import LeaveApprove from "./components/hris/leave/leave_approve/leave_approve.jsx";
import LeaveProcessPopup from "./components/hris/leave/leave_request/leave_process_popup.jsx";
import LeaveApprovePopup from "./components/hris/leave/leave_approve/leave_approve_popup.jsx";
import RestrictedDate from "./components/hris/leave/restricted_date.jsx/restricted_date.jsx";
import Reports from "./components/hris/leave/reports/reports.jsx";
import HRReports from "./components/hris/leave/reports/hr_report/hr_report.jsx";
import Emp_Dashboard from "./components/hris/emp_management/dashboard/dashboard.jsx";
import EmpOnboard from "./components/hris/emp_management/employee_quick_onboard/emp_onboard.jsx";
import Permission from "./components/hris/emp_management/permission/permission.jsx";
import HistoryLoginDetails from "./components/hris/emp_management/history_login_details/history_login_details.jsx";
import User_account_creation from "./components/hris/emp_management/user_account_creation/user_account_creation.jsx";
import Time_Attendance_Dashboard from "./components/hris/time_and_attendance/time_and_attendance.jsx";
import Time_Management from "./components/hris/time_and_attendance/timetable.jsx";
import Absence_Report from "./components/hris/time_and_attendance/absence_report.jsx";
import Leave_Report from "./components/hris/leave/reports/leave_report/leave_report.jsx";
import Checkin_checkout_report from "./components/hris/time_and_attendance/checking_checkout_report.jsx";
import LeaveRequestPopup from "./components/hris/leave/leave_request/leave_request_popup.jsx";
import Hr_Report_Pdf from "./components/hris/leave/reports/hr_report/hr_report_pdf.jsx";
import Modal from "./components/hris/emp_management/employee_quick_onboard/testModal.jsx";
import Emp_details_pdf from "./components/hris/emp_management/view_emp_details/emp_details_pdf.jsx";
import Departmental_Comparison from "./components/hris/time_and_attendance/departmental_comparison.jsx";
import User_Permission from "./components/hris/settings/RoleManagement/RoleManagementPage.jsx";
import Create_User_Permission from "./components/hris/settings/create_user_permission.jsx";
import Edit_User_Permission from "./components/hris/settings/edit_user_permission.jsx";
import History_Logged from "./components/hris/emp_management/history_logged_details/history_logged_details.jsx";
import Attendance_History_Report from "./components/hris/time_and_attendance/attendance_history_report.jsx";
import Service_Charge from "./components/hris/settings/service_charge.jsx";
import Supervisor from "./components/hris/settings/supervisor.jsx";
import Onboard_new from "./components/hris/emp_management/employee_quick_onboard/onboard_new.jsx";
import Next_Of_Kings from "./components/hris/emp_management/employee_quick_onboard/next_of_kings.jsx";
import Branch from "./components/hris/settings/create_branch.jsx";
import Employee_Type_Add from "./components/hris/settings/add_employee_type.jsx";
import Salaray_Component_Management from "./components/hris/settings/salaray_component_management.jsx";
import Payroll_Navigation from "./components/hris/payroll/payroll_management.jsx";
import Payroll_Allowance from "./components/hris/payroll/payroll_allowance.jsx";
import Payroll_Deduction from "./components/hris/payroll/payroll_deduction.jsx";
import Allowance_Component from "./components/hris/payroll/allowance_component.jsx";
import Deduction_Component from "./components/hris/payroll/deduction_component.jsx";
import Salary_Breakdown from "./components/hris/payroll/salary_breakdown.jsx";
import Service_Charge_Payroll from "./components/hris/payroll/service_charge_payroll.jsx";
import Salary_Advance from "./components/hris/payroll/salary_advance.jsx";
import Month_End_Payroll from "./components/hris/payroll/month_end_payroll.jsx";
import Incentive_Payroll from "./components/hris/payroll/incentive_payroll_new_screen.jsx";
import Genarated_Payroll from "./components/hris/payroll/genarated_payroll.jsx";
import Create_Leave_Types from "./components/hris/leave/leave_managment/create_leave_type.jsx";
import Leave_Allocation from "./components/hris/leave/leave_managment/leave_allocation.jsx";
import View_Leave_Table from "./components/hris/leave/leave_managment/view_leave_table.jsx";
import Leave_History from "./components/hris/leave/leave_managment/leave_history.jsx";
import Genarated_Incentive_Payroll from "./components/hris/payroll/genarated_incentive_payroll.jsx";
import Service_Charge_Percentage from "./components/hris/payroll/service_charge_percentage.jsx";
import Assign_Roster from "./components/hris/settings/assign_roster.jsx";
import Loan_Managemnt from "./components/hris/payroll/loan_management/loan_management.jsx";
import Loan_Approval_One from "./components/hris/payroll/loan_management/loan_approval_one.jsx";
import Create_Loan from "./components/hris/settings/create_loan.jsx";
import Emp_Management from "./components/hris/emp_management/emp_management/emp_management.jsx";
import Job_Posting_Management from "./components/hris/employee_recruitment/job_posting_management.jsx";
import Collect_Job_Details from "./components/hris/employee_recruitment/collect_job_details.jsx";
import Supervisor_Approval from "./components/hris/supervisor_approval/supervisor_approval.jsx";
import Job_Publishing_Workflow from "./components/hris/employee_recruitment/job_publishing_workflow.jsx";
import Open_Jobs from "./components/hris/employee_recruitment/open_jobs.jsx";
import Open_Job_View from "./components/hris/employee_recruitment/open_jobs_view.jsx";
import Cv_Shortlist_One from "./components/hris/employee_recruitment/cv_shortlist_one.jsx";
import Cv_Shortlist_Two from "./components/hris/employee_recruitment/cv_shortlist_two.jsx";
import Shortlisted_Cv_Supervisor1 from "./components/hris/employee_recruitment/shortlisted_cv_supervisor1.jsx";
import Shortlisted_Cv_Supervisor2 from "./components/hris/employee_recruitment/shortlisted_cv_supervisor2.jsx";
import Fully_Shortlisted_Candidates from "./components/hris/employee_recruitment/fully_shortlisted_candidates.jsx";
import Fully_Finalised_Vacancies from "./components/hris/employee_recruitment/fully_finalised_vacancies.jsx";
import Create_Interview from "./components/hris/employee_recruitment/create_interview.jsx";
import View_Created_Interviews from "./components/hris/employee_recruitment/view_created_interviews.jsx";
import Approval_Request_Box from "./components/hris/employee_recruitment/approval_request_box.jsx";
import Interviews from "./components/hris/employee_recruitment/interviews.jsx";
import Interview_Screen from "./components/hris/employee_recruitment/interview_screen.jsx";
import Marks_By_Interviewer from "./components/hris/employee_recruitment/marks_by_interviewer.jsx";
import Interviews_With_Stages from "./components/hris/employee_recruitment/interviews_with_stages.jsx";
import Interviews_By_Hr from "./components/hris/employee_recruitment/interview_hr_screen.jsx";
import Interviews_With_Stages_Hr from "./components/hris/employee_recruitment/interviews_with_stages_hr.jsx";

// Performance imports
import Performance_Evaluation_Nav from "./components/hris/performance/perfomance_evaluation_nav/performance_evaluation_nav.jsx";
import View_Performance from "./components/hris/performance/perfomance_evaluation_nav/view_performance.jsx";
import Open_Performance_Evaluation from "./components/hris/performance/perfomance_evaluation_nav/open_performance_evaluation.jsx";
import View_Employees from "./components/hris/performance/perfomance_evaluation_nav/view_employees.jsx";
import Performance_Sheet from "./components/hris/performance/performance_sheet/performance_sheet.jsx";
import Others_Performance_Sheet from "./components/hris/performance/others_performance_sheet/others_performance_sheet.jsx";
import View_Others_Performance from "./components/hris/performance/others_performance_sheet/view_others_performance_sheet.jsx";
import Current_Month_Performance from "./components/hris/performance/currrent_month_performance/current_month_performance.jsx";
import View_Current_Month_Performance from "./components/hris/performance/currrent_month_performance/view_current_month_performance.jsx";
import View_Employees_Performance from "./components/hris/performance/others_performance_sheet/view_emplolyees_performance.jsx";

// CBEU UPDATES
import Onboard from "./components/hris/UserRegistration/onboard_new.jsx";
import RegisteredMembers from "./components/hris/RegisteredMembers/RegisteredMembers.jsx";
import ViewRegisteredMembers from "./components/hris/RegisteredMembers/ViewRegisteredMembers.jsx";
import ColaAllowance from "./components/hris/payroll/cola_allowance.jsx";
import SpectaclesAllowance from "./components/hris/payroll/spectacles_allowance.jsx";
import LoanReimbursement from "./components/hris/master_data/setup_loan_reimbursement.jsx";
import ReimbursementApplication from "./components/hris/payroll/reimbursement_application.jsx";
import ReimbursementTable from "./components/hris/payroll/reimbursement.jsx";
import ViewSpectaclesAllowance from "./components/hris//payroll/view_spectacles_allowance.jsx";
import MedicalAllowance from "./components/hris/payroll/medical_allowance.jsx";
import BillReimbursement from "./components/hris/payroll/bill_reimbursement.jsx";
import ViewMothEndOvertime from "./components/hris/payroll/view_monthend_overtime.jsx";
import ViewMonthendAttendance from "./components/hris/payroll/view_monthend_attendance.jsx";
import ViewOvertimeInOut from "./components/hris/payroll/view_overtime_in_out.jsx";
import ViewAttendanceInOut from "./components/hris/payroll/view_attendance_in_out.jsx";
import ViewGenaratedMonthEndPayroll from "./components/hris/payroll/view_genarate_month_end_payroll.jsx";
import ViewMonthEndAllowance from "./components/hris/payroll/view_month_end_payroll/view_month_end_allowance.jsx";
import ViewMonthEndCola from "./components/hris/payroll/view_month_end_payroll/view_month_end_cola.jsx";
import ViewMonthEndMedical from "./components/hris/payroll/view_month_end_payroll/view_month_end_medical.jsx";
import ViewGenaratedMonthEndPayrollaftersucess from "./components/hris/payroll/View_Calculated_Month_End_Payroll.jsx";
import ViewMonthEndSalaryAdvanced from "./components/hris/payroll/view_month_end_payroll/view_month_end_salary_advanced.jsx";
import ViewMonthEndSpectacleAllowance from "./components/hris/payroll/view_month_end_payroll/view_month_end_spectacle_allowance.jsx";
import ViewMonthEndLoanReimbursement from "./components/hris/payroll/view_month_end_payroll/view_month_end_loan_reimbursment.jsx";
import ViewMonthEndDeduction from "./components/hris/payroll/view_month_end_payroll/view_month_end_deduction.jsx";
import ViewMonthEndBillReimbursements from "./components/hris/payroll/view_month_end_payroll/view_month_end_bill_reimbursement.jsx";
import ReportSection from "./components/hris/reports/reports_nav.jsx";
import AttendanceNav from "./components/hris/reports/attendance_navigation.jsx";
import PayrollNavigation from "./components/hris/reports/payroll_navigation.jsx";
import CheckInOutReport from "./components/hris/reports/check_in_out_report.jsx";
import AbsenceReportSection from "./components/hris/reports/absence_report.jsx";
import AddWorkingDays from "./components/hris/master_data/add_working_days.jsx";
import EmployeeReport from "./components/hris/reports/EmployeeReport/EmployeeReport.jsx";
import BankslipReport from "./components/hris/reports/payrollReports/Bankslipreport.jsx";
import BudgetaryAllowance from "./components/hris/payroll/budgetary_allowance.jsx";
import SalaryArrears from "./components/hris/payroll/salary_arrears.jsx";
import EPFReport from "./components/hris/payroll/EPFReport.jsx";
import BankBranchesSetup from "./components/hris/master_data/BanksBranches/BanksPage.jsx";
import WorkingOffice from "./components/hris/master_data/working_office/working_office.jsx";
import Department from "./components/hris/master_data/Departmens/Department.jsx";
import Designation from "./components/hris/master_data/designations/designations.jsx";
import EmployeeGrade from "./components/hris/master_data/Employee_Grade/Employee_Grade.jsx";
import NoticeBoard from "./components/hris/noticeBoard/noticeBoard.jsx";
import LeaveAssignEmployee from "./components/hris/leave/leave_managment/assign_employee_leave.jsx";
import SetupReimbursement from "./components/hris/master_data/reimbursement/Reimbursement.jsx";
import ViewShortLeaves from "./components/hris/leave/leave_managment/view_short_leaves.jsx";
import EmployeeTermination from "./components/hris/emp_management/employee_termination/employeeTermination.jsx";
import OraganizationLanding from "./components/hris/UserRegistration/organizations/organizations_landing.jsx";
import SetupOrganizations from "./components/hris/settings/setup_organizations/setup_organizations.jsx";
import WorkingDaySetup from "./components/hris/payroll/working_days_setup/working_days_setup.jsx";
import OrganizationSetupLanding from "./components/hris/settings/setup_organizations/organization_landing.jsx";
import AddOrg from "./components/hris/settings/setup_organizations/add_org.jsx";
import ViewOrg from "./components/hris/settings/setup_organizations/view_org.jsx";
import ViewEditOrg from "./components/hris/settings/setup_organizations/view_edit_org.jsx";
import PayrollORG from "./components/hris/payroll/payroll_org.jsx";
import AccessControl from "./components/hris/emp_management/access_control/access_control.jsx";
// import Snowfall from "react-snowfall";
import OTManagemenet from "./components/hris/time_and_attendance/ot_management.jsx";
import OTAssining from "./components/hris/time_and_attendance/overtime_assignment.jsx";
import OTAuthorization from "./components/hris/time_and_attendance/ovetime_authorization.jsx";
import OvertimeVerification from "./components/hris/time_and_attendance/overtime_verification.jsx";
import ViewOTAuthorization from "./components/hris/time_and_attendance/view_ot_authorization.jsx";
import ViewOTVerification from "./components/hris/time_and_attendance/view_ot_verification.jsx";
import ViewOTAssignments from "./components/hris/time_and_attendance/view_ot_assignments.jsx";
import LeaveHistoryForEmployees from "./components/hris/leave/leave_managment/leave_history_for_employees.jsx";
import LeaveCountsForEachEmp from "./components/hris/leave/leave_managment/leave_counts_for_each_emp.jsx";
import LeaveEncashment from "./components/hris/leave/leave_managment/leave_encashment.jsx";
import HoldEmp from "./components/hris/payroll/hold_emp.jsx";
import IntermediateSalary from "./components/hris/payroll/intermediate_salary.jsx";
import ViewIntermediatePayments from "./components/hris/payroll/view_intermediate_oayments.jsx";
import LoanApprovalTwo from "./components/hris/payroll/loan_management/loan_approval_two.jsx";
import InstentivePayroll from "./components/hris/payroll/insentive_allowance.jsx";
import SpectacleApproval1 from "./components/hris/payroll/spectacle_allowance_approval_1.jsx";
import SpectacleApproval2 from "./components/hris/payroll/spectacle_allowance_approval_2.jsx";
import MedicalAllowanceApproval1 from "./components/hris/payroll/medical__allowance_approval_1.jsx";
import MedicalAllowanceApproval2 from "./components/hris/payroll/medical_allowance_approval_2.jsx";
import InsentiveLanding from "./components/hris/payroll/insentive_landing.jsx";
import PayrollHandlingLanding from "./components/hris/payroll/payroll_handling_landing.jsx";
import PayrollHandlingCards from "./components/hris/payroll/payroll_handling_cards.jsx";
import PayrollHandlingMonthEnd from "./components/hris/payroll/payroll_handling_monthend.jsx";
import ViewPayrollHandlingMonthend from "./components/hris/payroll/view_payroll_handling_monthend.jsx";
import PayrollHandlingIncentive from "./components/hris/payroll/payroll_handling_incentive.jsx";
import SSOLogin from "./components/hris/login/SSOLogin.jsx";
import LoadingPage from "./components/hris/login/login.jsx";
import ServiceCharge from "./components/hris/payroll/service_charge.jsx";
import RequestPayslip from "./components/hris/payroll/request_payslip.jsx";
import UploadShift from "./components/hris/payroll/upload_shift.jsx";
import ShiftEmployeeSummary from "./components/hris/payroll/ShiftEmployeeSummary.jsx";
import ViewIncentiveAttendance from "./components/hris/payroll/view_incentive_attendance.jsx";
import ViewIncentiveHoldEmp from "./components/hris/payroll/view_incentive_hold_emp.jsx";
import ViewIncentiveShift from "./components/hris/payroll/view_incentive_shift.jsx";
import ViewIncentiveAllowance from "./components/hris/payroll/view_incentive_allowance.jsx";
import ViewIncentiveDeduction from "./components/hris/payroll/view_incentive_deduction.jsx";
import ViewIncentiveSalaryAdvance from "./components/hris/payroll/view_incentive_salary_advance.jsx";
import ViewIncentivePayroll from "./components/hris/payroll/view_incentive_payroll.jsx";
import CheckpointAttendance from "./components/hris/payroll/CheckpointAttendance.jsx";
import ClientManagement from "./components/hris/payroll/ClientManagement.jsx";
import QuickOnboardNew from "./components/hris/emp_management/employee_quick_onboard/quick-onboard-new.jsx";
const AppContent = ({
  isSidebarOpen,
  toggleSidebar,
  showSessionExpiredPopup,
  notifications,
  setNotifications,
  showNotificationPopup,
  setShowNotificationPopup,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSessionExpired = () => {
    // Immediately clear session data and redirect without asking the user
    Cookies.remove("yourCookieName"); // Adjust cookie name accordingly
    localStorage.removeItem("sessionStartTime");
    navigate("/login");
  };

  const resetSessionTimer = () => {
    localStorage.setItem("sessionStartTime", new Date().getTime());
  };

  useEffect(() => {
    const checkSession = () => {
      const sessionStartTime = localStorage.getItem("sessionStartTime");
      if (sessionStartTime) {
        const currentTime = new Date().getTime();
        const sessionExpiryTime = parseInt(sessionStartTime) + 30 * 60 * 1000; // 30 minutes
        if (currentTime > sessionExpiryTime) {
          showSessionExpiredPopup();
          handleSessionExpired();
        }
      }
    };

    checkSession();

    // Add event listeners for user activity
    window.addEventListener("mousemove", resetSessionTimer);
    window.addEventListener("keypress", resetSessionTimer);
    window.addEventListener("click", resetSessionTimer);

    return () => {
      // Clean up event listeners
      window.removeEventListener("mousemove", resetSessionTimer);
      window.removeEventListener("keypress", resetSessionTimer);
      window.removeEventListener("click", resetSessionTimer);
    };
  }, [location, showSessionExpiredPopup]);

  const isOnboardNewRoute = location.pathname === "/onboard_new";

  return (
    <div className="App flex">
      {/* Snow effect overlay */}
      {/* <Snowfall
        snowflakeCount={1000}
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          pointerEvents: "none" // important!
        }}
      /> */}
      {location.pathname !== "/login" && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      <div
        className={`flex-grow p-5 transition-all duration-300 ${
          isSidebarOpen && location.pathname !== "/login" ? "ml-64" : "ml-20"
        }`}
        style={
          isOnboardNewRoute
            ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }
            : {}
        }
      >
        {location.pathname !== "/login" && (
          <Navbar
            notifications={notifications}
            setNotifications={setNotifications}
            showNotificationPopup={showNotificationPopup}
            setShowNotificationPopup={setShowNotificationPopup}
          />
        )}
        <Routes>
          <Route path="/leave-info" element={<Leave />} />
          <Route path="/leave-management" element={<LeaveManagement />} />
          <Route path="/leave-request" element={<LeaveRequest />} />
          <Route path="/leave-approve" element={<LeaveApprove />} />
          <Route path="/leave-taken" element={<LeaveProcessPopup />} />
          <Route path="/leave-approve-popup" element={<LeaveApprovePopup />} />
          <Route path="/restricted-date" element={<RestrictedDate />} />
          <Route path="/hr-report" element={<HRReports />} />
          <Route path="/leave-reports" element={<Reports />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/emp-onboard" element={<EmpOnboard />} />
          <Route path="/permission" element={<Permission />} />
          <Route
            path="/history-Login-Details"
            element={<HistoryLoginDetails />}
          />
          {/* employee portal */}
          <Route path="/emp-dashboard" element={<Emp_Dashboard />} />
          <Route
            path="/create-user-account"
            element={<User_account_creation />}
          />
          <Route path="/leave-balance-report" element={<Leave_Report />} />
          {/* Time and Attendance */}
          <Route
            path="/time-attendance-dashboard"
            element={<Time_Attendance_Dashboard />}
          />
          <Route path="/time-management" element={<Time_Management />} />
          <Route path="/absence-report" element={<Absence_Report />} />
          <Route
            path="/Checkin-checkout-Report"
            element={<Checkin_checkout_report />}
          />
          <Route path="/Leave-Request-Popup" element={<LeaveRequestPopup />} />
          <Route path="/hr-report-pdf" element={<Hr_Report_Pdf />} />
          <Route path="/Modal-popup" element={<Modal />} />
          <Route path="/emp_details_pdf" element={<Emp_details_pdf />} />
          <Route
            path="/department-comparison"
            element={<Departmental_Comparison />}
          />
          <Route path="/user-permission" element={<User_Permission />} />
          <Route
            path="/create-user-permission"
            element={<Create_User_Permission />}
          />
          <Route
            path="/edit-user-permission"
            element={<Edit_User_Permission />}
          />
          <Route path="/history-logged" element={<History_Logged />} />
          <Route
            path="/attendance-history-report"
            element={<Attendance_History_Report />}
          />
          <Route path="/Supervisor" element={<Supervisor />} />
          {/* dlh updates */}
          <Route path="/onboard_new" element={<Onboard_new />} />
          <Route path="/next-of-kings" element={<Next_Of_Kings />} />
          <Route path="/branch" element={<Branch />} />
          <Route path="/add-employee-type" element={<Employee_Type_Add />} />
          <Route
            path="/salaray-component-management"
            element={<Salaray_Component_Management />}
          />
          <Route path="/payroll-navigation" element={<Payroll_Navigation />} />
          <Route path="/payroll-allowance" element={<Payroll_Allowance />} />
          <Route path="/payroll-deduction" element={<Payroll_Deduction />} />
          <Route
            path="/allowance-component"
            element={<Allowance_Component />}
          />
          <Route
            path="/deduction-component"
            element={<Deduction_Component />}
          />
          <Route path="/salary-breakdown" element={<Salary_Breakdown />} />
          <Route
            path="/service-charge-payroll"
            element={<Service_Charge_Payroll />}
          />
          <Route path="/salary-advance" element={<Salary_Advance />} />
          <Route path="/month-end-payroll" element={<Month_End_Payroll />} />
          <Route
            path="/incentive-payroll-screen"
            element={<Incentive_Payroll />}
          />
          <Route path="/Generated-payroll" element={<Genarated_Payroll />} />
          <Route path="/create-leave-types" element={<Create_Leave_Types />} />
          <Route path="/leave-allocation" element={<Leave_Allocation />} />
          <Route path="/view-leave-table" element={<View_Leave_Table />} />
          <Route path="/leave-history" element={<Leave_History />} />
          <Route
            path="/genarated-incentive-payroll"
            element={<Genarated_Incentive_Payroll />}
          />
          <Route
            path="/service-charge-percentage"
            element={<Service_Charge_Percentage />}
          />
          <Route path="/assign-roster" element={<Assign_Roster />} />
          <Route path="/loan-management" element={<Loan_Managemnt />} />
          <Route path="/loan-approval-one" element={<Loan_Approval_One />} />
          <Route path="/create-loan" element={<Create_Loan />} />
          <Route path="/emp-management" element={<Emp_Management />} />
          <Route
            path="/job-posting-management"
            element={<Job_Posting_Management />}
          />
          <Route
            path="/collect-job-details"
            element={<Collect_Job_Details />}
          />
          <Route
            path="/supervisor-approval"
            element={<Supervisor_Approval />}
          />
          <Route path="/job-publishing" element={<Job_Publishing_Workflow />} />
          <Route path="/open-jobs" element={<Open_Jobs />} />
          <Route path="/view-open-jobs" element={<Open_Job_View />} />
          <Route path="/cv-shortlist-one" element={<Cv_Shortlist_One />} />
          <Route path="/cv-shortlist-two" element={<Cv_Shortlist_Two />} />
          <Route
            path="/shortlisted-supervisor1"
            element={<Shortlisted_Cv_Supervisor1 />}
          />
          <Route
            path="/shortlisted-supervisor2"
            element={<Shortlisted_Cv_Supervisor2 />}
          />
          <Route
            path="/fully-shortlisted-candidates"
            element={<Fully_Shortlisted_Candidates />}
          />
          <Route
            path="/fully-finalised-vacancies"
            element={<Fully_Finalised_Vacancies />}
          />
          <Route path="/create-interview" element={<Create_Interview />} />
          <Route
            path="/view-created-interviews"
            element={<View_Created_Interviews />}
          />
          <Route
            path="/approval-request-box"
            element={<Approval_Request_Box />}
          />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/interview-screen" element={<Interview_Screen />} />
          <Route
            path="/marks-by-interviewer"
            element={<Marks_By_Interviewer />}
          />
          <Route
            path="/interviews-stages"
            element={<Interviews_With_Stages />}
          />
          <Route path="/interviews-hr" element={<Interviews_By_Hr />} />
          <Route
            path="/interviews-stages-hr"
            element={<Interviews_With_Stages_Hr />}
          />
          {/* Performance routes */}
          <Route
            path="/performance-evaluation-nav"
            element={<Performance_Evaluation_Nav />}
          />
          <Route path="/view-performance" element={<View_Performance />} />
          <Route
            path="/open-performance-evaluation"
            element={<Open_Performance_Evaluation />}
          />
          <Route path="/view-employees" element={<View_Employees />} />
          <Route path="/performance-sheet" element={<Performance_Sheet />} />
          <Route
            path="/others-performance-sheet"
            element={<Others_Performance_Sheet />}
          />
          <Route
            path="/view-others-performance"
            element={<View_Others_Performance />}
          />
          <Route
            path="/current-month-performance"
            element={<Current_Month_Performance />}
          />
          <Route
            path="/view-current-month-performance"
            element={<View_Current_Month_Performance />}
          />
          <Route
            path="/view-employees-performance"
            element={<View_Employees_Performance />}
          />
          {/* CBEU UPDATES */}
          <Route path="/onboard-v2/:id" element={<Onboard />} />
          <Route path="/registered-members" element={<RegisteredMembers />} />
          <Route
            path="/view-registered-members"
            element={<ViewRegisteredMembers />}
          />
          <Route path="/cola-allowance" element={<ColaAllowance />} />
          <Route path="/loan-reimbursement" element={<LoanReimbursement />} />
          <Route
            path="/reimbursement-application"
            element={<ReimbursementApplication />}
          />
          <Route path="/reimbursement-table" element={<ReimbursementTable />} />
          <Route
            path="/reimbursement-application/:id"
            element={<ReimbursementApplication />}
          />
          <Route
            path="/spectacles-allowance"
            element={<SpectaclesAllowance />}
          />
          <Route
            path="/view-spectacles-allowance"
            element={<ViewSpectaclesAllowance />}
          />
          <Route path="/medical-allowance" element={<MedicalAllowance />} />
          <Route path="/bill-reimbursement" element={<BillReimbursement />} />
          <Route
            path="/view-monthend-overtime"
            element={<ViewMothEndOvertime />}
          />
          <Route
            path="/view-monthend-attendance"
            element={<ViewMonthendAttendance />}
          />
          <Route path="/view-overtime-in-out" element={<ViewOvertimeInOut />} />
          <Route
            path="/view-attendance-in-out"
            element={<ViewAttendanceInOut />}
          />
          <Route
            path="/view-genarated-month-end-payroll"
            element={<ViewGenaratedMonthEndPayroll />}
          />
          <Route
            path="/view-genarated-month-end-allowance"
            element={<ViewMonthEndAllowance />}
          />
          <Route
            path="/view-genarated-month-end-cola"
            element={<ViewMonthEndCola />}
          />
          <Route
            path="/view-genarated-month-end-medical"
            element={<ViewMonthEndMedical />}
          />
          <Route
            path="/view-calculated-month-end-payroll"
            element={<ViewGenaratedMonthEndPayrollaftersucess />}
          />
          <Route
            path="/view-genarated-month-end-salary-advance"
            element={<ViewMonthEndSalaryAdvanced />}
          />
          <Route
            path="/view-genarated-month-end-spectacles"
            element={<ViewMonthEndSpectacleAllowance />}
          />
          <Route
            path="/view-genarated-month-end-loan-reimbursement"
            element={<ViewMonthEndLoanReimbursement />}
          />
          <Route
            path="/view-genarated-month-end-deduction"
            element={<ViewMonthEndDeduction />}
          />
          <Route
            path="/view-genarated-month-end-bill-reimbursement"
            element={<ViewMonthEndBillReimbursements />}
          />
          <Route path="/reports-section" element={<ReportSection />} />
          <Route path="/attendance-nav" element={<AttendanceNav />} />
          <Route path="/payroll-nav" element={<PayrollNavigation />} />
          <Route path="/check-in-out-report" element={<CheckInOutReport />} />
          <Route path="/absence-report" element={<AbsenceReportSection />} />
          <Route path="/add-working-days" element={<AddWorkingDays />} />
          <Route path="/employee-report" element={<EmployeeReport />} />
          <Route path="/bank-slip-report" element={<BankslipReport />} />
          <Route path="/budgetary-allowance" element={<BudgetaryAllowance />} />
          <Route path="/salary-arrears" element={<SalaryArrears />} />
          <Route path="/epf-report" element={<EPFReport />} />
          <Route path="/bank-branch-setup" element={<BankBranchesSetup />} />
          <Route path="/setup-working-office" element={<WorkingOffice />} />
          <Route path="/setup-departments" element={<Department />} />
          <Route path="/setup-designations" element={<Designation />} />
          <Route path="/setup-employee-grade" element={<EmployeeGrade />} />
          <Route path="/notice-board" element={<NoticeBoard />} />
          <Route path="/view-short-leaves" element={<ViewShortLeaves />} />
          <Route
            path="/employee-termination"
            element={<EmployeeTermination />}
          />
          <Route
            path="/assign-employee-leave"
            element={<LeaveAssignEmployee />}
          />
          <Route path="/setup-reimbursement" element={<SetupReimbursement />} />
          <Route path="/edit-user/:employee_no" element={<EditUser />} />
          <Route
            path="/attendance-adjustment"
            element={<AttendanceAdjustment />}
          />
          <Route
            path="/adjustment-each-employee/:employee_no"
            element={<AdjustmentForEachEmployee />}
          />
          <Route
            path="/organization-landing"
            element={<OraganizationLanding />}
          />
          <Route path="/setup-organizations" element={<SetupOrganizations />} />
          <Route path="/Working-days-setup" element={<WorkingDaySetup />} />
          <Route
            path="/organization-setup-landing"
            element={<OrganizationSetupLanding />}
          />
          <Route path="/org-view" element={<AddOrg />} />
          <Route path="/view-org" element={<ViewOrg />} />
          <Route path="/view-edit-org" element={<ViewEditOrg />} />
          <Route path="/access-control" element={<AccessControl />} />
          <Route path="/payroll-organization" element={<PayrollORG />} />
          <Route
            path="/incentive-payroll-organization"
            element={<PayrollORG />}
          />
          <Route path="/ot-management" element={<OTManagemenet />} />
          <Route path="/ot-assignment" element={<OTAssining />} />
          <Route path="/ot-authorization" element={<OTAuthorization />} />
          <Route path="/ot-verification" element={<OvertimeVerification />} />
          <Route
            path="/view-ot-authorization"
            element={<ViewOTAuthorization />}
          />
          <Route
            path="/view-ot-authorization"
            element={<ViewOTAuthorization />}
          />
          <Route
            path="/view-ot-verification"
            element={<ViewOTVerification />}
          />
          <Route path="/view-ot-assignments" element={<ViewOTAssignments />} />
          <Route
            path="/leave-history-employees"
            element={<LeaveHistoryForEmployees />}
          />
          <Route
            path="/leave-counts-each-employee"
            element={<LeaveCountsForEachEmp />}
          />
          <Route path="/leave-encashment" element={<LeaveEncashment />} />
          <Route path="/hold-employees" element={<HoldEmp />} />
          <Route path="/intermediate-salary" element={<IntermediateSalary />} />
          <Route
            path="/view-intermediate-salary"
            element={<ViewIntermediatePayments />}
          />
          <Route
            path="/view-intermediate-salary"
            element={<ViewIntermediatePayments />}
          />
          <Route path="/loan-approval-two" element={<LoanApprovalTwo />} />
          <Route path="/insentive-allowance" element={<InstentivePayroll />} />
          <Route
            path="/spectacle-allowance-app-one"
            element={<SpectacleApproval1 />}
          />
          <Route
            path="/spectacle-allowance-app-two"
            element={<SpectacleApproval2 />}
          />
          <Route
            path="/medical-allowance-app-one"
            element={<MedicalAllowanceApproval1 />}
          />
          <Route
            path="/medical-allowance-app-two"
            element={<MedicalAllowanceApproval2 />}
          />
          <Route path="/insentive-landing" element={<InsentiveLanding />} />
          <Route
            path="/payroll-handling-landing"
            element={<PayrollHandlingLanding />}
          />
          <Route
            path="/payroll-handling-cards"
            element={<PayrollHandlingCards />}
          />
          <Route
            path="/payroll-handling-monthend"
            element={<PayrollHandlingMonthEnd />}
          />
          <Route
            path="/view-payroll-handling-monthend"
            element={<ViewPayrollHandlingMonthend />}
          />
          <Route
            path="/payroll-handling-incentive"
            element={<PayrollHandlingIncentive />}
          />
          <Route path="/service-charge" element={<ServiceCharge />} />
          <Route path="/request-payslip" element={<RequestPayslip />} />
          <Route path="/upload-employee-shift" element={<UploadShift />} />
          <Route
            path="/view-incentive-hold-emp"
            element={<ViewIncentiveHoldEmp />}
          />
          <Route
            path="/view-incentive-attendance"
            element={<ViewIncentiveAttendance />}
          />
          <Route
            path="/view-incentive-shift"
            element={<ViewIncentiveShift />}
          />
          <Route
            path="/view-incentive-allowance"
            element={<ViewIncentiveAllowance />}
          />
          <Route
            path="/view-incentive-deduction"
            element={<ViewIncentiveDeduction />}
          />
          <Route
            path="/view-incentive-salary-advance"
            element={<ViewIncentiveSalaryAdvance />}
          />
          <Route
            path="/view-incentive-payroll"
            element={<ViewIncentivePayroll />}
          />
          <Route
            path="/shiftemployeesummary"
            element={<ShiftEmployeeSummary />}
          />
          <Route
            path="/checkpoint-attendance"
            element={<CheckpointAttendance />}
          />{" "}
          <Route path="/client-management" element={<ClientManagement />} />{" "}
          <Route path="/quick-onboarding" element={<QuickOnboardNew />} />{" "}
        </Routes>
      </div>
    </div>
  );
};

function App() {
  // Initialize error suppression for React DevTools
  useEffect(() => {
    try {
      disableReactDevTools();
      suppressReactDevToolsErrors();

      // Enable debugging in development
      if (process.env.NODE_ENV === "development") {
        debugComponentImports();
      }
    } catch (error) {
      console.warn("Could not initialize DevTools error suppression:", error);
    }
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  //  define notifications state here (not from props!)
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const showSessionExpiredPopup = () => {
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000); // Hide popup after 3 seconds
  };
  return (
    <Router>
      <Routes>
        {/* Standalone Login Route */}
        {/* <Route path="/login" element={<Login />} /> */}
        <Route path="/sso-login" element={<SSOLogin />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AppContent
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                showSessionExpiredPopup={showSessionExpiredPopup}
                notifications={notifications}
                setNotifications={setNotifications}
                showNotificationPopup={showNotificationPopup}
                setShowNotificationPopup={setShowNotificationPopup}
              />
            </PrivateRoute>
          }
        />
      </Routes>

      {showPopup && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center p-4">
          Your session has expired. Please log in again.
        </div>
      )}

      {/* Global Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;

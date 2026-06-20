import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_GROUPS = {
    "Personal Employment Details": [
        { label: "Member No", key: "member_no" },
        { label: "Member Full Name", key: "member_full_name" },
        { label: "Name with Initial", key: "name_with_initial" },
        { label: "Name in Usage", key: "name_in_usage" },
        { label: "Date of Birth", key: "date_of_birth" },
        { label: "NIC Number", key: "nic_no" },
        { label: "Mobile Number", key: "mobile_no" },
        { label: "WhatsApp Number", key: "whatsapp_number" },
        { label: "Private Email Address", key: "private_email_address" },
        { label: "Private Telephone Number", key: "private_telephone_no" },
        { label: "Private Address", key: "private_address" }
    ],
    // "Next of Kin Details": [
    //     { label: "Next of Kin Name", key: "nok_name" },
    //     { label: "Next of Kin Address", key: "nok_address" },
    //     { label: "Next of Kin NIC", key: "nok_nic" },
    //     { label: "Relationship", key: "relationship" },
    //     { label: "Guardian Status", key: "is_guardian" }
    // ],
    "Official Employment Details": [
        { label: "Designation", key: "designation" },
        { label: "Grade", key: "grade" },
        { label: "Status", key: "status" },
        { label: "EPF Number", key: "epf_no" },
        { label: "Official Telephone Number", key: "official_telephone_no" },
        { label: "Official Email", key: "official_email" },
        { label: "Note", key: "note" },
        { label: "Date of Joining Service", key: "date_of_joining_service" },
        { label: "Bank Code", key: "bank_code" },
        { label: "Branch Code", key: "branch_code" },
        { label: "Branch District", key: "branch_district" }
    ],
    "Bank Details": [
        { label: "Account Number", key: "account_number" },
        { label: "Account Holder Name", key: "account_holder_name" },
        { label: "Personal Bank Name", key: "personal_bank_name" },
        { label: "Branch Name", key: "branch_name" },
        { label: "Document File Path", key: "document_file_path" }
    ]
};

const ExportRegisteredMemberDetails = ({ onClose, onExport }) => {
    const [selectedFields, setSelectedFields] = useState({});
    const [collapsedGroups, setCollapsedGroups] = useState({});

    const toggleField = (key) => {
        setSelectedFields(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleExport = () => {
        const selectedKeys = Object.keys(selectedFields).filter(k => selectedFields[k]);
        onExport(selectedKeys);
        onClose();
    };

    const toggleGroupCollapse = (groupLabel) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupLabel]: !prev[groupLabel]
        }));
    };

    const toggleSelectAll = (groupLabel, fields) => {
        const allSelected = fields.every(({ key }) => selectedFields[key]);
        const updated = { ...selectedFields };
        fields.forEach(({ key }) => {
            updated[key] = !allSelected;
        });
        setSelectedFields(updated);
    };

    return (
        <div className="fixed inset-0 bg-gray-800 opacity-90 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
                <div className='text-center'>
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Export CSV</h2>
                    <p className="text-sm text-gray-600 mb-4">Select the fields you want to include:</p>
                </div>

                {Object.entries(FIELD_GROUPS).map(([groupLabel, fields]) => {
                    const isCollapsed = collapsedGroups[groupLabel];
                    const allSelected = fields.every(({ key }) => selectedFields[key]);

                    return (
                        <div key={groupLabel} className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-700 border-b pb-1 flex-1">{groupLabel}</p>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="text-sm text-blue-600 "
                                        onClick={() => toggleSelectAll(groupLabel, fields)}
                                    >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button onClick={() => toggleGroupCollapse(groupLabel)} className="text-gray-600">
                                        {isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
                                            {fields.map(({ label, key }) => (
                                                <label key={key} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-blue-600"
                                                        checked={!!selectedFields[key]}
                                                        onChange={() => toggleField(key)}
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportRegisteredMemberDetails;

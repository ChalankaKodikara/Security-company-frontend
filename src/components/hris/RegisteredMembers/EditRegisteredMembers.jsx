import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Avatar from '../../assets/Avatar.png';
import { FiUserCheck } from "react-icons/fi";
import { IoBagOutline } from "react-icons/io5";
import { LuUser } from "react-icons/lu";
import { GoLink } from "react-icons/go";

const EditRegisteredMembers = () => {
    const { state } = useLocation();
    const member = state?.member || {
        name: "Violet Mendoza",
        email: "sandaru@gmail.com",
        role: "Manager",
        contact: "0703405699",
        status: "Active",
    };

    const isActive = member.status === "Active";
    const [activeTab, setActiveTab] = useState("personal");

    const tabs = [
        { key: 'personal', label: 'Personal' },
        { key: 'official', label: 'Official' },
        { key: 'nextOfKin', label: 'Next of Kin' },
        { key: 'bankDocs', label: 'Bank & Documents' },
    ];

    const inputStyle = "p-2 rounded-md border border-gray-300 bg-gray-100 text-sm w-full";
    const labelStyle = "text-sm text-gray-600 mb-1 block";

    const renderForm = () => {
        switch (activeTab) {
            case "personal":
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Membership Number</label>
                                <input className={inputStyle} value="11077-5" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Member Full Name</label>
                                <input className={inputStyle} value={member.name} disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Member Name with Initial</label>
                                <input className={inputStyle} value="V Mendoza" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Member Name in Usage</label>
                                <input className={inputStyle} value="Violet" disabled />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Private Address</label>
                                <input className={inputStyle} value="NO. 45, Temple Road, Colombo 00100, Sri Lanka" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Date of Birth</label>
                                <input className={inputStyle} value="1998.05.12" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>NIC No</label>
                                <input className={inputStyle} value="214235346546" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Marital Status</label>
                                <input className={inputStyle} value="Single" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Gender</label>
                                <input className={inputStyle} value="Female" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Private Telephone Number</label>
                                <input className={inputStyle} value="077 5346345" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>WhatsApp Number</label>
                                <input className={inputStyle} value="077 5346345" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Mobile Number</label>
                                <input className={inputStyle} value="077 3453476" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Private Email Address</label>
                                <input className={inputStyle} value="violetmendoza12@gmail.com" disabled />
                            </div>



                        </div>

                        {/* PDF Attachments */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className={labelStyle}>Birth Certificate</label>
                                <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                                    <img src="/pdf-icon.svg" alt="PDF" className="w-6 h-6" />
                                    <div>
                                        <p className="text-sm font-medium">Birth Certificate.pdf</p>
                                        <p className="text-xs text-gray-500">94 KB</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Marriage Certificate</label>
                                <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                                    <img src="/pdf-icon.svg" alt="PDF" className="w-6 h-6" />
                                    <div>
                                        <p className="text-sm font-medium">Marriage Certificate.pdf</p>
                                        <p className="text-xs text-gray-500">94 KB</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-md mt-4 text-sm"
                                onClick={() => handleUpdate('personal')}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                );

            case "official":
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelStyle}>Date of Joining Service</label><input className={inputStyle} value="2018.05.12" disabled /></div>
                            <div><label className={labelStyle}>Designation</label><input className={inputStyle} value="Manager" disabled /></div>
                            <div><label className={labelStyle}>Grade</label><input className={inputStyle} value="A" disabled /></div>
                            <div><label className={labelStyle}>E.P.F. No</label><input className={inputStyle} value="2345" disabled /></div>
                            <div><label className={labelStyle}>Name of the Bank</label><input className={inputStyle} value="CBEU" disabled /></div>
                            <div><label className={labelStyle}>Name of the Present Branch/Dept/Div</label><input className={inputStyle} value="Homagama" disabled /></div>
                            <div><label className={labelStyle}>Branch Code No</label><input className={inputStyle} value="1234" disabled /></div>
                            <div><label className={labelStyle}>CBEU Hierarchy Category</label><input className={inputStyle} value="xxxx" disabled /></div>
                            <div><label className={labelStyle}>Official Telephone No</label><input className={inputStyle} value="077 5346345" disabled /></div>
                            <div><label className={labelStyle}>Official Email Address</label><input className={inputStyle} value="official12@gmail.com" disabled /></div>
                            <div><label className={labelStyle}>Name on Privilege Card</label><input className={inputStyle} value="xxxxx" disabled /></div>
                            <div><label className={labelStyle}>Membership Status</label><input className={inputStyle} value="New" disabled /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className={labelStyle}>Membership Document</label>
                                <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                                    <img src="/pdf-icon.svg" alt="PDF" className="w-6 h-6" />
                                    <div>
                                        <p className="text-sm font-medium">Membercertificate.pdf</p>
                                        <p className="text-xs text-gray-500">94 KB</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Note</label>
                                <textarea className={`${inputStyle} h-24`} value="Vorem ipsum dolor sit amet, consectetur adipiscing elit." disabled />
                            </div>



                        </div>

                        <div className="flex justify-end">
                            <button
                                className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-md mt-4 text-sm"
                                onClick={() => handleUpdate('official')}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                );

            case "nextOfKin":
                return (
                    <div className="space-y-10">
                        {[1, 2].map((_, i) => (
                            <div key={i} className="space-y-4 border-b pb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyle}>Relationship</label>
                                        <input className={inputStyle} value="Husband" disabled />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Name</label>
                                        <input className={inputStyle} value="Alfonso Torff" disabled />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelStyle}>Private Address</label>
                                        <input className={inputStyle} value="NO. 45, Temple Road, Colombo 00100, Sri Lanka" disabled />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>NIC</label>
                                        <input className={inputStyle} value="123342345" disabled />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Date of Birth</label>
                                        <input className={inputStyle} value="2017.05.10" disabled />
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <label className={labelStyle}>Next of Kin Birth Certificates</label>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50 w-fit">
                                        <img src="/pdf-icon.svg" alt="PDF" className="w-6 h-6" />
                                        <div>
                                            <p className="text-sm font-medium">Birth-certificate.pdf</p>
                                            <p className="text-xs text-gray-500">94 KB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/*  Single Update Button Below All Entries */}
                        <div className="flex justify-end">
                            <button
                                className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-md mt-4 text-sm"
                                onClick={() => handleUpdate('nextOfKin')}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                );

            case "bankDocs":
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyle}>Account Number</label>
                                <input className={inputStyle} value="232145436" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Account Name</label>
                                <input className={inputStyle} value="V Mendoza" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Bank Name</label>
                                <input className={inputStyle} value="BOC" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Bank Code</label>
                                <input className={inputStyle} value="23434534" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Branch Name</label>
                                <input className={inputStyle} value="Homagama" disabled />
                            </div>
                            <div>
                                <label className={labelStyle}>Branch Code</label>
                                <input className={inputStyle} value="4334" disabled />
                            </div>
                        </div>

                        <div>
                            <label className={labelStyle}>Bank Document</label>
                            <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50 w-fit">
                                <img src="/pdf-icon.svg" alt="PDF" className="w-6 h-6" />
                                <div>
                                    <p className="text-sm font-medium">Bank Document.pdf</p>
                                    <p className="text-xs text-gray-500">94 KB</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-md mt-4 text-sm"
                                onClick={() => handleUpdate('bankDocs')}
                            >
                                Update
                            </button>
                        </div>

                    </div>
                );


            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}

        >
            <h1 className="text-2xl text-gray-400 mb-4">
                Registered Member List <span className="text-gray-700">/  Edit Member Profile</span>
            </h1>

            <div className="flex items-start gap-6">
                {/* LEFT CARD */}
                <div className="bg-white p-6 rounded-lg shadow-md w-[300px]">
                    <div className="flex flex-col items-center">
                        <div className="bg-red-500 pt-2 rounded-md mb-3">
                            <img src={Avatar} alt="Avatar" className="w-24 h-24 object-cover rounded-md" />
                        </div>
                        <p className="text-xl font-semibold text-gray-800">{member.name}</p>
                        <span className="bg-green-200 p-2 text-green-500 text-[13px] font-semibold rounded-md mt-1">Active</span>
                        <hr className="w-full my-4 border-gray-200" />
                        <p className="text-[13px] font-light text-gray-400 w-full text-left my-2">DETAILS</p>
                        <div className="text-left w-full text-[15px] text-gray-600 space-y-2">
                            <p><strong>Email:</strong> {member.email}</p>
                            <p><strong>Role:</strong> {member.role}</p>
                            <p><strong>Contact:</strong> {member.contact}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4 w-full">
                            <span className="text-sm text-gray-500">Member Inactive/Active</span>
                            <label className="inline-flex relative items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked={isActive} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:left-[4px] after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 ">
                    {/* TABS */}
                    <div className="flex gap-3 justify-start mb-4">

                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-md font-medium ${activeTab === tab.key ? 'bg-[#DC2626] text-white' : 'text-gray-400'
                                    }`}
                            >
                                {tab.key === 'personal' && <FiUserCheck className="text-base" />}
                                {tab.key === 'official' && <IoBagOutline className="text-base" />}
                                {tab.key === 'nextOfKin' && <LuUser className="text-base" />}
                                {tab.key === 'bankDocs' && <GoLink className="text-base" />}
                                {tab.label} {tab.count ? `(${tab.count})` : ""}
                            </button>
                        ))}

                    </div>

                    {/* FORM CONTENT */}
                    {renderForm()}


                </div>
            </div>
        </motion.div>
    );
};

export default EditRegisteredMembers;

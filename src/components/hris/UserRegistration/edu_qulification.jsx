import React, { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const EduQualification = () => {
    const [educationalQualifications, setEducationalQualifications] = useState([
        { degree: '', institution: '', year: '', grade: '' },
    ]);

    const handleAddEducation = () => {
        setEducationalQualifications([
            ...educationalQualifications,
            { degree: '', institution: '', year: '', grade: '' },
        ]);
    };

    const handleRemoveEducation = (index) => {
        setEducationalQualifications(
            educationalQualifications.filter((_, i) => i !== index)
        );
    };

    const handleEducationChange = (index, event) => {
        const { name, value } = event.target;
        const updatedQualifications = educationalQualifications.map((qualification, i) =>
            i === index ? { ...qualification, [name]: value } : qualification
        );
        setEducationalQualifications(updatedQualifications);
    };

    return (
        <div>
            {educationalQualifications.map((_, index) => (
                <React.Fragment key={index}>
                    <h1 className="text-[30px] font-bold col-span-3 mt-8">
                        Educational Qualification {index + 1}
                    </h1>
                    <div className="grid grid-cols-1 gap-y-[30px] text-[20px] relative">
                        {index > 0 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveEducation(index)}
                                className="absolute top-0 right-0 mt-2 mr-2 text-red-500"
                            >
                                <AiOutlineClose size={24} />
                            </button>
                        )}
                        <div>
                            <label className="block text-gray-700">Degree/Qualification</label>
                            <input
                                type="text"
                                name="degree"
                                onChange={(e) => handleEducationChange(index, e)}
                                className="w-full border border-gray-300 p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Institution</label>
                            <input
                                type="text"
                                name="institution"
                                onChange={(e) => handleEducationChange(index, e)}
                                className="w-full border border-gray-300 p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Year of Completion</label>
                            <input
                                type="number"
                                name="year"
                                onChange={(e) => handleEducationChange(index, e)}
                                className="w-full border border-gray-300 p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Grade/Score</label>
                            <input
                                type="text"
                                name="grade"
                                onChange={(e) => handleEducationChange(index, e)}
                                className="w-full border border-gray-300 p-2 rounded"
                            />
                        </div>
                    </div>
                </React.Fragment>
            ))}

            {educationalQualifications.length < 5 && (
                <div className="mt-8">
                    <button
                        type="button"
                        onClick={handleAddEducation}
                        className="p-3 border border-[#8764A0] rounded-[25px] text-[#8764A0]"
                    >
                        <div className="flex gap-2 items-center">
                            <div>Add Another Education</div>
                        </div>
                    </button>
                </div>
            )}
          <div className='mt-2 flex justify-end'>
          <button className='bg-blue-600 p-2 text-white rounded-lg'>Save & Next</button>
          </div>
        </div>
    );
};

export default EduQualification;

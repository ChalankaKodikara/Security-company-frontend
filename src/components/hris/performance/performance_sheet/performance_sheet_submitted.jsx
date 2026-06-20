import React from 'react'
import { TbPointFilled } from "react-icons/tb";

const performance_sheet_submitted = () => {
    return (
        <div className='mx-10 mt-5'>
            <div className="grid grid-cols-5 grid-rows-6 gap-4">
                <div className="row-span-6 shadow-md rounded-md">
                    <div className='flex itemns-center gap-4'>
                        <TbPointFilled />
                        <div><p className='font-semibold'>2025 January</p></div>
                        <div>Submitted Date : 2025.01.04</div>
                    </div>
                </div>
                <div className="row-span-3 col-span-4">2</div>
                <div className="col-span-4 row-span-3 col-start-2 row-start-4">3</div>
            </div>

        </div>
    )
}

export default performance_sheet_submitted;
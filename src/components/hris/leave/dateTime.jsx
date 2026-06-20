import React from 'react';
import moment from 'moment';

const DateTime = () => {
  const currentDate = moment().format('dddd, MMMM Do YYYY');
  return (
    <div className="text-center p-4">
      {currentDate}
    </div>
  );
};

export default DateTime;

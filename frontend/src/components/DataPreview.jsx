import React from 'react';

const DataPreview = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No data available
      </div>
    );
  }

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format number to Indian number system
  const formatNumber = (number) => {
    try {
      if (!number) return '';
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: 'currency',
        currency: 'INR'
      }).format(number);
    } catch (error) {
      return number;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Object.keys(data[0]).map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {Object.entries(row).map(([key, value]) => (
                <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {key === 'date' ? formatDate(value) :
                   key === 'amount' ? formatNumber(value) :
                   key === 'verified' ? (value ? 'Yes' : 'No') :
                   String(value || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataPreview; 
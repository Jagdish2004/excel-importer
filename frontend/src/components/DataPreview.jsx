import React, { useState } from 'react';

const DataPreview = ({ data, sheetNames, onDeleteRow }) => {
  const [currentSheet, setCurrentSheet] = useState(sheetNames[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    try {
      // Handle the date format from your Excel (02-15-25)
      const [month, day, year] = dateString.split('-');
      const fullYear = `20${year}`; // Assuming 20xx year format
      const date = new Date(fullYear, month - 1, day);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  // Format number to Indian number system
  const formatNumber = (number) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: 'currency',
        currency: 'INR'
      }).format(number);
    } catch (error) {
      return number; // Return original if formatting fails
    }
  };

  // Ensure data is an array and not empty
  const tableData = Array.isArray(data) ? data : [];
  
  // Calculate pagination
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = tableData.slice(startIndex, endIndex);

  // Handle delete confirmation
  const handleDeleteConfirm = (rowIndex) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      onDeleteRow(currentSheet, startIndex + rowIndex);
    }
  };

  if (!tableData.length) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
      {/* Data table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(tableData[0]).map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.entries(row).map(([key, value]) => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {key === 'Date' ? formatDate(value) :
                     key === 'Amount' ? formatNumber(value) :
                     key === 'Verified' ? (value ? 'Yes' : 'No') :
                     value.toString()}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteConfirm(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, tableData.length)}</span> of{' '}
                <span className="font-medium">{tableData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                      ${currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }
                      ${i === 0 ? 'rounded-l-md' : ''}
                      ${i === totalPages - 1 ? 'rounded-r-md' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreview; 
import React, { useState } from 'react';

const DataPreview = ({ data = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5; // Number of rows per page

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No data available
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const currentData = data.slice(startIndex, endIndex);

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      // If it's already in DD/MM/YYYY format, just replace / with -
      if (typeof dateString === 'string' && dateString.includes('/')) {
        return dateString.replace(/\//g, '-');
      }
      // Otherwise, create a new date and format it
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch (error) {
      return dateString;
    }
  };

  // Format number to Indian currency
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

  // Filter out internal fields from headers but keep errors
  const headers = Object.keys(data[0]).filter(key => 
    !['isValid', 'dateObj', 'rowNumber'].includes(key)
  );

  return (
    <div>
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Row
              </th>
              {['name', 'date', 'amount', 'verified'].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header.charAt(0).toUpperCase() + header.slice(1)}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, index) => (
              <tr key={index} className={`hover:bg-gray-50 ${row.errors?.length ? 'bg-red-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.rowNumber || startIndex + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {String(row.name || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(row.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(row.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${row.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {row.verified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${row.errors?.length ? 'text-red-600' : 'text-green-600'}`}>
                  {row.errors?.length ? (
                    <div>
                      <span className="font-medium">Invalid:</span>
                      <ul className="list-disc list-inside mt-1">
                        {row.errors.map((error, i) => (
                          <li key={i} className="text-xs">{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Valid
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{endIndex}</span> of{' '}
              <span className="font-medium">{data.length}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold
                    ${currentPage === i + 1
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
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
    </div>
  );
};

export default DataPreview; 
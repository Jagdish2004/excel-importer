import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { previewFile, importValidatedData, deleteRow } from '../api/fileService';
import DataPreview from './DataPreview';

const FileImport = () => {
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [currentSheet, setCurrentSheet] = useState(null);

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setIsPreviewing(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('Previewing file:', selectedFile.name);
      const response = await previewFile(formData);
      console.log('Preview response:', response);
      
      if (response.validationResults && response.validationResults.length > 0) {
        setValidationResults(response.validationResults);
        setCurrentSheet(response.validationResults[0].sheetName);
      } else {
        setError('No valid data found in the file or all rows have errors');
      }
      
    } catch (err) {
      console.error('Preview error:', err);
      setError(err.message || 'Failed to preview file');
      setValidationResults(null);
      setCurrentSheet(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!currentSheet) return;
    
    try {
      setIsUploading(true);
      const response = await importValidatedData(currentSheet);
      console.log('Import response:', response);
      
      // Show success message
      alert(`Successfully imported ${response.importedCount} rows. Skipped ${response.skippedCount} invalid rows.`);
      
      // Clear the preview data for the imported sheet
      setValidationResults(prev => prev.filter(sheet => sheet.sheetName !== currentSheet));
      if (validationResults.length > 1) {
        setCurrentSheet(validationResults[0].sheetName);
      } else {
        setCurrentSheet(null);
      }
      
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import data');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    setValidationResults(null);
    setCurrentSheet(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File size must be less than 2MB');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Only .xlsx files are allowed');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false
  });

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteRow = async (row) => {
    try {
      console.log('Deleting row:', row);
      const response = await deleteRow(currentSheet, row.rowNumber);
      
      if (response.validationResults) {
        setValidationResults(response.validationResults);
      } else {
        // Fallback to optimistic update
        setValidationResults(prev => 
          prev.map(sheet => {
            if (sheet.sheetName === currentSheet) {
              return {
                ...sheet,
                validRows: sheet.validRows.filter(r => r.rowNumber !== row.rowNumber),
                invalidRows: sheet.invalidRows.filter(r => r.rowNumber !== row.rowNumber)
              };
            }
            return sheet;
          })
        );
      }
    } catch (error) {
      setError('Failed to delete row: ' + error.message);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left side - Drag & Drop */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              hover:border-blue-500 hover:bg-blue-50 transition-colors
              min-h-[300px] lg:min-h-[400px] flex flex-col justify-center`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <div className="space-y-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-gray-600">
                <p className="text-xl font-medium mb-2">
                  {isDragActive ? 'Drop the file here' : 'Drag and drop your Excel file here'}
                </p>
                <p className="text-sm text-gray-500">
                  Drop your Excel file here or click to browse
                </p>
              </div>
            </div>
          </div>

          {/* Right side - File Selection */}
          <div className="flex flex-col justify-center space-y-6 lg:space-y-8 p-4 lg:p-6">
            <div className="text-center">
              <h3 className="text-2xl font-medium text-gray-900 mb-6">
                Or select file from your computer
              </h3>
              <button
                onClick={handleBrowseClick}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Browse Files
              </button>
            </div>

            {selectedFile && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Selected File</h4>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Name:</span> {selectedFile.name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Size:</span> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Type:</span> Excel Spreadsheet
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handlePreview}
                    disabled={isPreviewing}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isPreviewing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Previewing...
                      </>
                    ) : (
                      'Preview Data'
                    )}
                  </button>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center space-x-3">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-blue-700">Uploading file...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 lg:mt-8 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mt-6 lg:mt-8 text-center text-sm text-gray-500 border-t pt-6">
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <p className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
              </svg>
              Supported file type: .xlsx
            </p>
            <p className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Maximum file size: 2MB
            </p>
          </div>
        </div>

        {/* Preview and Validation Results */}
        {validationResults && currentSheet && validationResults.map(sheet => 
          sheet.sheetName === currentSheet && (
            <div key={sheet.sheetName} className="mt-8 bg-white rounded-lg shadow-lg p-6">
              {/* Sheet Selection */}
              <div className="mb-6">
                <label htmlFor="sheet-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Sheet
                </label>
                <select
                  id="sheet-select"
                  value={currentSheet}
                  onChange={(e) => setCurrentSheet(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {validationResults.map((s) => (
                    <option key={s.sheetName} value={s.sheetName}>
                      {s.sheetName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sheet Errors */}
              {sheet.errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-red-800 font-medium mb-2">Sheet Errors:</h3>
                  <ul className="list-disc list-inside text-red-700">
                    {sheet.errors.map((error, index) => (
                      <li key={index}>{error.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valid Rows */}
              {sheet.validRows && sheet.validRows.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Valid Rows ({sheet.validRows.length})
                  </h3>
                  <DataPreview 
                    data={sheet.validRows} 
                    onDeleteRow={handleDeleteRow}
                  />
                </div>
              )}

              {/* Invalid Rows */}
              {sheet.invalidRows && sheet.invalidRows.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-red-600 mb-4">
                    Invalid Rows ({sheet.invalidRows.length})
                  </h3>
                  <DataPreview 
                    data={sheet.invalidRows} 
                    onDeleteRow={handleDeleteRow}
                  />
                </div>
              )}

              {/* Import Button */}
              {sheet.validRows && sheet.validRows.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleImport}
                    disabled={isUploading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isUploading ? 'Importing...' : 'Import Valid Rows'}
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FileImport; 
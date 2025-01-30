import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../api/fileService';
import DataPreview from './DataPreview';

const FileImport = () => {
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);

  const handleFileUpload = async (file) => {
    try {
      setIsUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', file.name);
      const response = await uploadFile(formData);
      console.log('Upload response:', response);
      
      // Check for required properties with more detailed error messages
      if (!response.data) {
        throw new Error('Response is missing data property');
      }
      if (!Array.isArray(response.data)) {
        throw new Error('Response data is not an array');
      }
      if (!response.sheets || !Array.isArray(response.sheets)) {
        throw new Error('Response is missing sheets array');
      }
      
      setPreviewData(response.data);
      setSheetNames(response.sheets);
      
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to upload file');
      setPreviewData(null);
      setSheetNames([]);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    setSelectedFile(null);

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
      handleFileUpload(file);
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

  const handleDeleteRow = (sheetName, rowIndex) => {
    setPreviewData(prevData => ({
      ...prevData,
      [sheetName]: prevData[sheetName].filter((_, index) => index !== rowIndex)
    }));
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

        {/* Data Preview */}
        {previewData && sheetNames.length > 0 && (
          <DataPreview
            data={previewData}
            sheetNames={sheetNames}
            onDeleteRow={handleDeleteRow}
          />
        )}
      </div>
    </div>
  );
};

export default FileImport; 
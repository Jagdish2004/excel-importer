const ImportedData = require('../models/ImportedData');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');

const importController = {
  // Preview data and validate
  previewData: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Read Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheetNames = workbook.SheetNames;
      
      // Store validation results for each sheet
      const validationResults = [];

      // Process each sheet
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        
        // First get headers using sheet_to_json with header:1 option
        const headers = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
        
        const sheetErrors = [];
        const validRows = [];
        const invalidRows = [];

        if (!headers || headers.length === 0) {
          sheetErrors.push({
            row: 0,
            error: 'Sheet is empty or missing headers'
          });
          validationResults.push({
            sheetName,
            validRows: [],
            invalidRows: [],
            errors: sheetErrors
          });
          continue;
        }

        // Check for required columns
        const requiredColumns = ['Name', 'Date', 'Amount'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          sheetErrors.push({
            row: 0,
            error: `Invalid sheet format: Missing required columns - ${missingColumns.join(', ')}. Column names must be exactly "Name", "Date", and "Amount"`
          });
          validationResults.push({
            sheetName,
            validRows: [],
            invalidRows: [],
            errors: sheetErrors
          });
          continue;
        }

        // Now read the data with the validated headers
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
          sheetErrors.push({
            row: 0,
            error: 'Sheet has no data rows'
          });
          continue;
        }

        // Validate each row
        data.forEach((row, index) => {
          const rowErrors = [];
          const rowNumber = index + 2;

          const formattedRow = {
            name: row['Name']?.toString().trim() || '',
            amount: parseFloat(row['Amount']),
            date: row['Date'],
            rowNumber
          };

          // 1. Validate Name
          if (!formattedRow.name || formattedRow.name.length === 0) {
            rowErrors.push('Empty name not allowed');
          }

          // 2. Validate Amount
          if (isNaN(formattedRow.amount)) {
            rowErrors.push('Amount must be a valid number');
          } else if (formattedRow.amount <= 0) {
            rowErrors.push('Amount must be greater than zero');
          }

          // 3. Validate Date
          try {
            let jsDate;
            const dateValue = row['Date'];

            if (typeof dateValue === 'number') {
              jsDate = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
            } else if (typeof dateValue === 'string') {
              const [day, month, year] = dateValue.split('-').map(num => parseInt(num));
              jsDate = new Date(year, month - 1, day);
            }

            if (isNaN(jsDate.getTime())) {
              throw new Error('Invalid date');
            }

            const currentDate = new Date();
            if (jsDate.getMonth() !== currentDate.getMonth() || 
                jsDate.getFullYear() !== currentDate.getFullYear()) {
              rowErrors.push('Date must be in current month');
            }

            formattedRow.date = jsDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).replace(/\//g, '-');
            formattedRow.dateObj = jsDate;

          } catch (error) {
            rowErrors.push('Invalid date format - use DD-MM-YYYY');
          }

          // Add row to appropriate array
          if (rowErrors.length > 0) {
            invalidRows.push({
              ...formattedRow,
              errors: rowErrors,
              rowNumber
            });
          } else {
            validRows.push({
              ...formattedRow,
              rowNumber
            });
          }
        });

        // Add validation results
        validationResults.push({
          sheetName,
          validRows,
          invalidRows,
          errors: sheetErrors
        });
      }

      // Store results in session
      req.session.validationResults = validationResults;

      // Clean up uploaded file
      require('fs').unlinkSync(req.file.path);

      return res.status(200).json({
        message: 'File processed successfully',
        sheets: sheetNames,
        validationResults,
        hasErrors: validationResults.some(sheet => 
          sheet.errors.length > 0 || sheet.invalidRows.length > 0
        )
      });

    } catch (error) {
      if (req.file?.path) {
        require('fs').unlinkSync(req.file.path);
      }
      return res.status(500).json({
        message: 'Error processing file',
        error: error.message
      });
    }
  },

  // Import validated data to database
  importValidated: async (req, res) => {
    try {
      const { sheetName } = req.body;
      
      if (!req.session?.validationResults) {
        return res.status(400).json({
          message: 'No validated data found. Please upload and validate the file first.'
        });
      }

      const sheetData = req.session.validationResults.find(s => s.sheetName === sheetName);
      if (!sheetData) {
        return res.status(400).json({
          message: 'Sheet not found in validated data'
        });
      }

      // Format data for database
      const formattedData = sheetData.validRows.map(row => ({
        name: row.name,
        date: row.dateObj, // Use the stored Date object
        amount: row.amount
      }));

      // Save to database
      const savedData = await ImportedData.insertMany(formattedData);

      // Clear the session data for this sheet
      req.session.validationResults = req.session.validationResults
        .filter(s => s.sheetName !== sheetName);

      return res.status(200).json({
        message: 'Data imported successfully',
        importedCount: savedData.length,
        skippedCount: sheetData.invalidRows.length
      });

    } catch (error) {
      console.error('Import error:', error);
      return res.status(500).json({
        message: 'Error importing data',
        error: error.message
      });
    }
  },

  // Get imported data with pagination
  getData: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const data = await ImportedData.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ImportedData.countDocuments();

      return res.status(200).json({
        data,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get data error:', error);
      return res.status(500).json({
        message: 'Error retrieving data',
        error: error.message
      });
    }
  },

  // Delete a record
  deleteRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRecord = await ImportedData.findByIdAndDelete(id);

      if (!deletedRecord) {
        return res.status(404).json({ message: 'Record not found' });
      }

      return res.status(200).json({
        message: 'Record deleted successfully',
        data: deletedRecord
      });

    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({
        message: 'Error deleting record',
        error: error.message
      });
    }
  },

  deleteRow: async (req, res) => {
    try {
      const { sheetName, rowNumber } = req.body;
      console.log('Deleting row:', { sheetName, rowNumber });

      if (!req.session?.validationResults) {
        return res.status(400).json({
          message: 'No validation data found'
        });
      }

      const sheetIndex = req.session.validationResults.findIndex(s => s.sheetName === sheetName);
      if (sheetIndex === -1) {
        return res.status(404).json({
          message: 'Sheet not found'
        });
      }

      // Create a new copy of validation results
      const updatedValidationResults = [...req.session.validationResults];
      const sheet = { ...updatedValidationResults[sheetIndex] };

      // Check if row exists in valid or invalid rows
      const validRowIndex = sheet.validRows.findIndex(row => row.rowNumber === parseInt(rowNumber));
      const invalidRowIndex = sheet.invalidRows.findIndex(row => row.rowNumber === parseInt(rowNumber));

      // Remove from appropriate array
      if (validRowIndex !== -1) {
        sheet.validRows = sheet.validRows.filter(row => row.rowNumber !== parseInt(rowNumber));
      } else if (invalidRowIndex !== -1) {
        sheet.invalidRows = sheet.invalidRows.filter(row => row.rowNumber !== parseInt(rowNumber));
      } else {
        return res.status(404).json({
          message: 'Row not found'
        });
      }

      // Update the sheet in validation results
      updatedValidationResults[sheetIndex] = sheet;

      // Update session and ensure it's saved
      req.session.validationResults = updatedValidationResults;
      await new Promise(resolve => req.session.save(resolve));

      return res.status(200).json({
        message: 'Row deleted successfully',
        validationResults: updatedValidationResults
      });

    } catch (error) {
      console.error('Delete row error:', error);
      return res.status(500).json({
        message: 'Error deleting row',
        error: error.message
      });
    }
  }
};

module.exports = importController; 
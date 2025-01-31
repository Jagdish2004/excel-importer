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
        const data = xlsx.utils.sheet_to_json(worksheet);

        const sheetErrors = [];
        const validRows = [];
        const invalidRows = [];

        if (data.length === 0) {
          sheetErrors.push({
            row: 0,
            error: 'Sheet is empty'
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
            verified: row['Verified']?.toString().toLowerCase() === 'yes',
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
            });
            formattedRow.dateObj = jsDate;

          } catch (error) {
            rowErrors.push('Invalid date format');
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

      const response = {
        message: 'File processed successfully',
        sheets: sheetNames,
        validationResults,
        hasErrors: validationResults.some(sheet => 
          sheet.errors.length > 0 || sheet.invalidRows.length > 0
        )
      };

      return res.status(200).json(response);

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
        date: row.dateObj,
        amount: row.amount,
        verified: row.verified
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
  }
};

module.exports = importController; 
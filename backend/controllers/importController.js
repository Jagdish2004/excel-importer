const ImportedData = require('../models/ImportedData');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');

const importController = {
  // Preview data and validate
  previewData: async (req, res) => {
    try {
      console.log('Received preview request');
      
      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File received:', req.file.originalname);

      // Read Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheetNames = workbook.SheetNames;
      
      console.log('Sheets found:', sheetNames);

      // Store validation results for each sheet
      const validationResults = [];

      // Process each sheet
      for (const sheetName of sheetNames) {
        console.log(`Processing sheet: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`Found ${data.length} rows in ${sheetName}`);

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

        // Log the first row to see the structure
        console.log('First row structure:', Object.keys(data[0]));

        // Validate required columns
        const requiredColumns = ['First Name', 'Last Name', 'Amount', 'Date'];
        const columns = Object.keys(data[0]);
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));

        if (missingColumns.length > 0) {
          sheetErrors.push({
            row: 0,
            error: `Missing required columns: ${missingColumns.join(', ')}`
          });
          continue;
        }

        // Validate each row
        data.forEach((row, index) => {
          const rowErrors = [];
          const rowNumber = index + 2;

          // Format row data
          const formattedRow = {
            name: `${row['First Name']} ${row['Last Name']}`,
            gender: row['Gender'] || '',
            age: parseInt(row['Age']) || 0,
            rawDate: row['Date'], // Keep raw date for display
            amount: row['Amount'],
            verified: false,
            rowNumber
          };

          // Validate Name
          if (!row['First Name']?.trim() || !row['Last Name']?.trim()) {
            rowErrors.push('First Name and Last Name are required');
          }

          // Validate Amount
          const amount = parseFloat(row['Amount']);
          if (isNaN(amount)) {
            rowErrors.push('Amount must be a valid number');
          } else if (amount <= 0) {
            rowErrors.push('Amount must be greater than zero');
          }

          // Validate Date
          try {
            const excelDate = row['Date'];
            let jsDate;

            if (typeof excelDate === 'number') {
              jsDate = new Date(Date.UTC(1900, 0, excelDate - 1));
            } else {
              const [month, day, year] = excelDate.split('-').map(num => parseInt(num));
              jsDate = new Date(Date.UTC(2000 + year, month - 1, day));
            }

            formattedRow.date = jsDate; // Add parsed date to formatted row

            const currentDate = new Date();
            if (isNaN(jsDate.getTime())) {
              rowErrors.push('Invalid date format');
            } else if (
              jsDate.getMonth() !== currentDate.getMonth() ||
              jsDate.getFullYear() !== currentDate.getFullYear()
            ) {
              rowErrors.push('Date must be in the current month');
            }
          } catch (error) {
            rowErrors.push('Invalid date format');
          }

          // Add row to appropriate array
          if (rowErrors.length > 0) {
            invalidRows.push({
              ...formattedRow,
              errors: rowErrors
            });
          } else {
            validRows.push(formattedRow);
          }
        });

        // Add sheet results
        validationResults.push({
          sheetName,
          validRows,
          invalidRows,
          errors: sheetErrors
        });
      }

      // Store results in session
      req.session.validationResults = validationResults;
      console.log('Validation results stored in session');

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

      console.log('Sending response:', response);
      return res.status(200).json(response);

    } catch (error) {
      console.error('Preview error:', error);
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
      
      // Get validation results from session
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

      // Save valid rows to database
      const savedData = await ImportedData.insertMany(sheetData.validRows);

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
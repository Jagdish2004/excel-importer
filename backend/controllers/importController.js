const ImportedData = require('../models/ImportedData');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');

const importController = {
  // Import data from Excel file
  importData: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Read Excel file
      const workbook = xlsx.readFile(req.file.path);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(firstSheet);

      // Format and save data directly
      const documents = data.map(row => ({
        name: `${row['First Name']} ${row['Last Name']}`,
        gender: row['Gender'],
        age: parseInt(row['Age']),
        date: new Date(Date.UTC(1900, 0, row['Date'] - 1)), // Convert Excel date
        amount: parseFloat(row['Ammount']),
        verified: false
      }));

      // Save to database
      const savedData = await ImportedData.insertMany(documents);
      console.log(`Saved ${savedData.length} records to database`);

      // Clean up uploaded file
      require('fs').unlinkSync(req.file.path);

      return res.status(200).json({
        message: 'Data imported successfully',
        sheets: workbook.SheetNames,
        data: savedData,
        count: savedData.length
      });

    } catch (error) {
      console.error('Import error:', error);
      if (req.file?.path) {
        require('fs').unlinkSync(req.file.path);
      }
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
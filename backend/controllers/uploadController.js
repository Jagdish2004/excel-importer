const xlsx = require('xlsx');

const uploadController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;

    // Get data from first sheet for initial validation
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const data = xlsx.utils.sheet_to_json(firstSheet);

    // Basic validation of required columns
    const requiredColumns = ['Name', 'Amount', 'Date', 'Verified'];
    const sheetColumns = Object.keys(data[0] || {});
    
    const missingColumns = requiredColumns.filter(col => !sheetColumns.includes(col));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Return sheet names and preview data
    return res.status(200).json({
      message: 'File uploaded successfully',
      sheets: sheetNames,
      preview: data.slice(0, 5) // Send first 5 rows as preview
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Error processing file',
      error: error.message
    });
  }
};

module.exports = {
  uploadController
}; 
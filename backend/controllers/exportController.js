const xlsx = require('xlsx');
const path = require('path');

const exportController = {
  exportValidated: async (req, res) => {
    try {
      const { data } = req.body;
      
      // Create workbook
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(data);
      
      xlsx.utils.book_append_sheet(wb, ws, 'Validated Data');
      
      // Generate file name
      const fileName = `validated_data_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, '../temp', fileName);
      
      // Write file
      xlsx.writeFile(wb, filePath);
      
      // Send file
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file
        require('fs').unlinkSync(filePath);
      });
      
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        message: 'Error exporting data',
        error: error.message
      });
    }
  }
};

module.exports = exportController; 
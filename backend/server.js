require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!require('fs').existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Add this before the file upload endpoint
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;

    // Get data from first sheet for initial validation
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const data = xlsx.utils.sheet_to_json(firstSheet);

    // Basic validation of required columns based on your Excel structure
    const requiredColumns = ['First Name', 'Last Name', 'Gender', 'Age', 'Date', 'Ammount'];
    const sheetColumns = Object.keys(data[0] || {});
    const missingColumns = requiredColumns.filter(col => !sheetColumns.includes(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Format the data to match the expected structure
    const formattedData = data.map(row => ({
      Name: `${row['First Name']} ${row['Last Name']}`,
      Gender: row['Gender'],
      Age: row['Age'],
      Date: row['Date'],
      Amount: row['Ammount'],
      Verified: false // Adding a default value for Verified
    }));

    // Return sheet names and formatted data
    return res.status(200).json({
      message: 'File uploaded successfully',
      sheets: sheetNames,
      data: formattedData
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Error processing file',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
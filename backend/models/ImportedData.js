const mongoose = require('mongoose');

const importedDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add pre-save middleware for date formatting
importedDataSchema.pre('save', function(next) {
  if (this.date) {
    // Ensure date is stored as a proper Date object
    this.date = new Date(this.date);
  }
  next();
});

// Clear existing model if it exists
mongoose.models = {};

// Create new model
const ImportedData = mongoose.model('ImportedData', importedDataSchema);

module.exports = ImportedData; 
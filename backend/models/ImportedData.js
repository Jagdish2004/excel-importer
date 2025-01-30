const mongoose = require('mongoose');

const importedDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age must be positive']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(v) {
        return !isNaN(v.getTime());
      },
      message: props => `${props.value} is not a valid date!`
    }
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
  timestamps: true,
  strict: true
});

// Add pre-save middleware for additional validation
importedDataSchema.pre('save', function(next) {
  console.log('Saving document:', this.toObject());
  next();
});

const ImportedData = mongoose.model('ImportedData', importedDataSchema);

module.exports = ImportedData; 
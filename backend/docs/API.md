# Excel Data Importer API Documentation

## Endpoints

### Preview Data
`POST /api/preview`
- Upload and validate Excel file
- Returns validation results

### Import Data
`POST /api/import`
- Import validated data to database
- Requires validated session data

### Get Data
`GET /api/data`
- Get imported data with pagination
- Query params: page, limit

### Export Data
`POST /api/export`
- Export validated data to Excel
- Returns downloadable file

## Error Codes
- 400: Bad Request (invalid input)
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Data Validation Rules
1. Name: Cannot be empty
2. Amount: Must be positive number
3. Date: Must be in current month 
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const uploadFile = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file');
    }

    const result = await response.json();
    console.log('Import response:', result);
    return result;
  } catch (error) {
    console.error('Import service error:', error);
    throw error;
  }
};

export const getImportedData = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch data error:', error);
    throw error;
  }
};

export const deleteRecord = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete record');
    }
    return await response.json();
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}; 
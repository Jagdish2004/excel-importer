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

export const previewFile = async (formData, onProgress) => {
  try {
    const xhr = new XMLHttpRequest();
    
    const promise = new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress?.(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject(new Error(xhr.statusText));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
    });

    xhr.open('POST', `${API_BASE_URL}/api/preview`);
    xhr.withCredentials = true;
    xhr.send(formData);

    return promise;
  } catch (error) {
    console.error('Preview error:', error);
    throw error;
  }
};

export const importValidatedData = async (sheetName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sheetName }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import data');
    }

    return await response.json();
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
};

export const deleteRow = async (sheetName, rowNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/preview/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sheetName, rowNumber }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete row');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete row error:', error);
    throw error;
  }
}; 
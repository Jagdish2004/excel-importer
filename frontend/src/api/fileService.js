const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const uploadFile = async (formData) => {
  try {
    console.log('Uploading to:', `${API_BASE_URL}/api/upload`);
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file');
    }

    const result = await response.json();
    console.log('Upload response:', result);
    return result;
  } catch (error) {
    console.error('Upload service error:', error);
    throw error;
  }
}; 
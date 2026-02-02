// src/components/services/Api.js
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Submit Lab Report
 * @param {string} reportType - 'lab_pb' atau tipe lain
 * @param {object} data - Data form yang akan dikirim
 */
export const submitLabReport = async (reportType, data) => {
  try {
    // Pastikan reportType adalah 'lab_pb'
    if (reportType !== 'lab_pb') {
      throw new Error('Tipe laporan tidak didukung');
    }

    const response = await fetch(`${API_BASE_URL}/lab-pb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal mengirim laporan');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error submitting lab report:', error);
    throw error;
  }
};

/**
 * Get List of Lab PB Documents
 */
export const getLabPbDocuments = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams 
      ? `${API_BASE_URL}/lab-pb-documents?${queryParams}` 
      : `${API_BASE_URL}/lab-pb-documents`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Gagal mengambil daftar dokumen');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    throw error;
  }
};

/**
 * Get Lab PB Document Detail
 */
export const getLabPbDetail = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Dokumen tidak ditemukan');
      }
      throw new Error('Gagal mengambil detail dokumen');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching document detail:', error);
    throw error;
  }
};

/**
 * Update Lab PB Document
 */
export const updateLabPb = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal memperbarui laporan');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error updating lab report:', error);
    throw error;
  }
};

/**
 * Delete Lab PB Document
 */
export const deleteLabPb = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/lab-pb-documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal menghapus dokumen');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    throw error;
  }
};

/**
 * Health Check
 */
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};
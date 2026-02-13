const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const BASE_URL = `${API_BASE}/flakes-documents`;

// Helper function untuk get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const fetchFlakesById = async (id) => {
  try {
    return await apiRequest(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error('Fetch flakes error:', error);
    throw new Error("Gagal memuat data");
  }
};

export const createFlakes = async (payload) => {
  try {
    return await apiRequest(BASE_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Create flakes error:', error);
    throw new Error(error.message || "Gagal menyimpan");
  }
};

export const updateFlakes = async (id, payload) => {
  try {
    return await apiRequest(`${BASE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Update flakes error:', error);
    throw new Error(error.message || "Gagal update");
  }
};
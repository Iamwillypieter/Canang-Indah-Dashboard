const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server Error: ${response.status}`);
  }
  return await response.json();
};

// POST
export const submitLabReport = async (reportType, data) => {
  const endpoint = reportType === 'lab_pb' ? '/lab-pb' : `/${reportType}`;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// GET
export const getLabPbDocuments = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/lab-pb-documents${queryParams ? `?${queryParams}` : ''}`;
  
  const response = await fetch(url, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

// GET
export const getLabReportById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

// PUT
export const updateLabReport = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// DELETE
export const deleteLabPb = async (id) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb-documents/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Health Check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: getHeaders() 
  });
  return handleResponse(response);
};
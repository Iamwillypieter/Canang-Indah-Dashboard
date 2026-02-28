const API_BASE = import.meta.env.VITE_API_URL + "/api";

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
    // 👇 Forward error detail dari backend untuk debug
    throw new Error(errorData.error || errorData.message || `Server Error: ${response.status}`);
  }
  return await response.json();
};

// ✅ POST: Submit Lab Report (support tag_name)
export const submitLabReport = async (reportType, data) => {
  const endpoint = reportType === 'lab_pb' ? '/lab-pb' : `/${reportType}`;
  
  // 👇 LOG payload untuk debug (opsional, bisa di-comment kalau sudah stabil)
  if (reportType === 'lab_pb') {
    console.log('📦 Lab PB Payload:', {
      tag_name: data.tag_name,
      board_no: data.board_no,
      shift_group: data.shift_group,
      timestamp: data.timestamp
    });
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),  // 👈 data sudah include tag_name dari LabPBForm
  });
  return handleResponse(response);
};

// ✅ GET: Get Lab PB Documents List (support tag_name in response)
export const getLabPbDocuments = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/lab-pb-documents${queryParams ? `?${queryParams}` : ''}`;
  
  const response = await fetch(url, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

// ✅ GET: Get Lab Report by ID (support tag_name in response)
export const getLabReportById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

// ✅ PUT: Update Lab Report (support tag_name)
export const updateLabReport = async (id, data) => {
  console.log('📦 Lab PB Update Payload:', {
    id,
    tag_name: data.tag_name
  });
  
  const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),  // 👈 data sudah include tag_name
  });
  return handleResponse(response);
};

// ✅ DELETE: Delete Lab PB Document
export const deleteLabPb = async (id) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb-documents/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// ✅ Health Check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: getHeaders() 
  });
  return handleResponse(response);
};
const API_BASE_URL = 'http://localhost:3001/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server Error: ${response.status}`);
  }
  return await response.json();
};


 // POST: Simpan Laporan Lab PB Baru

export const submitLabReport = async (reportType, data) => {
  // Sementara kita kunci ke endpoint lab-pb bray
  const endpoint = reportType === 'lab_pb' ? '/lab-pb' : `/${reportType}`;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};


 // GET: Ambil daftar dokumen untuk DokumenList.jsx

export const getLabPbDocuments = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/lab-pb-documents${queryParams ? `?${queryParams}` : ''}`;
  
  const response = await fetch(url);
  return handleResponse(response);
};


 //GET: Ambil detail 1 dokumen berdasarkan ID (Untuk View & Edit)
 
export const getLabReportById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`);
  return handleResponse(response);
};


//  PUT: Update data lama di database (Proses Simpan saat Edit)
 
export const updateLabReport = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};


//  DELETE: Hapus dokumen dari database
 
export const deleteLabPb = async (id) => {
  const response = await fetch(`${API_BASE_URL}/lab-pb-documents/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};


// Health Check: Cek  backend nyala atau mati
 
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
};
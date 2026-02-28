const API_BASE = import.meta.env.VITE_API_URL + "/api";
const BASE_URL = `${API_BASE}/flakes-documents`;

// Helper function untuk get auth token
const getAuthToken = () => localStorage.getItem('token');

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

  try {
    const response = await fetch(url, config);
    
    // 👇 Baca response body dulu (untuk error handling)
    const responseText = await response.text();
    let data = {};
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      // Kalau response bukan JSON, simpan sebagai raw text
      data = { raw: responseText };
    }

    if (!response.ok) {
      // 👇 LOG DETAIL ERROR KE CONSOLE (PENTING UNTUK DEBUG!)
      console.error('❌ API Error Details:', {
        url,
        method: options.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        responseBody: data,
        // 👇 Jika backend kirim error code PostgreSQL, ini bakal muncul
        errorCode: data.code || data.errorCode,
        errorDetail: data.detail || data.errorDetail
      });
      
      // 👇 FORWARD ERROR MESSAGE YANG SPESIFIK DARI BACKEND
      const errorMsg = data.error || data.message || data.raw || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    
    return data;
    
  } catch (err) {
    // 👇 Kalau network error (bukan HTTP error)
    console.error('💥 Network/Fetch Error:', {
      url,
      message: err.message,
      name: err.name
    });
    throw err;
  }
};

export const fetchFlakesById = async (id) => {
  try {
    return await apiRequest(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error('Fetch flakes error:', error);
    throw new Error(error.message || "Gagal memuat data");
  }
};

export const createFlakes = async (payload) => {
  try {
    // 👇 LOG PAYLOAD YANG DIKIRIM (untuk debug)
    console.log('📦 Flakes Create Payload:', {
      tag_name: payload.tag_name,
      tanggal: payload.header?.tanggal,
      shift: payload.header?.shift,
      detail_count: payload.detail?.length,
      total_jumlah: payload.total_jumlah
    });

    return await apiRequest(BASE_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('💥 Create flakes error:', error);
    // 👇 Re-throw dengan message yang sudah diperkaya
    throw new Error(error.message || "Gagal menyimpan Flakes document");
  }
};

export const updateFlakes = async (id, payload) => {
  try {
    console.log('📦 Flakes Update Payload:', {
      id,
      tag_name: payload.tag_name
    });
    
    return await apiRequest(`${BASE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('💥 Update flakes error:', error);
    throw new Error(error.message || "Gagal update Flakes document");
  }
};
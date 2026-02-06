const BASE_URL = "http://localhost:3001/api/flakes-documents";

export const fetchFlakesById = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Gagal memuat data");
  return res.json();
};

export const createFlakes = async (payload) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
  return data;
};

export const updateFlakes = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal update");
  return data;
};

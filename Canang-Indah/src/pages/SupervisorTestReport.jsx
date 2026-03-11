import { useEffect, useState } from "react";
import "./SupervisorTestReport.css";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

const TEST_TYPES = [
  { label: "Internal Bonding", value: "internal-bonding" },
  { label: "Bending Strength", value: "bending" },
  { label: "Density Profile", value: "density" },
  { label: "MC Board", value: "mc" },
  { label: "Surface Soundness", value: "surface" }
];

export default function SupervisorTestReport(){

  const [selectedTest, setSelectedTest] = useState("internal-bonding");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [shift, setShift] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchResults = async () => {

    setLoading(true);

    try{

      const token = localStorage.getItem("token");

      const params = new URLSearchParams();

      params.append("type", selectedTest);

      if(search) params.append("search", search);
      if(shift) params.append("shift", shift);
      if(fromDate) params.append("from", fromDate);
      if(toDate) params.append("to", toDate);

      const res = await fetch(
        `${API_BASE}/lab-pb-test?${params.toString()}`,
        {
          headers:{
            "Content-Type":"application/json",
            ...(token && { Authorization:`Bearer ${token}` })
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("API ERROR:", data);
        setResults([]);
        return;
      }

      // FIX: ambil data dari response.data
      setResults(Array.isArray(data.data) ? data.data : []);

    }catch(err){

      console.error("Fetch Test Report Error:", err);

    }finally{

      setLoading(false);

    }

  };

  useEffect(()=>{
    fetchResults();
  },[selectedTest]);

  return (

    <div className="supervisor-page">

      <h1>📊 Test Analysis</h1>

      <p>
        Supervisor dapat melihat hasil test seluruh produksi dan melakukan pencarian data.
      </p>


      <div className="filter-section">

        <div className="filter-group">
          <label>Test Type</label>
          <select
            value={selectedTest}
            onChange={(e)=>setSelectedTest(e.target.value)}
          >
            {TEST_TYPES.map((t)=>(
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>


        <div className="filter-group">
          <label>Search Board</label>
          <input
            type="text"
            placeholder="Board Number..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
        </div>


        <div className="filter-group">
          <label>Shift</label>
          <select
            value={shift}
            onChange={(e)=>setShift(e.target.value)}
          >
            <option value="">All</option>
            <option value="1A">1A</option>
            <option value="1B">1B</option>
            <option value="2A">2A</option>
            <option value="2B">2B</option>
            <option value="3A">3A</option>
            <option value="3B">3B</option>
          </select>
        </div>


        <div className="filter-group">
          <label>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e)=>setFromDate(e.target.value)}
          />
        </div>


        <div className="filter-group">
          <label>To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e)=>setToDate(e.target.value)}
          />
        </div>


        <div className="search-button">
          <button onClick={fetchResults}>
            🔎 Search
          </button>
        </div>

      </div>


      <div className="result-info">
        Total Data : <b>{results.length}</b>
      </div>


      {loading ? (

        <p className="loading-text">Loading data...</p>

      ) : results.length === 0 ? (

        <p className="empty-text">Tidak ada data ditemukan</p>

      ) : (

        <table className="report-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Board No</th>
              <th>Result</th>
            </tr>
          </thead>

          <tbody>

            {results.map((row,i)=>(

              <tr key={i}>

                <td>
                  {row.timestamp
                    ? new Date(row.timestamp).toLocaleDateString("id-ID")
                    : "-"
                  }
                </td>

                <td>{row.shift_group || "-"}</td>

                <td>{row.board_no || "-"}</td>

                <td>
                  <b>{row.result ?? row.avg ?? "-"}</b>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}
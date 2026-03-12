import { useEffect, useState } from "react";
import "./SupervisorTestReport.css";

const API_BASE = import.meta.env.VITE_API_URL + "/api";

const TEST_TYPES = [
  { label: "Internal Bonding", value: "internal-bonding" },
  { label: "Bending Strength", value: "bending" },
  { label: "Screw Holding", value: "screw" },
  { label: "Density Profile", value: "density" },
  { label: "MC Board", value: "mc" },
  { label: "Thickness Swelling", value: "swelling" },
  { label: "Surface Soundness", value: "surface" }
];

export default function SupervisorTestReport(){

  const [selectedTest, setSelectedTest] = useState("internal-bonding");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchResults = async () => {

    setLoading(true);

    try{

      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      params.append("type", selectedTest);

      if(search) params.append("search", search);
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
          <label>Search</label>
          <input
            type="text"
            placeholder="Search Document / Shift..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
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

      ) : selectedTest === "internal-bonding" || selectedTest === "bending" ? (

        <div className="ib-report-wrapper">

          {results.map((row,i)=>(

            <div key={i} className="ib-report-card">

              <div className="ib-header">
                <b>{row.document_name}</b> | Shift {row.shift_group} |{" "}
                {row.timestamp
                  ? new Date(row.timestamp).toLocaleDateString("id-ID")
                  : "-"
                }
              </div>

              <table className="report-table">

                <thead>
                  <tr>
                    <th></th>

                    <th>
                      {selectedTest === "internal-bonding"
                        ? "IB [n/mm²]"
                        : "MOR [n/mm²]"}
                    </th>

                    <th>Density [kg/m³]</th>

                  </tr>
                </thead>

                <tbody>

                  {["le","ml","md","mr","ri"].map(pos => (

                    <tr key={pos}>

                      <td>{pos.toUpperCase()}</td>

                      <td>
                        {selectedTest === "internal-bonding"
                          ? row[`ib_${pos}`]
                          : row[`mor_${pos}`] ?? "-"}
                      </td>

                      <td>{row[`density_${pos}`] ?? "-"}</td>

                    </tr>

                  ))}

                  <tr className="table-row-bold">

                    <td>AVG</td>

                    <td>
                      {selectedTest === "internal-bonding"
                        ? row.avg_ib
                        : row.avg_mor}
                    </td>

                    <td>{row.avg_density ?? "-"}</td>

                  </tr>

                </tbody>

              </table>

            </div>

          ))}

        </div>

      ) : (

        <table className="report-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Document</th>
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

                <td>{row.document_name || "-"}</td>

                <td><b>{row.result ?? "-"}</b></td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}
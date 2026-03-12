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

  const POSITIONS = ["le","ml","md","mr","ri"];

  return (

    <div className="supervisor-page">

      <h1>📊 Test Analysis</h1>

      <p>
        Supervisor dapat melihat hasil test seluruh produksi dan melakukan pencarian data.
      </p>

      {/* FILTER */}
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
      ) :

      /* ================= POSITION TEST ================= */

      selectedTest === "internal-bonding" ||
      selectedTest === "bending" ||
      selectedTest === "screw" ? (

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
                        : selectedTest === "bending"
                        ? "MOR [n/mm²]"
                        : "FACE [n/mm²]"}
                    </th>

                    <th>
                      {selectedTest === "screw"
                        ? "EDGE [n/mm²]"
                        : "Density [kg/m³]"}
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {POSITIONS.map(pos => (

                    <tr key={pos}>

                      <td>{pos.toUpperCase()}</td>

                      <td>
                        {selectedTest === "internal-bonding"
                          ? row[`ib_${pos}`]
                          : selectedTest === "bending"
                          ? row[`mor_${pos}`]
                          : row[`face_${pos}`] ?? "-"}
                      </td>

                      <td>
                        {selectedTest === "screw"
                          ? row[`edge_${pos}`]
                          : row[`density_${pos}`] ?? "-"}
                      </td>

                    </tr>

                  ))}

                  <tr className="table-row-bold">

                    <td>AVG</td>

                    <td>
                      {selectedTest === "internal-bonding"
                        ? row.avg_ib
                        : selectedTest === "bending"
                        ? row.avg_mor
                        : row.avg_face ?? "-"}
                    </td>

                    <td>
                      {selectedTest === "screw"
                        ? row.avg_edge
                        : row.avg_density ?? "-"}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          ))}

        </div>

      ) :

      /* ================= DENSITY PROFILE ================= */

      selectedTest === "density" ? (

        <div className="ib-report-wrapper">

          {results.map((row,i)=>(

            <div key={i} className="ib-report-card">

              <div className="ib-header">
                <b>{row.document_name}</b> | Shift {row.shift_group}
              </div>

              <table className="report-table">

                <thead>
                  <tr>
                    <th></th>
                    <th>LE</th>
                    <th>ML</th>
                    <th>MD</th>
                    <th>MR</th>
                    <th>RI</th>
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td>MAX TOP</td>
                    <td>{row.max_top_le}</td>
                    <td>{row.max_top_ml}</td>
                    <td>{row.max_top_md}</td>
                    <td>{row.max_top_mr}</td>
                    <td>{row.max_top_ri}</td>
                  </tr>

                  <tr>
                    <td>MAX BOT</td>
                    <td>{row.max_bot_le}</td>
                    <td>{row.max_bot_ml}</td>
                    <td>{row.max_bot_md}</td>
                    <td>{row.max_bot_mr}</td>
                    <td>{row.max_bot_ri}</td>
                  </tr>

                  <tr>
                    <td>MIN</td>
                    <td>{row.min_le}</td>
                    <td>{row.min_ml}</td>
                    <td>{row.min_md}</td>
                    <td>{row.min_mr}</td>
                    <td>{row.min_ri}</td>
                  </tr>

                  <tr>
                    <td>MEAN</td>
                    <td>{row.mean_le}</td>
                    <td>{row.mean_ml}</td>
                    <td>{row.mean_md}</td>
                    <td>{row.mean_mr}</td>
                    <td>{row.mean_ri}</td>
                  </tr>

                  <tr>
                    <td>MIN / MEAN %</td>
                    <td>{row.min_mean_le}</td>
                    <td>{row.min_mean_ml}</td>
                    <td>{row.min_mean_md}</td>
                    <td>{row.min_mean_mr}</td>
                    <td>{row.min_mean_ri}</td>
                  </tr>

                </tbody>

              </table>

            </div>

          ))}

        </div>

      ) :

      /* ================= MC BOARD ================= */

      selectedTest === "mc" ? (

        <table className="report-table">

          <thead>
            <tr>
              <th></th>
              <th>W1 [gr]</th>
              <th>W2 [gr]</th>
              <th>MC [%]</th>
            </tr>
          </thead>

          <tbody>

            {results.map((row,i)=>(
              <tr key={i}>
                <td>{row.position?.toUpperCase()}</td>
                <td>{row.w1}</td>
                <td>{row.w2}</td>
                <td>{row.mc}</td>
              </tr>
            ))}

          </tbody>

        </table>

      ) :

      /* ================= SWELLING ================= */

      selectedTest === "swelling" ? (

        <table className="report-table">

          <thead>
            <tr>
              <th></th>
              <th>T1 [mm]</th>
              <th>T2 [mm]</th>
              <th>TS [%]</th>
            </tr>
          </thead>

          <tbody>

            {results.map((row,i)=>(
              <tr key={i}>
                <td>{row.position?.toUpperCase()}</td>
                <td>{row.t1}</td>
                <td>{row.t2}</td>
                <td>{row.ts}</td>
              </tr>
            ))}

          </tbody>

        </table>

      ) :

      /* ================= SURFACE ================= */

      (

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

                <td>{row.shift_group}</td>

                <td>{row.document_name}</td>

                <td>
                  <b>{row.result}</b>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}
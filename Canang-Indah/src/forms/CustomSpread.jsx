import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import { HyperFormula } from "hyperformula";
import { useNavigate } from "react-router-dom";
import Handsontable from "handsontable";

import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import "./CustomSpread.css";

const COLORS = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#fef9c3", "#dbeafe", "#f3e8ff", "#dcfce7", "#ffe4e6",
  "#6b7280", "#d97706", "#15803d", "#1d4ed8", "#7c3aed",
];

const createEmptyGrid = () =>
  Array.from({ length: 50 }, () => Array(25).fill(""));

const loadFromStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const styledTextRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  
  const style = cellProperties.customStyle;
  if (style) {
    TD.style.fontWeight = style.bold ? "bold" : "normal";
    TD.style.fontStyle = style.italic ? "italic" : "normal";
    TD.style.textDecoration = style.underline ? "underline" : "none";
    TD.style.backgroundColor = style.bgColor || "";
    TD.style.color = style.textColor || "";
    
    // Perataan Horizontal
    TD.style.textAlign = style.alignH || "left";
    // Perataan Vertikal
    TD.style.verticalAlign = style.alignV || "top";
  } else {
    TD.style.fontWeight = "normal";
    TD.style.fontStyle = "normal";
    TD.style.textDecoration = "none";
    TD.style.backgroundColor = "";
    TD.style.color = "";
    TD.style.textAlign = "left";
    TD.style.verticalAlign = "top";
  }
  return TD;
};


export default function CustomSpread() {
  
  const [documentName, setDocumentName] = useState("");
  const hotRef = useRef(null);
  const navigate = useNavigate();
  
  const hf = useMemo(() => HyperFormula.buildEmpty({ licenseKey: "gpl-v3" }), []);
  const getHot = useCallback(() => hotRef.current?.hotInstance, []);

  const dataRef = useRef(loadFromStorage("excel-data", createEmptyGrid()));
  const [cellStyles, setCellStyles] = useState(() => loadFromStorage("excel-style", {}));
  const [selectedCell, setSelectedCell] = useState(null);
  const [formulaValue, setFormulaValue] = useState("");
  const lastSelectionRef = useRef(null);

  // Fitur Merge Persisten
  const [mergedCells, setMergedCells] = useState(() => loadFromStorage("excel-merges", []));

  const saveToStorage = useCallback((currentStyles, currentMerges) => {
    const hot = getHot();
    if (!hot) return;
    try {
      localStorage.setItem("excel-data", JSON.stringify(hot.getData()));
      localStorage.setItem("excel-style", JSON.stringify(currentStyles || cellStyles));
      localStorage.setItem("excel-merges", JSON.stringify(currentMerges || mergedCells));
    } catch (e) { console.error(e); }
  }, [getHot, cellStyles, mergedCells]);

  const handleSelectionEnd = useCallback((r1, c1, r2, c2) => {
    const hot = getHot();
    if (!hot) return;
    
    const key = `${r1}-${c1}-${r2}-${c2}`;
    if (lastSelectionRef.current === key) return;
    lastSelectionRef.current = key;

    setSelectedCell({ r: r1, c: c1 });
    const value = hot.getSourceDataAtCell(r1, c1);
    setFormulaValue(value ?? "");
  }, [getHot]);

  const applyFormula = useCallback(() => {
    const hot = getHot();
    if (!hot || !selectedCell) return;
    hot.setDataAtCell(selectedCell.r, selectedCell.c, formulaValue);
  }, [selectedCell, formulaValue, getHot]);

  const applyStyleToSelection = useCallback((styleKey, value) => {
    const hot = getHot();
    const selected = hot?.getSelected();
    if (!selected) return;

    setCellStyles((prev) => {
      const next = { ...prev };
      selected.forEach(([r1, c1, r2, c2]) => {
        const minR = Math.min(r1, r2);
        const maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            next[`${r}-${c}`] = { ...(next[`${r}-${c}`] || {}), [styleKey]: value };
          }
        }
      });
      setTimeout(() => saveToStorage(next, mergedCells), 100);
      return next;
    });
    hot.render();
  }, [getHot, saveToStorage, mergedCells]);

  const toggleStyle = (styleKey) => {
    if (!selectedCell) return;
    const current = cellStyles[`${selectedCell.r}-${selectedCell.c}`]?.[styleKey];
    applyStyleToSelection(styleKey, !current);
  };

  const updateMergeState = useCallback(() => {
    const hot = getHot();
    if (!hot) return;
    const plugin = hot.getPlugin('mergeCells');
    const currentMerges = plugin.mergedCellsCollection.mergedCells;
    setMergedCells([...currentMerges]);
    saveToStorage(cellStyles, currentMerges);
  }, [getHot, cellStyles, saveToStorage]);

  const handleMergeAction = (type) => {
    const hot = getHot();
    if (!hot) return;
    const mergePlugin = hot.getPlugin('mergeCells');
    
    if (type === 'merge') {
      mergePlugin.mergeSelection();
    } else {
      mergePlugin.unmergeSelection();
    }
    hot.render();
    updateMergeState();
  };

  const cellsConfig = useCallback((row, col) => ({
    renderer: styledTextRenderer,
    customStyle: cellStyles[`${row}-${col}`]
  }), [cellStyles]);

  const currentCellStyle = useMemo(() => {
    if (!selectedCell) return {};
    return cellStyles[`${selectedCell.r}-${selectedCell.c}`] || {};
  }, [selectedCell, cellStyles]);

  return (
    <div className="excel-fullpage">
      <div className="toolbar">
        <div className="toolbar-group">
          <button onClick={() => getHot()?.alter("insert_row_below")}>+ Row</button>
          <button onClick={() => getHot()?.alter("insert_col_end")}>+ Col</button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button 
            className={`style-btn ${currentCellStyle.bold ? "active" : ""}`} 
            onMouseDown={(e) => { e.preventDefault(); toggleStyle("bold"); }}
          ><b>B</b></button>
          <button 
            className={`style-btn ${currentCellStyle.italic ? "active" : ""}`} 
            onMouseDown={(e) => { e.preventDefault(); toggleStyle("italic"); }}
          ><i>I</i></button>
          <button 
            className={`style-btn ${currentCellStyle.underline ? "active" : ""}`} 
            onMouseDown={(e) => { e.preventDefault(); toggleStyle("underline"); }}
          ><u>U</u></button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button onMouseDown={(e) => { e.preventDefault(); handleMergeAction('merge'); }}>Merge</button>
          <button onMouseDown={(e) => { e.preventDefault(); handleMergeAction('unmerge'); }}>Unmerge</button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group color-group">
          <span className="color-label">Fill</span>
          <div className="color-palette">
            {COLORS.map((c) => (
              <button key={`bg-${c}`} className="color-swatch" style={{ background: c }}
                onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("bgColor", c); }} />
            ))}
          </div>
        </div>

        <div className="toolbar-group color-group">
          <span className="color-label">Text</span>
          <div className="color-palette">
            {COLORS.map((c) => (
              <button key={`txt-${c}`} className="color-swatch" style={{ background: c, border: '1px solid #ccc' }}
                onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("textColor", c); }} />
            ))}
          </div>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group alignment-group">
          {/* Perataan Vertikal */}
          <button 
            className={`style-btn ${currentCellStyle.alignV === "top" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("alignV", "top"); }}
            title="Top Align"
          >⤓</button>
          <button 
            className={`style-btn ${currentCellStyle.alignV === "middle" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("alignV", "middle"); }}
            title="Middle Align"
          >⥄</button>
          <button 
            className={`style-btn ${currentCellStyle.alignV === "bottom" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("alignV", "bottom"); }}
            title="Bottom Align"
          >⤒</button>
          
          <div className="inner-divider" />

          {/* Perataan Horizontal */}
          <button 
            className={`style-btn ${currentCellStyle.alignH === "left" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("alignH", "left"); }}
            title="Align Left"
          >≡</button>
          <button 
            className={`style-btn ${currentCellStyle.alignH === "center" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("alignH", "center"); }}
            title="Center"
          >≟</button>
          <button 
            className={`style-btn ${currentCellStyle.alignH === "right" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); applyStyleToSelection("alignH", "right"); }}
            title="Align Right"
          >≣</button>
        </div>

        <div className="send-action">
          <input
            type="text"
            placeholder="Nama Document..."
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="document-input"
          />

          <button
            className="send-btn"
            onClick={() => {
              saveToStorage();

              const hot = getHot();
              const data = hot?.getData();

              const payload = {
                name: documentName,
                data: data,
                styles: cellStyles,
                merges: mergedCells
              };

              console.log("DATA DIKIRIM:", payload);

              // fetch("/api/documents", { method: "POST", body: JSON.stringify(payload) })

              navigate("/documents");
            }}
          >
            🚀 Send
          </button>
        </div>
      </div>

      <div className="formula-bar">
        <span className="cell-label">
          {selectedCell ? `${String.fromCharCode(65 + (selectedCell.c % 26))}${selectedCell.r + 1}` : ""}
        </span>
        <span className="formula-fx">fx</span>
        <input
          value={formulaValue}
          onChange={(e) => setFormulaValue(e.target.value)}
          onBlur={applyFormula}
          onKeyDown={(e) => e.key === "Enter" && applyFormula()}
        />
      </div>

      <div className="table-container" style={{ width: '100vw' }}>
        <HotTable
          ref={hotRef}
          data={dataRef.current}
          afterSelectionEnd={handleSelectionEnd}
          afterChange={(changes, source) => {
            if (source !== "loadData") saveToStorage();
          }}
          afterMerge={updateMergeState}
          afterUnmerge={updateMergeState}
          colHeaders={true}
          rowHeaders={true}
          width="100%"
          height="calc(100vh - 130px)"
          licenseKey="non-commercial-and-evaluation"
          formulas={{ engine: hf }}
          fillHandle={true}
          mergeCells={mergedCells} 
          undoRedo={true}
          manualColumnResize={true}
          manualRowResize={true}
          contextMenu={true}
          cells={cellsConfig}
          stretchH="none" 
          colWidths={100} 
          viewportRowRenderingOffset={20}
          autoColumnSize={true}
          outsideClickDeselects={false} 
        />
      </div>
    </div>
  );
}
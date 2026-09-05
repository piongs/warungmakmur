import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatRupiah } from "./format";

export function exportPDF({ title, period, columns, rows, filename }) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("WARUNG MAKMUR", 14, 16);
  doc.setFontSize(11);
  doc.text(title, 14, 23);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(period, 14, 29);

  autoTable(doc, {
    startY: 34,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => c.render(row))),
    headStyles: { fillColor: [194, 65, 12] },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}

export function exportExcel({ sheetName, columns, rows, filename }) {
  const data = rows.map((row) => {
    const obj = {};
    columns.forEach((c) => (obj[c.label] = c.rawExcel ? c.rawExcel(row) : c.render(row)));
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export const currencyRender = (v) => formatRupiah(v);

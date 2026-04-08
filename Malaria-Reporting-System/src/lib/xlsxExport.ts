import * as XLSX from "xlsx";

type XlsxCellValue = string | number | boolean | null | undefined;

interface ExportRowsToXlsxOptions {
  filename: string;
  sheetName: string;
  headers: string[];
  rows: XlsxCellValue[][];
}

const sanitizeSheetName = (sheetName: string) => {
  const normalized = sheetName.replace(/[\\/?*:[\]]/g, " ").trim();
  return normalized.slice(0, 31) || "Sheet1";
};

export const exportRowsToXlsx = ({
  filename,
  sheetName,
  headers,
  rows,
}: ExportRowsToXlsxOptions) => {
  const normalizedRows = rows.map((row) => row.map((value) => value ?? ""));
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...normalizedRows]);

  worksheet["!cols"] = headers.map((header, columnIndex) => {
    let maxLength = header.length;

    normalizedRows.forEach((row) => {
      const cellText = String(row[columnIndex] ?? "");
      maxLength = Math.max(maxLength, cellText.length);
    });

    return { wch: Math.min(Math.max(maxLength + 2, 10), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName));
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
};

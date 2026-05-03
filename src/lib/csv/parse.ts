/**
 * Shared CSV parsing utilities.
 * Handles quoted fields, flexible delimiters, and returns headers + typed rows.
 */
export function detectDelimiter(text: string): string {
  const commaCount = (text.match(/,/g) || []).length;
  const tabCount = (text.match(/\t/g) || []).length;
  return tabCount > commaCount ? "\t" : ",";
}

export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export function parseCSV(text: string, delimiter?: string): { headers: string[]; rows: Record<string, string>[] } {
  const delim = delimiter ?? detectDelimiter(text);
  const linesArr = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (linesArr.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(linesArr[0], delim).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < linesArr.length; i++) {
    const values = parseCSVLine(linesArr[i], delim);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

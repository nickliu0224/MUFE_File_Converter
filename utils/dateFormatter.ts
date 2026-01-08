// Function to pad numbers with leading zeros
const pad = (num: number): string => num.toString().padStart(2, '0');

// Generates the timestamp string for the filename: YYYYMMDDHHmmss
export const generateFilenameTimestamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

// Formats Excel date cell to YYYY/MM/DD
// Excel dates might be strings "2025/07/10" or serial numbers, or Date objects
export const formatOrderDate = (val: string | number | Date | undefined): string => {
  if (!val) return "";
  
  let date: Date;
  
  if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'number') {
    // Excel serial date conversion (approximate for JS)
    // SheetJS normally handles this if cellDates: true is set, but as a fallback:
    date = new Date(Math.round((val - 25569) * 86400 * 1000));
  } else {
    // String parsing
    date = new Date(val);
  }

  if (isNaN(date.getTime())) return "";

  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
};

// Formats Ship Date to YYYY/MM/DD HH:mm:ss (Specifically adds 15:00:00 based on requirement)
export const formatShipDate = (val: string | number | Date | undefined): string => {
  const baseDate = formatOrderDate(val);
  if (!baseDate) return "";
  // Based on the user requirement sample: "2025/07/10 15:00:00"
  return `${baseDate} 15:00:00`;
};

// Formats Return Date to YYYY/MM/DD HH:mm:ss (Adds 11:00:00 based on return sample)
export const formatReturnDate = (val: string | number | Date | undefined): string => {
  const baseDate = formatOrderDate(val);
  if (!baseDate) return "";
  // Based on the user requirement sample: "2025/07/10 11:00:00"
  return `${baseDate} 11:00:00`;
};

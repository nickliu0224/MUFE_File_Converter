import { ExcelRow, CsvOutputRow } from '../types';
import { formatOrderDate, formatShipDate, formatReturnDate } from '../utils/dateFormatter';

// We need to declare XLSX globally since we loaded it via CDN script
declare const XLSX: any;

// Return type includes the content string and the file prefix type
interface ConvertResult {
  csvContent: string;
  filePrefix: string;
  count: number;
}

export const parseExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to JSON, interpreting the first row as headers
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const convertToCsvData = (rows: any[]): ConvertResult => {
  const headers = [
    "Omni ERP 系統訂單編號", "SKU ID", "主單狀態", "主單編號", "來源平台", "品牌", "商品售價",
    "客戶名稱", "已出貨狀態時間", "平台名稱", "折扣後實收總價", "數量", "核帳金額", "產品名稱",
    "產品單價", "訂購日期", "退貨狀態更新時間", "銷售訂單狀態", "銷售訂單編號", "退貨申請日",
    "退貨原因", "地址", "LFL 配送代碼", "平台預計出貨日", "批次更新", "收件人", "收件人電話",
    "標籤", "準備出貨狀態時間", "物流方式", "缺貨狀態更新時間", "訂單取消狀態時間", "超取門市退貨日",
    "超取門市進貨日", "部分取消狀態時間", "郵遞區號", "配送條碼", "配送編號", "銷售訂單分配數",
    "門市代碼", "門市名稱", "預計到貨時間"
  ];

  // Detect Type based on the first row
  // Check if "訂單類別" exists and contains "退貨"
  let isReturn = false;
  if (rows.length > 0 && rows[0]["訂單類別"] && String(rows[0]["訂單類別"]).includes("退貨")) {
    isReturn = true;
  }

  // Determine Prefix based on type
  const filePrefix = isReturn ? "MUFE_MOMO_ZOHO_RTN02" : "MUFE_MOMO_ZOHO_SHPECOM";

  // Map rows
  const csvRows = rows.map((row) => {
    const orderId = row["訂單編號"] || "";
    const sku = row["商品原廠編號"] || "";
    
    let output: CsvOutputRow;

    if (isReturn) {
      // --- Return Order Logic ---
      const returnDate = formatReturnDate(row["回收送達日"]); 
      
      // Clean up Return Reason: Remove surrounding quotes if they exist in the source data
      // Example: "想要..." -> 想要...
      // We strip them here so we can cleanly re-add them in the CSV generation step without triple quoting
      let returnReason = row["退貨原因"] || "";
      if (typeof returnReason === 'string') {
        returnReason = returnReason.trim().replace(/^"|"$/g, '');
      }

      output = {
        "Omni ERP 系統訂單編號": "", // Return file leaves this empty
        "SKU ID": sku,
        "主單狀態": "", // Empty in return sample
        "主單編號": "", // Empty in return sample
        "來源平台": "", // Empty in return sample
        "品牌": "", // Empty in return sample
        "商品售價": "", // Empty in return sample
        "客戶名稱": "", // Empty in return sample
        "已出貨狀態時間": "",
        "平台名稱": "", // Empty in return sample
        "折扣後實收總價": "", // Empty in return sample
        "數量": "", // Empty in return sample
        "核帳金額": "", // Empty in return sample
        "產品名稱": "", // Empty in return sample
        "產品單價": "", // Empty in return sample
        "訂購日期": "", // Empty in return sample
        "退貨狀態更新時間": returnDate, // Column Q
        "銷售訂單狀態": "退貨結案",
        "銷售訂單編號": orderId, // Maps Order ID to Sales Order ID
        "退貨申請日": "",
        "退貨原因": returnReason,
        "地址": "",
        "LFL 配送代碼": "",
        "平台預計出貨日": "",
        "批次更新": "",
        "收件人": "",
        "收件人電話": "",
        "標籤": "",
        "準備出貨狀態時間": "",
        "物流方式": "",
        "缺貨狀態更新時間": "",
        "訂單取消狀態時間": "",
        "超取門市退貨日": "",
        "超取門市進貨日": "",
        "部分取消狀態時間": "",
        "郵遞區號": "",
        "配送條碼": "",
        "配送編號": "",
        "銷售訂單分配數": "",
        "門市代碼": "",
        "門市名稱": "",
        "預計到貨時間": ""
      };

    } else {
      // --- Shipment Order Logic (Modified) ---
      const price = row["售價(含稅)"] || 0;
      const customer = row["收件人姓名"] || "";
      
      // Change 1: Ship date comes strictly from "實際出貨日"
      const shipDate = formatShipDate(row["實際出貨日"]);
      
      // Change 2: Order date comes from "轉單日" instead of "訂單成立日"
      const orderDate = formatOrderDate(row["轉單日"]);

      output = {
        "Omni ERP 系統訂單編號": orderId,
        "SKU ID": sku,
        "主單狀態": "已出貨",
        "主單編號": orderId,
        "來源平台": "MOMO",
        "品牌": "MUFE",
        "商品售價": price,
        "客戶名稱": customer,
        "已出貨狀態時間": shipDate,
        "平台名稱": "MOMO",
        "折扣後實收總價": price,
        "數量": row["數量"] || 0,
        "核帳金額": row["進價(含稅)"] || 0,
        "產品名稱": row["品名"] || "",
        "產品單價": price,
        "訂購日期": orderDate,
        "退貨狀態更新時間": "",
        "銷售訂單狀態": "已出貨",
        "銷售訂單編號": orderId,
        "退貨申請日": "",
        "退貨原因": "",
        "地址": "",
        "LFL 配送代碼": "",
        "平台預計出貨日": "",
        "批次更新": "",
        "收件人": "",
        "收件人電話": "",
        "標籤": "",
        "準備出貨狀態時間": "",
        "物流方式": "",
        "缺貨狀態更新時間": "",
        "訂單取消狀態時間": "",
        "超取門市退貨日": "",
        "超取門市進貨日": "",
        "部分取消狀態時間": "",
        "郵遞區號": "",
        "配送條碼": "",
        "配送編號": "",
        "銷售訂單分配數": "",
        "門市代碼": "",
        "門市名稱": "",
        "預計到貨時間": ""
      };
    }

    // Create array of values respecting the header order
    return headers.map(h => {
        const val = output[h as keyof CsvOutputRow];
        const strVal = val === undefined || val === null ? "" : String(val);
        
        // Handle CSV escaping for commas or quotes
        // We also force quotes for "退貨原因" to match specific user requirement: "想要..."
        const shouldQuote = h === "退貨原因" || strVal.includes(",") || strVal.includes('"') || strVal.includes('\n');

        if (shouldQuote) {
            return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
    }).join(",");
  });

  return {
    csvContent: [headers.join(","), ...csvRows].join("\n"),
    filePrefix,
    count: rows.length
  };
};
export interface ExcelRow {
  "訂單編號": string;
  "訂單成立日": string | number | Date;
  "實際出貨日": string | number | Date;
  "收件人姓名": string;
  "商品原廠編號": string;
  "品名": string;
  "數量": number;
  "進價(含稅)": number;
  "售價(含稅)": number;
  
  // 新增退貨相關欄位
  "訂單類別"?: string;
  "退貨原因"?: string;
  "回收送達日"?: string | number | Date;
  "轉單日"?: string | number | Date;
  
  [key: string]: any; // Allow other columns
}

export interface CsvOutputRow {
  "Omni ERP 系統訂單編號": string;
  "SKU ID": string;
  "主單狀態": string;
  "主單編號": string;
  "來源平台": string;
  "品牌": string;
  "商品售價": number | string; // 改為 string 以允許空值
  "客戶名稱": string;
  "已出貨狀態時間": string;
  "平台名稱": string;
  "折扣後實收總價": number | string;
  "數量": number | string;
  "核帳金額": number | string;
  "產品名稱": string;
  "產品單價": number | string;
  "訂購日期": string;
  "退貨狀態更新時間": string;
  "銷售訂單狀態": string;
  "銷售訂單編號": string;
  "退貨申請日": string;
  "退貨原因": string;
  "地址": string;
  "LFL 配送代碼": string;
  "平台預計出貨日": string;
  "批次更新": string;
  "收件人": string;
  "收件人電話": string;
  "標籤": string;
  "準備出貨狀態時間": string;
  "物流方式": string;
  "缺貨狀態更新時間": string;
  "訂單取消狀態時間": string;
  "超取門市退貨日": string;
  "超取門市進貨日": string;
  "部分取消狀態時間": string;
  "郵遞區號": string;
  "配送條碼": string;
  "配送編號": string;
  "銷售訂單分配數": string;
  "門市代碼": string;
  "門市名稱": string;
  "預計到貨時間": string;
}

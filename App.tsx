import React, { useState } from 'react';
import { Download, CheckCircle, FileText, AlertCircle, RefreshCw, FileOutput } from 'lucide-react';
import Dropzone from './components/Dropzone';
import { parseExcel, convertToCsvData } from './services/excelService';
import { generateFilenameTimestamp } from './utils/dateFormatter';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [generatedFilename, setGeneratedFilename] = useState<string>("");
  const [recordCount, setRecordCount] = useState(0);
  const [fileTypeDisplay, setFileTypeDisplay] = useState<string>("");

  const handleFileProcess = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setStatus('processing');
    setProgress(0);
    setErrorMsg("");

    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);

    try {
      // 1. Parse Excel
      const jsonData = await parseExcel(uploadedFile);
      
      // 2. Convert to CSV Logic
      if (jsonData.length === 0) {
        throw new Error("Excel 檔案內容為空");
      }

      const { csvContent: csv, filePrefix, count } = convertToCsvData(jsonData);
      
      clearInterval(interval);
      setProgress(100);
      setCsvContent(csv);
      setRecordCount(count);
      setFileTypeDisplay(filePrefix.includes("RTN") ? "退貨訂單 (RTN)" : "一般出貨訂單 (SHPECOM)");
      
      const filename = `${filePrefix}_${generateFilenameTimestamp()}.csv`;
      setGeneratedFilename(filename);
      
      // Small delay to show 100% before switching to success
      setTimeout(() => setStatus('success'), 500);

    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || "轉檔失敗，請確認 Excel 格式是否正確");
    }
  };

  const downloadFile = () => {
    if (!csvContent) return;
    
    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', generatedFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setCsvContent(null);
    setGeneratedFilename("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-md font-bold text-lg tracking-tighter">
              MUFE
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              MOMO 轉檔小幫手
            </h1>
          </div>
          <div className="hidden sm:flex flex-col items-end justify-center text-xs text-gray-400 font-mono leading-tight">
            <span>v1.1.0</span>
            <span className="text-[10px] opacity-75">Made by IS Nick</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-12">
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Status Bar / Header of Card */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileOutput size={24} className="text-gray-600" />
              Excel 轉 CSV 
            </h2>
            <p className="text-gray-500 text-sm mt-1 ml-8">
              支援「出貨訂單」與「退貨訂單」自動判斷
            </p>
          </div>

          <div className="p-8">
            {/* 1. Upload State */}
            {status === 'idle' && (
              <div className="space-y-4">
                <Dropzone onFileAccepted={handleFileProcess} isLoading={false} />
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    請上傳標準 MOMO 後台匯出的 .xlsx 檔案
                  </p>
                </div>
              </div>
            )}

            {/* 2. Processing State */}
            {status === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-full max-w-md space-y-4">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>處理中...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-xs text-gray-400 pt-2">
                    正在分析訂單類別與轉換資料...
                  </p>
                </div>
              </div>
            )}

            {/* 3. Success State */}
            {status === 'success' && (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">轉檔成功！</h3>
                
                <div className="flex flex-col items-center mb-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                        {fileTypeDisplay}
                    </span>
                    <p className="text-gray-500 text-center max-w-md">
                    已成功轉換 {recordCount} 筆資料。
                    </p>
                </div>

                <div className="w-full bg-gray-50 rounded-lg border border-gray-200 p-4 mb-8">
                  <div className="flex items-center gap-3">
                    <FileText className="text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {generatedFilename}
                      </p>
                      <p className="text-xs text-gray-500">
                        CSV 文件 • {(new Blob([csvContent || ""]).size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={reset}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    重新上傳
                  </button>
                  <button
                    onClick={downloadFile}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    下載檔案
                  </button>
                </div>
              </div>
            )}

            {/* 4. Error State */}
            {status === 'error' && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">發生錯誤</h3>
                <p className="text-red-500 mb-8 text-center max-w-md bg-red-50 p-3 rounded-md border border-red-100">
                  {errorMsg}
                </p>
                <button
                  onClick={reset}
                  className="px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  重試
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Helper Footer */}
        <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
                僅支援標準 MOMO 訂單 Excel 格式 (xlsx)
            </p>
        </div>
      </main>
    </div>
  );
};

export default App;

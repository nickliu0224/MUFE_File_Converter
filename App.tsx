import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, RefreshCw, FileOutput, Loader2, FileArchive, XCircle } from 'lucide-react';
import Dropzone from './components/Dropzone';
import { parseExcel, convertToCsvData } from './services/excelService';
import { generateFilenameTimestamp } from './utils/dateFormatter';
import JSZip from 'jszip';

interface ProcessedFile {
  id: string;
  originalName: string;
  status: 'processing' | 'success' | 'error';
  progress: number;
  csvContent: string | null;
  outputFilename: string;
  recordCount: number;
  fileTypeDisplay: string;
  errorMsg?: string;
}

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  
  // Computed states
  const isProcessing = files.some(f => f.status === 'processing');
  const hasFiles = files.length > 0;
  const successFiles = files.filter(f => f.status === 'success');
  const hasSuccess = successFiles.length > 0;

  const handleFilesAccepted = async (uploadedFiles: File[]) => {
    // Initialize state for new files
    const newFileStates: ProcessedFile[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalName: file.name,
      status: 'processing',
      progress: 0,
      csvContent: null,
      outputFilename: '',
      recordCount: 0,
      fileTypeDisplay: '',
    }));

    setFiles(prev => [...prev, ...newFileStates]);

    // Process each file
    // We match by index since we just added them to the end, but using ID is safer if we passed it along
    // Here we iterate the original files and update state by matching originalName + index or just creating a closure
    
    // To keep it simple and safe with React state updates, let's process them one by one but async
    uploadedFiles.forEach(async (file, index) => {
      const fileId = newFileStates[index].id;
      await processSingleFile(file, fileId);
    });
  };

  const processSingleFile = async (file: File, fileId: string) => {
    // Helper to update specific file state
    const updateFile = (updates: Partial<ProcessedFile>) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...updates } : f));
    };

    // Simulate progress
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId && f.status === 'processing' && f.progress < 90) {
          return { ...f, progress: f.progress + 10 };
        }
        return f;
      }));
    }, 100);

    try {
      const jsonData = await parseExcel(file);
      
      if (jsonData.length === 0) {
        throw new Error("Excel 檔案內容為空");
      }

      const { csvContent, filePrefix, count } = convertToCsvData(jsonData);
      
      clearInterval(interval);
      
      // Generate unique filename part (append random string to avoid collision in batch)
      const timestamp = generateFilenameTimestamp();
      const uniqueSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const filename = `${filePrefix}_${timestamp}_${uniqueSuffix}.csv`;

      updateFile({
        status: 'success',
        progress: 100,
        csvContent: csvContent,
        outputFilename: filename,
        recordCount: count,
        fileTypeDisplay: filePrefix.includes("RTN") ? "退貨 (RTN)" : "出貨 (SHPECOM)"
      });

    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      updateFile({
        status: 'error',
        progress: 100,
        errorMsg: error.message || "轉檔失敗",
        recordCount: 0
      });
    }
  };

  const downloadAll = async () => {
    if (successFiles.length === 0) return;

    // If only one file, download directly
    if (successFiles.length === 1) {
      const f = successFiles[0];
      downloadSingle(f.outputFilename, f.csvContent!);
      return;
    }

    // Multiple files: Zip them
    const zip = new JSZip();
    
    successFiles.forEach(f => {
      if (f.csvContent) {
        // Add BOM for Excel UTF-8
        zip.file(f.outputFilename, "\uFEFF" + f.csvContent);
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const timestamp = generateFilenameTimestamp();
    const zipName = `MUFE_MOMO_Converted_${timestamp}.zip`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', zipName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSingle = (filename: string, content: string) => {
    const bom = "\uFEFF";
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/mufe-logo.png" 
              alt="MAKE UP FOR EVER" 
              className="h-12 w-auto object-contain select-none"
            />
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              MOMO 轉檔小幫手
            </h1>
          </div>
          <div className="hidden sm:flex flex-col items-end justify-center font-mono leading-tight">
            <span className="text-xs text-gray-400">v1.2.0</span>
            <span className="text-xs font-semibold text-gray-600">Made by IS PM Nick</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[400px] flex flex-col">
          
          {/* Status Bar / Header of Card */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileOutput size={24} className="text-gray-600" />
                Excel 轉 CSV
              </h2>
              <p className="text-gray-500 text-sm mt-1 ml-8">
                {hasFiles 
                  ? `已處理 ${files.filter(f => f.status !== 'processing').length} / ${files.length} 個檔案`
                  : "支援多個檔案批次上傳與轉檔"}
              </p>
            </div>
            {hasFiles && (
               <button
               onClick={reset}
               className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
             >
               清除列表
             </button>
            )}
          </div>

          <div className="p-8 flex-grow flex flex-col">
            
            {/* 1. Upload State (Show when empty) */}
            {!hasFiles && (
              <div className="flex-grow flex flex-col justify-center space-y-4">
                <Dropzone onFilesAccepted={handleFilesAccepted} isLoading={false} />
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    請上傳標準 MOMO 後台匯出的 .xlsx 檔案
                  </p>
                </div>
              </div>
            )}

            {/* 2. File List (Show when has files) */}
            {hasFiles && (
              <div className="space-y-4">
                 {/* Mini Dropzone for adding more */}
                 {!isProcessing && (
                    <div className="mb-6">
                         <Dropzone onFilesAccepted={handleFilesAccepted} isLoading={isProcessing} />
                    </div>
                 )}

                 <div className="flex flex-col gap-3">
                    {files.map((file) => (
                        <div key={file.id} className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center justify-between transition-all hover:shadow-sm hover:border-gray-200">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Icon based on status */}
                                {file.status === 'processing' && <Loader2 className="animate-spin text-blue-500" size={20} />}
                                {file.status === 'success' && <CheckCircle className="text-green-500" size={20} />}
                                {file.status === 'error' && <XCircle className="text-red-500" size={20} />}
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate" title={file.originalName}>
                                        {file.originalName}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs mt-0.5">
                                        {file.status === 'processing' && (
                                            <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-blue-500 h-full transition-all duration-300" style={{width: `${file.progress}%`}} />
                                            </div>
                                        )}
                                        {file.status === 'success' && (
                                            <>
                                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                    {file.fileTypeDisplay}
                                                </span>
                                                <span className="text-gray-500">
                                                    {file.recordCount} 筆資料
                                                </span>
                                            </>
                                        )}
                                        {file.status === 'error' && (
                                            <span className="text-red-500">
                                                {file.errorMsg}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Individual Action */}
                            {file.status === 'success' && (
                                <button 
                                    onClick={() => downloadSingle(file.outputFilename, file.csvContent!)}
                                    className="ml-4 p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
                                    title="下載此檔案"
                                >
                                    <Download size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                 </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {hasFiles && (
             <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
                 <button
                    onClick={reset}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-white hover:border-gray-400 transition-colors flex items-center gap-2 text-sm"
                  >
                    <RefreshCw size={16} />
                    全部清除
                  </button>
                  
                  <button
                    onClick={downloadAll}
                    disabled={!hasSuccess || isProcessing}
                    className={`px-6 py-2.5 rounded-xl font-medium shadow-lg transition-all flex items-center gap-2 text-sm
                        ${(!hasSuccess || isProcessing) 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                            : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl'
                        }
                    `}
                  >
                    {successFiles.length > 1 ? <FileArchive size={16} /> : <Download size={16} />}
                    {successFiles.length > 1 ? `打包下載所有 (${successFiles.length})` : '下載檔案'}
                  </button>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
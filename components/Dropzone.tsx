import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Files } from 'lucide-react';

interface DropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  isLoading: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAccepted, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles: File[] = [];
      Array.from(e.dataTransfer.files).forEach((item) => {
        const file = item as File;
        if (isValidFile(file)) {
            validFiles.push(file);
        }
      });
      
      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      } else {
        alert("請上傳 .xlsx 格式的 Excel 檔案");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles: File[] = [];
      Array.from(e.target.files).forEach((item) => {
        const file = item as File;
        if (isValidFile(file)) {
            validFiles.push(file);
        }
      });

      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    }
  };

  const isValidFile = (file: File) => {
    return (
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
      file.name.endsWith(".xlsx")
    );
  };

  return (
    <div
      className={`relative w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out flex flex-col items-center justify-center cursor-pointer 
        ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept=".xlsx"
        multiple // Enable multiple file selection
        onChange={handleInputChange}
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center text-center p-6">
        <div className={`p-4 rounded-full mb-4 ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
           {isDragOver ? <Files size={32} /> : <UploadCloud size={32} />}
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          {isLoading ? "處理中..." : "點擊或拖曳多個檔案至此"}
        </h3>
        <p className="text-sm text-gray-400 mt-2">支援批次上傳與轉檔</p>
      </div>
    </div>
  );
};

export default Dropzone;
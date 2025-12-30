import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface ImageUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedFormats?: string[];
  maxFileSize?: number;
}

export default function ImageUploadZone({
  onFilesSelected,
  maxFiles = 50,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFileSize = 10 * 1024 * 1024,
}: ImageUploadZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedFormats.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File too large. Max size: ${maxFileSize / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const totalFiles = selectedFiles.length + fileArray.length;

    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError('');
    const validFiles: ImageFile[] = [];

    fileArray.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const id = Math.random().toString(36).substring(7);
      const preview = URL.createObjectURL(file);
      validFiles.push({
        id,
        file,
        preview,
        status: 'pending',
      });
    });

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(validFiles.map(f => f.file));
    }
  }, [selectedFiles, maxFiles, acceptedFormats, maxFileSize, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setSelectedFiles([]);
    setError('');
  }, [selectedFiles]);

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
          ${isDragging
            ? 'border-gold-500 bg-gold-50 scale-[1.02]'
            : 'border-sand-300 bg-sand-50 hover:border-sand-400 hover:bg-sand-100'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-6 rounded-full transition-all duration-200
            ${isDragging ? 'bg-gold-100 scale-110' : 'bg-sand-200'}
          `}>
            <Upload className={`w-12 h-12 ${isDragging ? 'text-gold-600' : 'text-sand-600'}`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-brown-700 font-arabic">
              {t.detection.title}
            </h3>
            <p className="text-sand-700 font-arabic">
              {t.detection.uploadZone}
            </p>
          </div>

          <label
            htmlFor="file-upload"
            className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg font-medium cursor-pointer hover:from-gold-600 hover:to-gold-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-arabic"
          >
            {t.detection.uploadZone}
          </label>

          <div className="text-sm text-sand-600 space-y-1 font-arabic">
            <p>{t.detection.uploadHint}</p>
            <p>Maximum file size: {maxFileSize / 1024 / 1024}MB per image</p>
            <p>Maximum {maxFiles} images at once</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-brown-700">
              Selected Images ({selectedFiles.length})
            </h4>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {selectedFiles.map((imageFile) => (
              <div
                key={imageFile.id}
                className="relative group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-square relative">
                  <img
                    src={imageFile.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  <button
                    onClick={() => removeFile(imageFile.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-xs text-white truncate">
                      {imageFile.file.name}
                    </p>
                    <p className="text-xs text-sand-200">
                      {(imageFile.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                {imageFile.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {imageFile.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center p-2">
                    <p className="text-xs text-white text-center">{imageFile.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

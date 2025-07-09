import { useState } from 'react';
import axios from 'axios';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFile: any | null;
}

interface UseCloudinaryUploadReturn {
  uploadState: UploadState;
  uploadFile: (file: File) => Promise<any>;
  resetUpload: () => void;
}

export const useCloudinaryUpload = (): UseCloudinaryUploadReturn => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFile: null,
  });

  const getUploadEndpoint = (file: File): string => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    // Determine resource type based on file type
    if (file.type.startsWith('image/')) {
      return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    } else {
      // For PDFs, Word docs, and other file types
      return `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
    }
  };

  const isPDFFile = (file: File): boolean => {
    return file.name.toLowerCase().endsWith('.pdf') || 
           file.type === 'application/pdf';
  };

  const uploadFile = async (file: File): Promise<any> => {
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
      uploadedFile: null,
    }));

    // Check if it's a PDF file and show warning
    if (isPDFFile(file)) {
      console.warn('PDF file detected. This may require account verification.');
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string
    );

    // Add resource type for non-image files
    if (!file.type.startsWith('image/')) {
      formData.append("resource_type", "raw");
    }

    // Add additional parameters for PDF files
    if (isPDFFile(file)) {
      // Ensure it's uploaded as raw resource type
      formData.set("resource_type", "raw");
      // Add flags to help with untrusted account issues
      formData.append("flags", "attachment");
    }

    try {
      const endpoint = getUploadEndpoint(file);
      
      const response = await axios.post(endpoint, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadState(prev => ({
              ...prev,
              progress,
            }));
          }
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout for large files
        timeout: 60000, // 60 seconds
      });

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFile: response.data,
      }));

      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        
        // Handle untrusted customer error
        if (errorData.code === 'show_original_customer_untrusted') {
          const errorMessage = 'PDF files require account verification. Please verify your Cloudinary account or contact support.';
          
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            progress: 0,
            error: errorMessage,
          }));

          const customError = new Error(errorMessage);
          customError.name = 'CloudinaryUntrustedError';
          throw customError;
        }
        
        // Handle invalid upload preset
        if (errorData.message?.includes('Invalid upload preset')) {
          const errorMessage = 'Upload preset not configured for this file type. Please check your Cloudinary settings.';
          
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            progress: 0,
            error: errorMessage,
          }));

          throw new Error(errorMessage);
        }
        
        // Handle file size limit
        if (errorData.message?.includes('File size too large')) {
          const errorMessage = 'File size is too large. Please try a smaller file.';
          
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            progress: 0,
            error: errorMessage,
          }));

          throw new Error(errorMessage);
        }
      }

      const errorMessage = error.response?.data?.error?.message || 
                          error.message || 
                          'Upload failed';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage,
      }));

      throw error;
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedFile: null,
    });
  };

  return {
    uploadState,
    uploadFile,
    resetUpload,
  };
};
'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { StagedQuestion } from '@/lib/types';

interface DocxUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  onStagingReady: (staging: StagedQuestion[], fileName: string) => void;
}

export function DocxUploadModal({
  isOpen,
  onClose,
  examId,
  onStagingReady,
}: DocxUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.docx')) {
        setError('Please select a valid Word (.docx) document.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a .docx file first.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/exams/${examId}/upload-docx`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract document questions');
      }

      onStagingReady(data.stagingQuestions, file.name);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error parsing document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Word Document (.docx)"
      description="Automated Nigerian collegiate question extraction engine (Mammoth + Regex tokenization)."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-all group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />

          <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="text-sm font-bold text-slate-800">
            {file ? file.name : 'Click to select or drag and drop Word document (.docx)'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accepts standard exam sheets with numbering (1., 1)), options (A., B., [ ]), and answers (Ans: B)
          </p>
        </div>

        <div className="flex justify-center">
          <a
            href="/samples/LAW301_Sample_Exam_Paper.docx"
            download
            className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample Nigerian Exam Paper (.docx)</span>
          </a>
        </div>

        {file && (
          <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-semibold">{file.name}</span>
              <span className="text-slate-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          </div>
        )}

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">Supported Ingestion Patterns:</div>
          <div>• <strong>Questions:</strong> <code className="bg-white px-1 py-0.5 rounded border">1.</code>, <code className="bg-white px-1 py-0.5 rounded border">1)</code>, <code className="bg-white px-1 py-0.5 rounded border">Question 1:</code></div>
          <div>• <strong>Options:</strong> <code className="bg-white px-1 py-0.5 rounded border">A.</code>, <code className="bg-white px-1 py-0.5 rounded border">(a)</code>, <code className="bg-white px-1 py-0.5 rounded border">[*] Option</code></div>
          <div>• <strong>Answer Keys:</strong> <code className="bg-white px-1 py-0.5 rounded border">Answer: B</code> or <code className="bg-white px-1 py-0.5 rounded border">Ans: C</code></div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isUploading ? 'Extracting Questions...' : 'Extract & Preview'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

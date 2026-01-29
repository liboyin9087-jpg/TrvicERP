/**
 * useDocumentGenerator Hook
 * Custom hook for document generation state and logic
 */

import { useState, useCallback } from 'react';
import type { DocumentType, DocumentGenerationData, DocumentGeneratorState } from './document-generator.types';

export function useDocumentGenerator(
  onSendLine?: (docType: DocumentType, content: string) => Promise<void>,
  initialData?: DocumentGenerationData,
) {
  const [state, setState] = useState<DocumentGeneratorState>({
    selectedDocuments: [],
    isGenerating: false,
    isExporting: false,
  });

  const toggleDocument = useCallback((docType: DocumentType) => {
    setState(prev => ({
      ...prev,
      selectedDocuments: prev.selectedDocuments.includes(docType)
        ? prev.selectedDocuments.filter(d => d !== docType)
        : [...prev.selectedDocuments, docType],
    }));
  }, []);

  const generateDocuments = useCallback(async (docTypes: DocumentType[]) => {
    setState(prev => ({ ...prev, isGenerating: true, error: undefined }));
    try {
      // Document generation logic will be implemented here
      setState(prev => ({ ...prev, selectedDocuments: docTypes }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate documents',
      }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, []);

  const exportDocument = useCallback(async (docType: DocumentType) => {
    setState(prev => ({ ...prev, isExporting: true, error: undefined }));
    try {
      // Export logic will be implemented here
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export document',
      }));
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, []);

  const sendViaLine = useCallback(
    async (docType: DocumentType, content: string) => {
      if (!onSendLine) {
        throw new Error('onSendLine callback not provided');
      }
      await onSendLine(docType, content);
    },
    [onSendLine],
  );

  return {
    ...state,
    toggleDocument,
    generateDocuments,
    exportDocument,
    sendViaLine,
  };
}

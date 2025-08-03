import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Intervention, Attachment } from '../../types';
import FileIcon from '../icons/FileIcon';

interface AttachmentsTabProps {
    intervention: Intervention;
    onOpenImagePreview: (url: string) => void;
    onAddAttachment: (id: number, attachment: Attachment) => void;
    onRemoveAttachment: (id: number, attachmentId: string) => void;
}

const AttachmentsTab: React.FC<AttachmentsTabProps> = ({ intervention, onOpenImagePreview, onAddAttachment, onRemoveAttachment }) => {
    const { attachments } = intervention;
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadDescription, setUploadDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Funzione per determinare il tipo di file
    const getFileType = (file: File): 'image' | 'document' => {
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return imageTypes.includes(file.type) ? 'image' : 'document';
    };

    // Funzione per convertire file in base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Gestione selezione file
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFiles(files);
            setShowUploadModal(true);
        }
    };

    // Gestione upload file
    const handleUploadFiles = async () => {
        if (!selectedFiles) return;
        
        setIsUploading(true);
        
        try {
            const totalFiles = selectedFiles.length;
            let uploadedCount = 0;
            
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                
                // Validazione dimensione file (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    alert(`Il file "${file.name}" è troppo grande. Dimensione massima: 10MB`);
                    continue;
                }
                
                const base64Data = await fileToBase64(file);
                
                const newAttachment: Attachment = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: getFileType(file),
                    url: base64Data,
                    description: uploadDescription || file.name,
                    timestamp: new Date().toISOString(),
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type
                };
                
                onAddAttachment(intervention.id, newAttachment);
                uploadedCount++;
            }
            
            // Feedback successo
            if (uploadedCount > 0) {
                const message = uploadedCount === 1 
                    ? `✅ Allegato caricato con successo!`
                    : `✅ ${uploadedCount} allegati caricati con successo!`;
                alert(message);
            }
            
            // Reset form
            setSelectedFiles(null);
            setUploadDescription('');
            setShowUploadModal(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Errore durante l\'upload:', error);
            alert('❌ Errore durante l\'upload dei file. Riprova.');
        } finally {
            setIsUploading(false);
        }
    };

    // Funzione per aprire il selettore file
    const handleAddAttachment = () => {
        fileInputRef.current?.click();
    };

    // Funzione per formattare la dimensione del file
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="animate-scale-in">
            {/* Header con pulsante aggiungi */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Allegati</h3>
                <button 
                    onClick={handleAddAttachment}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Aggiungi Allegato
                </button>
            </div>

            {/* Input file nascosto */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Modal upload - PROMINENTE E GRANDE - RENDERIZZATO CON PORTAL */}
            {showUploadModal && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-4 border-primary/20 p-8 w-full max-w-2xl max-h-[95vh] overflow-y-auto animate-scale-in">
                        {/* Indicatore modale prominente */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full animate-pulse"></div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                        {/* Header Modal */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        Carica Allegati
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Aggiungi file al tuo intervento
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFiles(null);
                                    setUploadDescription('');
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                disabled={isUploading}
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Lista file selezionati */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        File Selezionati
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedFiles?.length} {selectedFiles?.length === 1 ? 'file' : 'file'} pronti per l'upload
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 max-h-64 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                                {selectedFiles && Array.from(selectedFiles).map((file, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex-shrink-0">
                                            {getFileType(file) === 'image' ? (
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                                    <FileIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {file.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatFileSize(file.size)}
                                                </span>
                                                <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                                    {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Campo descrizione */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Descrizione (opzionale)
                            </label>
                            <textarea
                                value={uploadDescription}
                                onChange={(e) => setUploadDescription(e.target.value)}
                                placeholder="Aggiungi una descrizione per questi allegati (es. 'Foto prima dell'intervento', 'Fattura materiali', ecc.)..."
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100 resize-none transition-all"
                                rows={3}
                            />
                        </div>

                        {/* Pulsanti GRANDI E PROMINENTI */}
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFiles(null);
                                    setUploadDescription('');
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                                className="flex-1 px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-bold text-lg hover:scale-105 shadow-lg"
                                disabled={isUploading}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Annulla
                                </div>
                            </button>
                            <button
                                onClick={handleUploadFiles}
                                disabled={isUploading}
                                className="flex-1 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl hover:from-primary/90 hover:to-primary/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-bold text-lg shadow-2xl hover:scale-105 hover:shadow-primary/25"
                            >
                                {isUploading ? (
                                    <>
                                        <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Caricamento...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span>Carica Allegati</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Griglia allegati */}
            {attachments.length > 0 ? (
                <>
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            Allegati Caricati ({attachments.length})
                        </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {attachments.map(att => (
                            <div key={att.id} className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                                {/* Pulsante elimina */}
                                <button 
                                    onClick={() => onRemoveAttachment(intervention.id, att.id)} 
                                    className="absolute top-3 right-3 z-10 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg"
                                    title="Elimina allegato"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>

                                {/* Contenuto allegato */}
                                {att.type === 'image' ? (
                                    <button 
                                        onClick={() => onOpenImagePreview(att.url)} 
                                        className="w-full aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary relative"
                                    >
                                        <img 
                                            src={att.url} 
                                            alt={att.description} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                <span className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                                                    🖼️ Immagine
                                                </span>
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                ) : (
                                    <a 
                                        href={att.url} 
                                        download={att.fileName || att.description}
                                        className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 flex flex-col items-center justify-center text-gray-600 dark:text-gray-300 hover:from-primary/10 hover:to-primary/20 dark:hover:from-primary/10 dark:hover:to-primary/20 transition-all duration-300 relative group/download"
                                    >
                                        <div className="absolute top-3 left-3">
                                            <span className="text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full font-medium shadow-sm">
                                                {att.fileName ? att.fileName.split('.').pop()?.toUpperCase() : 'FILE'}
                                            </span>
                                        </div>
                                        <FileIcon className="h-16 w-16 mb-3 group-hover/download:scale-110 transition-transform duration-300" />
                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                                            <span className="text-xs font-medium bg-primary text-white px-3 py-1 rounded-full opacity-0 group-hover/download:opacity-100 transition-opacity duration-300">
                                                📎 Scarica
                                            </span>
                                        </div>
                                    </a>
                                )}

                                {/* Info allegato */}
                                <div className="p-4">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-2" title={att.description}>
                                        {att.description}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                                            </svg>
                                            <span>{new Date(att.timestamp).toLocaleDateString('it-IT')}</span>
                                        </div>
                                        {att.fileSize && (
                                            <div className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <span>{formatFileSize(att.fileSize)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">Nessun allegato per questo intervento</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Clicca "Aggiungi Allegato" per caricare file</p>
                </div>
            )}
        </div>
    );
};

export default AttachmentsTab;
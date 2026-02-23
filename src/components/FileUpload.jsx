import { useRef, useState } from 'react';

/**
 * Componente para upload de arquivos com suporte a drag & drop
 */
export default function FileUpload({
    label,
    accept,
    onFileSelect,
    fileName,
    icon
}) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            // Verificar se a extensão é aceita
            const acceptedExts = accept.split(',').map(ext => ext.trim().toLowerCase());
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            if (acceptedExts.includes(fileExt)) {
                onFileSelect(file);
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-black dark:text-foreground">{label}</label>
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${isDragging
                        ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
                        : 'border-gray-400 dark:border-input hover:border-primary hover:bg-accent hover:text-accent-foreground'
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />
                <span className="text-2xl">{isDragging ? '📂' : icon}</span>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-black dark:text-foreground">
                        {isDragging ? 'Solte o arquivo aqui!' : (fileName || 'Clique ou arraste o arquivo aqui')}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-muted-foreground">
                        {accept}
                    </span>
                </div>
            </div>
        </div>
    );
}

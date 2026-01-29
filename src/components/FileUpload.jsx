import { useRef } from 'react';

/**
 * Componente para upload de arquivos
 */
export default function FileUpload({
    label,
    accept,
    onFileSelect,
    fileName,
    icon
}) {
    const inputRef = useRef(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-black dark:text-foreground">{label}</label>
            <div
                onClick={handleClick}
                className="relative flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-gray-400 dark:border-input rounded-xl cursor-pointer hover:border-primary hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />
                <span className="text-2xl">{icon}</span>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-black dark:text-foreground">
                        {fileName || 'Clique para selecionar'}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-muted-foreground">
                        {accept}
                    </span>
                </div>
            </div>
        </div>
    );
}

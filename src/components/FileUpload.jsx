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
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div
                onClick={handleClick}
                className="relative flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
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
                    <span className="text-sm font-medium text-gray-600">
                        {fileName || 'Clique para selecionar'}
                    </span>
                    <span className="text-xs text-gray-400">
                        {accept}
                    </span>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import FileUpload from './FileUpload';
import {
    readDateExcelFile,
    validateDateData,
    processDateTable,
    downloadProcessedExcel
} from '../utils/dateProcessor';

function DateProcessor() {
    const [file, setFile] = useState(null);
    const [originalData, setOriginalData] = useState([]);
    const [processedData, setProcessedData] = useState([]);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [referenceYear, setReferenceYear] = useState(new Date().getFullYear());

    const handleFileSelect = async (selectedFile) => {
        try {
            setError(null);
            setProcessedData([]);

            const data = await readDateExcelFile(selectedFile);
            const validation = validateDateData(data);

            if (!validation.valid) {
                setError(validation.errors.join('\n'));
                return;
            }

            setFile(selectedFile);
            setOriginalData(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleProcess = () => {
        if (originalData.length === 0) {
            setError('Por favor, carregue um arquivo Excel primeiro.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const processed = processDateTable(originalData, referenceYear);
            setProcessedData(processed);
        } catch (err) {
            setError('Erro ao processar datas: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (processedData.length === 0) return;
        downloadProcessedExcel(processedData);
    };

    const handleClear = () => {
        setFile(null);
        setOriginalData([]);
        setProcessedData([]);
        setError(null);
    };

    // Função para atualizar uma data específica nos dados processados
    const handleDateChange = (index, field, value) => {
        const updated = [...processedData];
        updated[index] = {
            ...updated[index],
            [field]: value
        };
        setProcessedData(updated);
    };

    return (
        <div className="bg-card text-card-foreground rounded-2xl shadow-lg border border-border p-6 mb-8 transition-all hover:shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-black dark:text-foreground">
                📅 Atualizar Datas (+1 mês)
            </h2>

            {/* Formulário de upload - só mostra se não houver dados processados */}
            {processedData.length === 0 && (
                <>
                    <p className="text-sm text-black dark:text-muted-foreground mb-4">
                        Carregue um Excel com colunas <code className="bg-gray-100 dark:bg-muted px-1 rounded border border-gray-300 dark:border-border text-black dark:text-foreground">NOME COMPLETO</code>,
                        <code className="bg-gray-100 dark:bg-muted px-1 rounded ml-1 border border-gray-300 dark:border-border text-black dark:text-foreground">DATA1</code> e
                        <code className="bg-gray-100 dark:bg-muted px-1 rounded ml-1 border border-gray-300 dark:border-border text-black dark:text-foreground">DATA2</code> (formato dd/mm).
                        O sistema irá adicionar 1 mês a cada data e gerar um novo Excel.
                    </p>

                    {/* Seletor de ano */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-black dark:text-foreground mb-2">
                            Ano de referência (para cálculo de ano bissexto):
                        </label>
                        <input
                            type="number"
                            value={referenceYear}
                            onChange={(e) => setReferenceYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                            className="w-32 px-3 py-2 bg-background text-black dark:text-foreground border-2 border-border rounded-lg focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none transition-all"
                            min="2000"
                            max="2100"
                        />
                    </div>

                    {/* Upload */}
                    <FileUpload
                        label="Planilha com Datas"
                        accept=".xlsx,.xls"
                        onFileSelect={handleFileSelect}
                        fileName={file?.name}
                        icon="📅"
                    />

                    {originalData.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="status-text-success text-sm font-medium">
                                ✅ {originalData.length} registros encontrados
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-destructive text-sm whitespace-pre-line font-medium">
                                ❌ {error}
                            </p>
                        </div>
                    )}

                    {/* Botão de processar */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        <button
                            onClick={handleProcess}
                            disabled={isProcessing || originalData.length === 0}
                            className={`
                                px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300
                                ${isProcessing || originalData.length === 0
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                                    : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-xl active:scale-95'
                                }
                            `}
                        >
                            {isProcessing ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Processando...
                                </>
                            ) : (
                                <>
                                    ➕ Avançar 1 Mês
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Tabela de comparação com edição - só mostra após processar */}
            {processedData.length > 0 && originalData.length > 0 && (
                <>
                    <p className="text-sm text-black dark:text-muted-foreground mb-4">
                        Confira as datas atualizadas abaixo. Você pode <strong>editar as novas datas</strong> diretamente na tabela antes de baixar.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-background rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-secondary">
                                    <th className="px-4 py-3 text-left text-sm font-bold text-black dark:text-foreground border-b border-border">
                                        NOME COMPLETO
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-black dark:text-foreground border-b border-border">
                                        DATA1 Original
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-black dark:text-foreground border-b border-border">
                                        DATA1 Nova ✏️
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-black dark:text-foreground border-b border-border">
                                        DATA2 Original
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-black dark:text-foreground border-b border-border">
                                        DATA2 Nova ✏️
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map((row, index) => (
                                    <tr
                                        key={index}
                                        className={index % 2 === 0 ? 'bg-background' : 'bg-secondary/30'}
                                    >
                                        <td className="px-4 py-2 text-sm text-black dark:text-foreground border-b border-border">
                                            {row.nomeCompleto}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-muted-foreground border-b border-border font-mono">
                                            {originalData[index]?.data1}
                                        </td>
                                        <td className="px-2 py-1 border-b border-border">
                                            <input
                                                type="text"
                                                value={row.data1}
                                                onChange={(e) => handleDateChange(index, 'data1', e.target.value)}
                                                className="w-20 px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-300 dark:border-green-700 rounded font-mono font-bold text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm text-muted-foreground border-b border-border font-mono">
                                            {originalData[index]?.data2}
                                        </td>
                                        <td className="px-2 py-1 border-b border-border">
                                            <input
                                                type="text"
                                                value={row.data2}
                                                onChange={(e) => handleDateChange(index, 'data2', e.target.value)}
                                                className="w-20 px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-300 dark:border-green-700 rounded font-mono font-bold text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Botões de ação após processamento */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        <button
                            onClick={handleDownload}
                            className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-green-600 text-white shadow-lg hover:scale-105 hover:shadow-xl active:scale-95 transition-all duration-300"
                        >
                            📥 Baixar Excel
                        </button>

                        <button
                            onClick={handleClear}
                            className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-300"
                        >
                            🔄 Nova Planilha
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default DateProcessor;

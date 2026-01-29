import * as XLSX from 'xlsx';

/**
 * Lê um arquivo Excel e extrai os dados das colunas NUMERO, NOME COMPLETO, DATA1, DATA2
 * @param {File} file - Arquivo Excel (.xlsx)
 * @returns {Promise<Array<{numero: string, nomeCompleto: string, data1: string, data2: string}>>}
 */
export async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Pegar a primeira planilha
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Converter para JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                // Mapear os dados para o formato esperado
                const records = jsonData.map((row) => ({
                    numero: row['NUMERO'] || row['Numero'] || row['numero'] || '',
                    nomeCompleto: row['NOME COMPLETO'] || row['Nome Completo'] || row['nome completo'] || '',
                    data1: row['DATA1'] || row['Data1'] || row['data1'] || '',
                    data2: row['DATA2'] || row['Data2'] || row['data2'] || '',
                }));

                resolve(records);
            } catch (error) {
                reject(new Error('Erro ao ler arquivo Excel: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Erro ao ler arquivo'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Valida se os dados do Excel estão corretos
 * @param {Array} records - Registros do Excel
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateExcelData(records) {
    const errors = [];

    if (!records || records.length === 0) {
        errors.push('O arquivo Excel está vazio ou não contém dados válidos.');
        return { valid: false, errors };
    }

    records.forEach((record, index) => {
        if (!record.numero) {
            errors.push(`Linha ${index + 2}: Campo NUMERO está vazio.`);
        }
        if (!record.nomeCompleto) {
            errors.push(`Linha ${index + 2}: Campo NOME COMPLETO está vazio.`);
        }
        if (!record.data1) {
            errors.push(`Linha ${index + 2}: Campo DATA1 está vazio.`);
        }
        if (!record.data2) {
            errors.push(`Linha ${index + 2}: Campo DATA2 está vazio.`);
        }
    });

    return { valid: errors.length === 0, errors };
}

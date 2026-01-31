import * as XLSX from 'xlsx';

/**
 * Retorna o último dia válido de um mês específico
 * @param {number} month - Mês (1-12)
 * @param {number} year - Ano
 * @returns {number} - Último dia do mês
 */
function getLastDayOfMonth(month, year) {
    // Fevereiro
    if (month === 2) {
        // Ano bissexto
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        return isLeapYear ? 29 : 28;
    }
    // Abril, Junho, Setembro, Novembro
    if ([4, 6, 9, 11].includes(month)) {
        return 30;
    }
    // Restantes (Janeiro, Março, Maio, Julho, Agosto, Outubro, Dezembro)
    return 31;
}

/**
 * Ajusta o dia para não ultrapassar o último dia válido do mês
 * @param {number} day - Dia
 * @param {number} month - Mês (1-12)
 * @param {number} year - Ano
 * @returns {number} - Dia ajustado
 */
function adjustDay(day, month, year) {
    const lastDay = getLastDayOfMonth(month, year);
    return Math.min(day, lastDay);
}

/**
 * Avança 1 mês na data, mantendo o mesmo dia
 * Se o dia não existir no mês de destino, ajusta para o último dia válido
 * @param {string} dateStr - Data no formato dd/mm
 * @param {number} referenceYear - Ano de referência para cálculos
 * @returns {string} - Nova data no formato dd/mm
 */
export function addOneMonth(dateStr, referenceYear = new Date().getFullYear()) {
    // Parse da data
    const parts = dateStr.trim().split('/');
    if (parts.length !== 2) {
        return dateStr; // Retorna original se formato inválido
    }

    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);

    if (isNaN(day) || isNaN(month)) {
        return dateStr; // Retorna original se não for número
    }

    // Avança 1 mês
    month += 1;

    // Se passou de dezembro, vai para janeiro do próximo ano
    if (month > 12) {
        month = 1;
        referenceYear += 1;
    }

    // Ajusta o dia para não ultrapassar o limite do mês de destino
    day = adjustDay(day, month, referenceYear);

    // Formata a saída
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');

    return `${dayStr}/${monthStr}`;
}

/**
 * Processa uma tabela de dados, avançando 1 mês em DATA1 e DATA2
 * @param {Array<{nome: string, data1: string, data2: string}>} data - Dados da tabela
 * @param {number} referenceYear - Ano de referência
 * @returns {Array<{nome: string, data1: string, data2: string}>} - Dados processados
 */
export function processDateTable(data, referenceYear = new Date().getFullYear()) {
    return data.map(row => ({
        nomeCompleto: row.nomeCompleto,
        data1: addOneMonth(row.data1, referenceYear),
        data2: addOneMonth(row.data2, referenceYear),
    }));
}

/**
 * Lê um arquivo Excel com NOME, DATA1, DATA2
 * @param {File} file - Arquivo Excel
 * @returns {Promise<Array<{nome: string, data1: string, data2: string}>>}
 */
export async function readDateExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                const records = jsonData.map((row) => ({
                    nomeCompleto: row['NOME COMPLETO'] || row['Nome Completo'] || row['nome completo'] || row['NOME'] || row['Nome'] || row['nome'] || '',
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
 * Valida os dados da tabela de datas
 * @param {Array} records - Registros
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateDateData(records) {
    const errors = [];

    if (!records || records.length === 0) {
        errors.push('O arquivo Excel está vazio ou não contém dados válidos.');
        return { valid: false, errors };
    }

    records.forEach((record, index) => {
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

/**
 * Gera e baixa um arquivo Excel com os dados processados
 * @param {Array<{nome: string, data1: string, data2: string}>} data - Dados processados
 * @param {string} filename - Nome do arquivo
 */
export function downloadProcessedExcel(data, filename = 'datas_atualizadas.xlsx') {
    // Prepara os dados para o Excel com número sequencial
    const excelData = data.map((row, index) => ({
        'NUMERO': (index + 1).toString().padStart(2, '0'),
        'NOME COMPLETO': row.nomeCompleto,
        'DATA1': row.data1,
        'DATA2': row.data2,
    }));

    // Cria a planilha
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Define largura das colunas
    worksheet['!cols'] = [
        { wch: 8 },  // NUMERO
        { wch: 35 }, // NOME COMPLETO
        { wch: 10 }, // DATA1
        { wch: 10 }, // DATA2
    ];

    // Cria o workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datas Atualizadas');

    // Baixa o arquivo
    XLSX.writeFile(workbook, filename);
}

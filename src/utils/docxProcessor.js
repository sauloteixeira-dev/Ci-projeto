import { renderAsync } from 'docx-preview';

/**
 * Renderiza um arquivo DOCX em um container HTML
 * @param {ArrayBuffer} docxData - Dados do arquivo DOCX
 * @param {HTMLElement} container - Elemento HTML onde renderizar
 * @returns {Promise<void>}
 */
export async function renderDocx(docxData, container) {
    await renderAsync(docxData, container, null, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: false,
        trimXmlDeclaration: true,
        useBase64URL: true,
    });
}

/**
 * Substitui placeholders no conteúdo HTML renderizado
 * @param {HTMLElement} container - Container com o HTML do DOCX
 * @param {Object} replacements - Objeto com os valores de substituição
 * @returns {void}
 */
export function replacePlaceholders(container, replacements) {
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
        let text = textNode.textContent;

        Object.entries(replacements).forEach(([placeholder, value]) => {
            const regex = new RegExp(escapeRegExp(placeholder), 'g');
            text = text.replace(regex, value);
        });

        textNode.textContent = text;
    });
}

/**
 * Escapa caracteres especiais para uso em regex
 * @param {string} string - String a ser escapada
 * @returns {string}
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Carrega um arquivo DOCX como ArrayBuffer
 * @param {File} file - Arquivo DOCX
 * @returns {Promise<ArrayBuffer>}
 */
export async function loadDocxFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            resolve(e.target.result);
        };

        reader.onerror = () => {
            reject(new Error('Erro ao carregar arquivo DOCX'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Formata o número CI com dois dígitos
 * @param {number} num - Número sequencial
 * @returns {string}
 */
export function formatCINumber(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Sanitiza o nome do arquivo removendo caracteres inválidos
 * @param {string} name - Nome original
 * @returns {string}
 */
export function sanitizeFileName(name) {
    return name.replace(/[/\\:*?"<>|]/g, ' ').trim();
}

import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Converte um elemento HTML para imagem PNG
 * @param {HTMLElement} element - Elemento HTML a ser convertido
 * @returns {Promise<Blob>}
 */
export async function htmlToImage(element) {
    const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Alta resolução
        useCORS: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
    });

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png', 1.0);
    });
}

/**
 * Gera e baixa um arquivo ZIP contendo todas as imagens
 * @param {Array<{name: string, blob: Blob}>} images - Array de imagens com nome e blob
 * @returns {Promise<void>}
 */
export async function downloadImagesAsZip(images) {
    const zip = new JSZip();

    images.forEach(({ name, blob }) => {
        zip.file(`${name}.png`, blob);
    });

    const content = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/zip'
    });

    saveAs(content, 'cis-geradas.zip');
}

/**
 * Baixa uma única imagem
 * @param {Blob} blob - Blob da imagem
 * @param {string} filename - Nome do arquivo
 */
export function downloadSingleImage(blob, filename) {
    saveAs(blob, `${filename}.png`);
}

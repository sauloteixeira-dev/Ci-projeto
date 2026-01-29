import { useState, useRef, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import ImageGallery from './components/ImageGallery';
import { readExcelFile, validateExcelData } from './utils/excelReader';
import { htmlToImage, downloadImagesAsZip } from './utils/imageGenerator';
import logoImg from './assets/logo.png';
import './App.css';

const DEFAULT_TEMPLATE = `C.I. N° <<NUMERO>>/AS/2026

Para: Secretaria Municipal da Fazenda
De: Secretaria de Assistência Social
Assunto: Emissão do empenho (Auxilio – Aluguel)

Prezado (a) Senhor (a),

Conforme documentação em anexo, solicitamos a V.S.ª emissão de empenho para pagamento de auxílio – aluguel em favor de <<NOME COMPLETO>>, no valor de R$ 400,00 (quatrocentos reais), referente ao período de <<DATA1>> a <<DATA2>>.

FAVOR EMPENHAR NA FICHA 212

Atenciosamente,

LARISSA ALVES DA SILVA VILELA
Secretária Municipal de Assistência Social`;

function App() {
  const [template, setTemplate] = useState(() => {
    const saved = localStorage.getItem('letterTemplate');
    return saved || DEFAULT_TEMPLATE;
  });
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const previewRef = useRef(null);

  // Salvar modelo no localStorage
  const handleSaveTemplate = () => {
    localStorage.setItem('letterTemplate', template);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  // Handler para upload do Excel
  const handleExcelSelect = async (file) => {
    try {
      setError(null);
      const data = await readExcelFile(file);
      const validation = validateExcelData(data);

      if (!validation.valid) {
        setError(validation.errors.join('\n'));
        return;
      }

      setExcelFile(file);
      setExcelData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Formatar número CI
  const formatCINumber = (num) => {
    return num.toString().padStart(2, '0');
  };

  // Sanitizar nome do arquivo
  const sanitizeFileName = (name) => {
    return name.replace(/[/\\:*?"<>|]/g, ' ').trim();
  };

  // Substituir placeholders no texto
  const replacePlaceholders = (text, replacements) => {
    let result = text;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[<>]/g, '\\$&'), 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  // Gerar cartas
  const handleGenerate = useCallback(async () => {
    if (!template || excelData.length === 0) {
      setError('Por favor, preencha o modelo e carregue o arquivo Excel.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setGeneratedImages([]);
    setProgress({ current: 0, total: excelData.length });

    try {
      const images = [];

      for (let i = 0; i < excelData.length; i++) {
        const record = excelData[i];

        // Substituir placeholders
        const replacements = {
          '<<NUMERO>>': record.numero,
          '<<NOME COMPLETO>>': `<b>${record.nomeCompleto}</b>`,
          '<<DATA1>>': record.data1,
          '<<DATA2>>': record.data2,
        };

        const filledText = replacePlaceholders(template, replacements);

        // Criar container temporário estilo A4
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: 0;
          width: 794px;
          height: 1123px;
          background: white;
          font-family: Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: black;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        `;

        // Processar o texto para HTML do corpo
        const bodyContent = filledText
          .split('\n')
          .map(line => {
            // Linha em negrito e centralizada (FAVOR EMPENHAR)
            if (line.includes('FAVOR EMPENHAR')) {
              return `<p style="text-align: center; font-weight: bold; margin: 25px 0;">${line}</p>`;
            }
            // Negrito em C.I. (toda a linha)
            if (line.includes('C.I. N°')) {
              return `<p style="margin: 6px 0; text-align: justify; font-weight: bold;">${line}</p>`;
            }
            // Linha de assinatura em negrito e centralizada
            if (line.includes('LARISSA ALVES')) {
              return `<p style="font-weight: bold; margin: 2px 0; text-align: center;">${line}</p>`;
            }
            if (line.includes('Secretária Municipal de Assistência Social')) {
              return `<p style="margin: 2px 0; text-align: center;">${line}</p>`;
            }
            // Atenciosamente
            if (line.includes('Atenciosamente')) {
              return `<p style="margin: 25px 0 40px 0;">${line}</p>`;
            }
            // Linha vazia
            if (line.trim() === '') {
              return '<div style="height: 12px;"></div>';
            }
            // Linha normal
            return `<p style="margin: 6px 0; text-align: justify;">${line}</p>`;
          })
          .join('');

        // Montar documento completo com cabeçalho e rodapé
        // 3cm = ~113px (em 96dpi)
        const sideMargin = '113px';

        tempContainer.innerHTML = `
          <!-- Cabeçalho -->
          <div style="text-align: center; padding: 40px ${sideMargin} 10px ${sideMargin}; border-bottom: none;">
            <div style="display: flex; justify-content: center; margin-bottom: 10px;">
              <img src="${logoImg}" style="width: 140px; height: auto;" />
            </div>
            <p style="font-weight: bold; font-size: 14pt; margin: 5px 0;">Prefeitura do Município de Alfenas</p>
            <p style="font-size: 11pt; margin: 2px 0;">Secretaria Municipal de Assistência Social</p>
          </div>
          
          <!-- Corpo do documento -->
          <div style="flex: 1; padding: 20px ${sideMargin}; font-size: 12pt;">
            ${bodyContent}
          </div>
          
          <!-- Rodapé -->
          <div style="text-align: center; padding: 20px ${sideMargin} 30px ${sideMargin}; margin-top: auto;">
            <p style="font-size: 10pt; margin: 2px 0;">Prefeitura Municipal de Alfenas</p>
            <p style="font-size: 10pt; margin: 2px 0; color: #0066cc; text-decoration: underline;">www.alfenas.mg.gov.br</p>
            <p style="font-size: 10pt; margin: 2px 0;">Tel.: 3698 1300</p>
          </div>
        `;

        document.body.appendChild(tempContainer);

        // Aguardar renderização
        await new Promise(resolve => setTimeout(resolve, 100));

        // Converter para imagem
        const blob = await htmlToImage(tempContainer);
        const url = URL.createObjectURL(blob);
        const sanitizedName = sanitizeFileName(record.nomeCompleto);

        images.push({
          name: sanitizedName,
          url,
          blob,
        });

        // Remover container temporário
        document.body.removeChild(tempContainer);

        setProgress({ current: i + 1, total: excelData.length });
      }

      setGeneratedImages(images);
    } catch (err) {
      console.error('Erro ao gerar CIs:', err);
      setError('Erro ao gerar CIs: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [template, excelData]);

  // Download de todas as imagens em ZIP
  const handleDownloadAll = useCallback(async () => {
    if (generatedImages.length === 0) return;

    const imagesForZip = generatedImages.map(img => ({
      name: img.name,
      blob: img.blob,
    }));

    await downloadImagesAsZip(imagesForZip);
  }, [generatedImages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            📝 Gerador de CI
          </h1>
          <p className="text-slate-300 mt-1">
            Gere CI automaticamente a partir de um modelo de texto e dados do Excel
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Template Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📄 Modelo da CI
            </h2>
            <div className="flex items-center gap-3">
              {savedMessage && (
                <span className="text-green-600 text-sm font-medium">
                  ✅ Modelo salvo!
                </span>
              )}
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                💾 Salvar Modelo
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            Use os placeholders: <code className="bg-gray-100 px-1 rounded">{'<<NUMERO>>'}</code>,
            <code className="bg-gray-100 px-1 rounded ml-1">{'<<NOME COMPLETO>>'}</code>,
            <code className="bg-gray-100 px-1 rounded ml-1">{'<<DATA1>>'}</code>,
            <code className="bg-gray-100 px-1 rounded ml-1">{'<<DATA2>>'}</code>
          </p>

          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full h-80 p-4 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Digite o modelo da CI aqui..."
          />
        </div>

        {/* Excel Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Dados do Excel
          </h2>

          <FileUpload
            label="Planilha Excel"
            accept=".xlsx,.xls"
            onFileSelect={handleExcelSelect}
            fileName={excelFile?.name}
            icon="📊"
          />

          {excelData.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✅ {excelData.length} registros encontrados no Excel
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm whitespace-pre-line">
                ❌ {error}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !template || excelData.length === 0}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg
              flex items-center gap-3 transition-all duration-200
              ${isProcessing || !template || excelData.length === 0
                ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }
            `}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                Gerando... ({progress.current}/{progress.total})
              </>
            ) : (
              <>
                🚀 Gerar CIs
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso</span>
              <span className="text-sm text-gray-500">
                {progress.current} de {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Image Gallery */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <ImageGallery
            images={generatedImages}
            onDownloadAll={handleDownloadAll}
          />

          {generatedImages.length === 0 && !isProcessing && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-4">📋</p>
              <p>As CIs geradas aparecerão aqui</p>
            </div>
          )}
        </div>

        {/* Hidden preview container */}
        <div ref={previewRef} className="hidden" />
      </main>
    </div>
  );
}

export default App;

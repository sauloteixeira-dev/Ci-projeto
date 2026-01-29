import { useState, useRef, useCallback, useEffect } from 'react';
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
  const [theme, setTheme] = useState('light');

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

  // Aplicar tema
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
    <div className="min-h-screen flex flex-col bg-background text-black dark:text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-black dark:text-foreground">
              📝 Gerador de CI
            </h1>
            <p className="text-black dark:text-muted-foreground text-sm mt-1">
              Gere documentos oficiais com layout padronizado
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all shadow-sm"
            aria-label="Alternar tema"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Template Section */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-lg border border-border p-6 mb-8 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-black dark:text-foreground">
              📄 Modelo da CI
            </h2>
            <div className="flex items-center gap-3">
              {savedMessage && (
                <span className="text-black dark:text-green-400 text-sm font-medium animate-pulse">
                  ✅ Salvo!
                </span>
              )}
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-md"
              >
                💾 Salvar
              </button>
            </div>
          </div>

          <p className="text-sm text-black dark:text-muted-foreground mb-3">
            Variáveis disponíveis: <code className="bg-gray-100 dark:bg-muted px-1 rounded border border-gray-300 dark:border-border text-black dark:text-foreground">{'<<NUMERO>>'}</code>,
            <code className="bg-gray-100 dark:bg-muted px-1 rounded ml-1 border border-gray-300 dark:border-border text-black dark:text-foreground">{'<<NOME COMPLETO>>'}</code>,
            <code className="bg-gray-100 dark:bg-muted px-1 rounded ml-1 border border-gray-300 dark:border-border text-black dark:text-foreground">{'<<DATA1>>'}</code>,
            <code className="bg-gray-100 dark:bg-muted px-1 rounded ml-1 border border-gray-300 dark:border-border text-black dark:text-foreground">{'<<DATA2>>'}</code>
          </p>

          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full h-80 p-4 bg-background text-black dark:text-foreground border-2 border-border rounded-xl font-mono text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none resize-none transition-all"
            placeholder="Digite o modelo da CI aqui..."
          />
        </div>

        {/* Excel Upload Section */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-lg border border-border p-6 mb-8 transition-all hover:shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-black dark:text-foreground">
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
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="status-text-success text-sm font-medium">
                ✅ {excelData.length} registros encontrados
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
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !template || excelData.length === 0}
            className={`
              px-10 py-5 rounded-2xl font-bold text-lg
              flex items-center gap-3 transition-all duration-300
              ${isProcessing || !template || excelData.length === 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95'
              }
            `}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                Processando... ({progress.current}/{progress.total})
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
          <div className="bg-card border border-border rounded-xl shadow-lg p-4 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {progress.current} de {progress.total}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Image Gallery */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-lg border border-border p-6 transition-all hover:shadow-xl">
          <ImageGallery
            images={generatedImages}
            onDownloadAll={handleDownloadAll}
          />

          {generatedImages.length === 0 && !isProcessing && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-6xl mb-4 opacity-20">📋</div>
              <p className="text-lg">As CIs geradas aparecerão aqui</p>
            </div>
          )}
        </div>

        {/* Hidden preview container */}
        <div ref={previewRef} className="hidden" />
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-border bg-card shadow-inner mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-black dark:text-gray-300">
              Criado por Saulo Teixeira 2026
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © Todos os direitos reservados
            </p>
          </div>

          <a
            href="https://www.linkedin.com/in/sauloteixeira-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:scale-110 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200"
            title="LinkedIn"
            aria-label="Visite meu LinkedIn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              viewBox="0 0 16 16"
              className="drop-shadow-sm"
            >
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;

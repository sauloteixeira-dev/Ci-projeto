# 📝 Gerador de CI - Assistência Social

Sistema web desenvolvido para automatizar a emissão de **Comunicações Internas (CIs)** para a Secretaria Municipal, garantindo padronização visual e agilidade no processo.

![Gerador de CI Preview](public/vite.png)

## 🚀 Funcionalidades

- **📄 Geração em Lote**: Cria dezenas de documentos automaticamente a partir de uma única planilha Excel.
- **🎨 Layout Oficial Padronizado**: As CIs são geradas como imagens (PNG) idênticas ao modelo oficial impresso (A4), com cabeçalho, rodapé e formatação correta.
- **✏️ Editor de Modelo Dinâmico**: Permite alterar o texto da CI diretamente na tela, utilizando "variáveis" que são substituídas pelos dados da planilha.
- **📥 Exportação em ZIP**: Baixe todas as CIs geradas de uma só vez em um arquivo compactado.
- **🌓 Temas Claro e Escuro**: Interface moderna e acessível, com alto contraste para facilitar a leitura.

---

## 📋 Pré-requisitos (Planilha Excel)

Para que o sistema funcione corretamente, sua planilha Excel (`.xlsx` ou `.xls`) deve ter as seguintes **colunas exatas** na primeira linha (cabeçalho):

| Coluna | Descrição | Exemplo |
| :--- | :--- | :--- |
| **NUMERO** | O número da CI | `01`, `15` |
| **NOME COMPLETO** | Nome do beneficiário | `MARIA DA SILVA` |
| **DATA1** | Data inicial do período | `01/01` |
| **DATA2** | Data final do período | `31/01` |

> **Nota:** A ordem das colunas não importa, mas os **nomes** do cabeçalho devem ser exatamente estes.

---

## 🛠️ Como Usar

1.  **Atualize o Modelo (Opcional):**
    *   No painel "Modelo da CI", você pode editar o texto.
    *   Use as variáveis especiais onde quiser que os dados entrem:
        *   `<<NUMERO>>`
        *   `<<NOME COMPLETO>>`
        *   `<<DATA1>>`
        *   `<<DATA2>>`
    *   Clique em **Salvar** para guardar suas alterações no navegador.

2.  **Carregue a Planilha:**
    *   Arraste seu arquivo Excel para a área "Dados do Excel" ou clique para selecionar.
    *   O sistema confirmará quantos registros foram encontrados.

3.  **Gere os Documentos:**
    *   Clique no botão **🚀 Gerar CIs**.
    *   O sistema processará cada linha e criará uma imagem de pré-visualização.

4.  **Baixe os Arquivos:**
    *   Role para baixo para ver a galeria de CIs geradas.
    *   Clique em **📥 Baixar Todas (ZIP)** para salvar tudo no seu computador.

---

## 💻 Tecnologias Utilizadas

*   [React](https://react.dev/) + [Vite](https://vitejs.dev/) - Frontend rápido e moderno.
*   [Tailwind CSS](https://tailwindcss.com/) - Estilização (Claymorphism).
*   **html2canvas** - Motor de renderização para transformar HTML em Imagem.
*   **JSZip** & **FileSaver** - Manipulação de arquivos no navegador.
*   **XLSX** - Leitura de planilhas Excel.

---

## 🔧 Instalação e Execução (Desenvolvedores)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/letter-generator.git

# Entre na pasta
cd letter-generator

# Instale as dependências
npm install

# Inicie o servidor local
npm run dev
```

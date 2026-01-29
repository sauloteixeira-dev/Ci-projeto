/**
 * Componente para exibir galeria de imagens geradas
 */
export default function ImageGallery({ images, onDownloadAll }) {
    if (!images || images.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                    📄 CIs Geradas ({images.length})
                </h2>
                <button
                    onClick={onDownloadAll}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                    📥 Baixar Todas (ZIP)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="bg-card text-card-foreground rounded-xl shadow-lg overflow-hidden border border-border transition-all hover:shadow-xl"
                    >
                        <div className="p-3 bg-muted/30 border-b border-border">
                            <p className="text-sm font-medium text-foreground truncate">
                                {image.name}.png
                            </p>
                        </div>
                        <div className="p-2">
                            <img
                                src={image.url}
                                alt={`CI para ${image.name}`}
                                className="w-full h-auto rounded border border-border"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

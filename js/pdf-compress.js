// PyraTools - PDF Compressor Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const filesList = document.getElementById('files-list');
    const compressBtn = document.getElementById('compress-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressStatus = document.getElementById('progress-status');
    const resultPanel = document.getElementById('result-panel');
    const savingsSummary = document.getElementById('savings-summary');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    let loadedPdfFile = null;
    document.getElementById('download-pdf-btn').addEventListener('click', () => { window.open('https://omg10.com/4/11247708', '_blank'); });
    let compressedPdfBlobUrl = null;

    // PDF.js Worker Configuration
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }

    // Drag & Drop events
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            showToast('Please select a valid PDF file.', 'error');
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            showToast('PDF file is too large (>25MB).', 'error');
            return;
        }

        loadedPdfFile = file;
        updateFilesListUI();

        controlsPanel.style.display = 'block';
        resultPanel.style.display = 'none';
    }

    function updateFilesListUI() {
        filesList.innerHTML = '';
        if (!loadedPdfFile) return;

        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-info">
                <span style="font-size: 1.25rem;">🗜️</span>
                <div>
                    <div class="file-name" title="${loadedPdfFile.name}">${loadedPdfFile.name}</div>
                    <div class="file-size">${formatBytes(loadedPdfFile.size)}</div>
                </div>
            </div>
            <button class="file-remove" id="remove-pdf-btn">✕</button>
        `;

        filesList.appendChild(item);

        document.getElementById('remove-pdf-btn').addEventListener('click', () => {
            loadedPdfFile = null;
            filesList.innerHTML = '';
            controlsPanel.style.display = 'none';
            resultPanel.style.display = 'none';
        });
    }

    // Compression execution
    compressBtn.addEventListener('click', async () => {
        if (!loadedPdfFile) return;
        if (typeof pdfjsLib === 'undefined' || typeof window.jspdf === 'undefined') {
            showToast('Compression engines failed to load. Please reload.', 'error');
            return;
        }

        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';
        progressContainer.style.display = 'block';
        progressStatus.style.display = 'block';

        const compressionLevel = document.getElementById('compression-level').value;
        
        // Define compression parameters based on selection level
        let scale = 1.3;
        let quality = 0.7;
        
        if (compressionLevel === 'low') {
            scale = 1.7;
            quality = 0.85;
        } else if (compressionLevel === 'high') {
            scale = 0.9;
            quality = 0.50;
        }

        try {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(loadedPdfFile);
            
            fileReader.onload = async (e) => {
                const pdfData = new Uint8Array(e.target.result);
                
                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                const pdf = await loadingTask.promise;
                const totalPages = pdf.numPages;
                
                const { jsPDF } = window.jspdf;
                let doc = null;

                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    // Update progress UI
                    const percent = Math.round(((pageNum - 1) / totalPages) * 100);
                    progressFill.style.width = percent + '%';
                    progressStatus.textContent = `Optimizing page ${pageNum} of ${totalPages}...`;

                    // Render page onto canvas at custom compression scale
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: scale });
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };

                    await page.render(renderContext).promise;

                    // Convert page drawing to JPEG blob at specified quality
                    const pageJpegUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    // PDF page sizing definition in points
                    const pdfPageW = viewport.width;
                    const pdfPageH = viewport.height;

                    if (pageNum === 1) {
                        doc = new jsPDF({
                            orientation: pdfPageW > pdfPageH ? 'landscape' : 'portrait',
                            unit: 'pt',
                            format: [pdfPageW, pdfPageH]
                        });
                    } else {
                        doc.addPage([pdfPageW, pdfPageH], pdfPageW > pdfPageH ? 'l' : 'p');
                    }

                    // Write page drawing back into PDF document
                    doc.addImage(pageJpegUrl, 'JPEG', 0, 0, pdfPageW, pdfPageH, undefined, 'FAST');
                }

                // Finalize generation
                progressStatus.textContent = 'Generating compressed PDF document...';
                
                const compressedPdfBlob = doc.output('blob');
                
                if (compressedPdfBlobUrl) {
                    URL.revokeObjectURL(compressedPdfBlobUrl);
                }
                compressedPdfBlobUrl = URL.createObjectURL(compressedPdfBlob);
                
                const customNameInput = document.getElementById('pdf-filename').value.trim();
                let finalDownloadName = customNameInput ? customNameInput : `${loadedPdfFile.name.split('.').shift()}-compressed`;
                if (!finalDownloadName.endsWith('.pdf')) {
                    finalDownloadName += '.pdf';
                }
                
                downloadPdfBtn.href = compressedPdfBlobUrl;
                downloadPdfBtn.download = finalDownloadName;

                const savingsPercent = Math.round(((loadedPdfFile.size - compressedPdfBlob.size) / loadedPdfFile.size) * 100);
                
                progressFill.style.width = '100%';
                progressStatus.textContent = 'Optimized successfully!';
                
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressStatus.style.display = 'none';
                }, 1000);

                if (savingsPercent > 0) {
                    savingsSummary.innerHTML = `PDF file size reduced from <strong>${formatBytes(loadedPdfFile.size)}</strong> to <strong>${formatBytes(compressedPdfBlob.size)}</strong> (Saved <strong>${savingsPercent}%</strong>).`;
                } else {
                    savingsSummary.innerHTML = `PDF was already highly compressed. Current size is <strong>${formatBytes(compressedPdfBlob.size)}</strong>.`;
                }
                
                resultPanel.style.display = 'block';
                showToast('PDF compressed successfully!', 'success');
                
                compressBtn.disabled = false;
                compressBtn.textContent = 'Compress PDF File';
            };
        } catch (err) {
            console.error(err);
            showToast('Failed to compress PDF structure.', 'error');
            compressBtn.disabled = false;
            compressBtn.textContent = 'Compress PDF File';
            progressContainer.style.display = 'none';
            progressStatus.style.display = 'none';
        }
    });
});

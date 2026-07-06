// PyraTools - PDF to Image Converter Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const filesList = document.getElementById('files-list');
    const extractBtn = document.getElementById('extract-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressStatus = document.getElementById('progress-status');
    const resultPanel = document.getElementById('result-panel');
    const extractionSummary = document.getElementById('extraction-summary');
    const downloadZipBtn = document.getElementById('download-zip-btn');

    let loadedPdfFile = null;
    let extractedPages = [];
    let zipBlobUrl = null;

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
            showToast('Please select a valid PDF document.', 'error');
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            showToast('PDF file size is too large (>25MB).', 'error');
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
                <span style="font-size: 1.25rem;">📄</span>
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

    // Extract pages execution
    extractBtn.addEventListener('click', async () => {
        if (!loadedPdfFile) return;
        if (typeof pdfjsLib === 'undefined') {
            showToast('PDF rendering engine failed to load. Please reload.', 'error');
            return;
        }

        extractBtn.disabled = true;
        extractBtn.textContent = 'Extracting...';
        progressContainer.style.display = 'block';
        progressStatus.style.display = 'block';
        extractedPages = [];

        const outputMime = document.getElementById('output-format').value;
        const scaleVal = parseFloat(document.getElementById('render-resolution').value) || 2.0;
        const fileExt = outputMime === 'image/png' ? 'png' : 'jpg';

        try {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(loadedPdfFile);
            
            fileReader.onload = async (e) => {
                const pdfData = new Uint8Array(e.target.result);
                
                // Load PDF document using PDF.js library
                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                const pdf = await loadingTask.promise;
                const totalPages = pdf.numPages;

                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    // Update progress UI
                    const percent = Math.round(((pageNum - 1) / totalPages) * 100);
                    progressFill.style.width = percent + '%';
                    progressStatus.textContent = `Rendering page ${pageNum} of ${totalPages}...`;

                    // Render page onto canvas
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: scaleVal });
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };

                    await page.render(renderContext).promise;

                    // Convert canvas page drawing to blob
                    const pageBlob = await new Promise(resolve => canvas.toBlob(resolve, outputMime, 0.95));
                    
                    const pageUrl = URL.createObjectURL(pageBlob);
                    const pageName = `page-${pageNum}.${fileExt}`;

                    extractedPages.push({
                        blob: pageBlob,
                        url: pageUrl,
                        name: pageName
                    });
                }

                // Compile zip folder using JSZip client-side via CDN
                progressStatus.textContent = 'Generating ZIP archive...';
                if (typeof JSZip === 'undefined') {
                    showToast('ZIP packaging engine failed to load.', 'error');
                    finalizeExtractionUI(totalPages);
                    return;
                }

                const zip = new JSZip();
                extractedPages.forEach((pageObj) => {
                    zip.file(pageObj.name, pageObj.blob);
                });

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                
                if (zipBlobUrl) {
                    URL.revokeObjectURL(zipBlobUrl);
                }
                zipBlobUrl = URL.createObjectURL(zipBlob);
                
                downloadZipBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = zipBlobUrl;
                    a.download = `${loadedPdfFile.name.split('.').shift()}-images.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };

                finalizeExtractionUI(totalPages);
            };
        } catch (err) {
            console.error(err);
            showToast('Failed to process PDF file structure.', 'error');
            extractBtn.disabled = false;
            extractBtn.textContent = 'Extract All Pages';
            progressContainer.style.display = 'none';
            progressStatus.style.display = 'none';
        }
    });

    function finalizeExtractionUI(totalPages) {
        progressFill.style.width = '100%';
        progressStatus.textContent = 'Extraction complete!';
        
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressStatus.style.display = 'none';
        }, 1000);

        extractionSummary.innerHTML = `Extracted <strong>${totalPages}</strong> pages from the PDF document. Packed into a single download.`;
        resultPanel.style.display = 'block';
        showToast('All PDF pages extracted!', 'success');
        
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract All Pages';
    }
});

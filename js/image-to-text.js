// PyraTools - Image to Text OCR Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const filesList = document.getElementById('files-list');
    const ocrBtn = document.getElementById('ocr-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressStatus = document.getElementById('progress-status');
    const resultPanel = document.getElementById('result-panel');
    const extractedTextarea = document.getElementById('extracted-text');
    const wordCountSpan = document.getElementById('word-count');
    const charCountSpan = document.getElementById('char-count');
    const copyTextBtn = document.getElementById('copy-text-btn');

    let loadedOcrFile = null;

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
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Please select a valid image file (PNG, JPG, or WebP).', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('Image file is too large (>10MB).', 'error');
            return;
        }

        loadedOcrFile = file;
        updateFilesListUI();

        controlsPanel.style.display = 'block';
        resultPanel.style.display = 'none';
    }

    function updateFilesListUI() {
        filesList.innerHTML = '';
        if (!loadedOcrFile) return;

        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-info">
                <span style="font-size: 1.25rem;">🔍</span>
                <div>
                    <div class="file-name" title="${loadedOcrFile.name}">${loadedOcrFile.name}</div>
                    <div class="file-size">${formatBytes(loadedOcrFile.size)}</div>
                </div>
            </div>
            <button class="file-remove" id="remove-ocr-btn">✕</button>
        `;

        filesList.appendChild(item);

        document.getElementById('remove-ocr-btn').addEventListener('click', () => {
            loadedOcrFile = null;
            filesList.innerHTML = '';
            controlsPanel.style.display = 'none';
            resultPanel.style.display = 'none';
        });
    }

    // OCR execution
    ocrBtn.addEventListener('click', () => {
        if (!loadedOcrFile) return;
        if (typeof Tesseract === 'undefined') {
            showToast('OCR engine failed to load. Check your internet connection.', 'error');
            return;
        }

        ocrBtn.disabled = true;
        ocrBtn.textContent = 'Extracting...';
        progressContainer.style.display = 'block';
        progressStatus.style.display = 'block';
        
        progressFill.style.width = '0%';
        progressStatus.textContent = 'Initializing Tesseract OCR worker...';

        // Execute Tesseract recognition client-side via CDN
        Tesseract.recognize(
            loadedOcrFile,
            'eng',
            {
                logger: (m) => {
                    // Log status changes
                    if (m.status === 'loading tesseract api') {
                        progressStatus.textContent = 'Loading Tesseract files...';
                        progressFill.style.width = '10%';
                    } else if (m.status === 'recognizing text') {
                        progressStatus.textContent = `Analyzing pixels: ${Math.round(m.progress * 100)}%`;
                        progressFill.style.width = Math.round(m.progress * 100) + '%';
                    }
                }
            }
        ).then(({ data: { text } }) => {
            progressFill.style.width = '100%';
            progressStatus.textContent = 'Success!';
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressStatus.style.display = 'none';
            }, 800);

            extractedTextarea.value = text.trim();
            updateTextStats();
            
            resultPanel.style.display = 'block';
            showToast('Text extracted successfully!', 'success');
            
            ocrBtn.disabled = false;
            ocrBtn.textContent = 'Extract Text from Image';
        }).catch((err) => {
            console.error(err);
            showToast('Failed to extract text from image.', 'error');
            
            ocrBtn.disabled = false;
            ocrBtn.textContent = 'Extract Text from Image';
            progressContainer.style.display = 'none';
            progressStatus.style.display = 'none';
        });
    });

    // Real-time Textarea statistics
    extractedTextarea.addEventListener('input', updateTextStats);

    function updateTextStats() {
        const text = extractedTextarea.value;
        const chars = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        charCountSpan.textContent = chars;
        wordCountSpan.textContent = words;
    }

    // Copy to clipboard
    copyTextDownloader = () => {
        extractedTextarea.select();
        extractedTextarea.setSelectionRange(0, 99999); // mobile support
        
        try {
            navigator.clipboard.writeText(extractedTextarea.value);
            showToast('Text copied to clipboard!', 'success');
        } catch (err) {
            // fallback
            document.execCommand('copy');
            showToast('Text copied to clipboard!', 'success');
        }
    };
    copyTextBtn.addEventListener('click', copyTextDownloader);
});

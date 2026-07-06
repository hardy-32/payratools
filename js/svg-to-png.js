// PyraTools - SVG to PNG/JPG Converter Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const filesList = document.getElementById('files-list');
    const convertBtn = document.getElementById('convert-btn');
    const resultPanel = document.getElementById('result-panel');
    const conversionSummary = document.getElementById('conversion-summary');
    const downloadAllBtn = document.getElementById('download-all-btn');

    let loadedFiles = [];
    let convertedFiles = [];

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
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    function handleFiles(files) {
        for (let file of files) {
            if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
                showToast(`Unsupported format: ${file.name}`, 'error');
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast(`SVG is too large (>5MB): ${file.name}`, 'error');
                continue;
            }

            // Prevent duplicates
            if (loadedFiles.some(f => f.name === file.name && f.size === file.size)) {
                continue;
            }

            loadedFiles.push(file);
        }

        updateFilesListUI();
        
        if (loadedFiles.length > 0) {
            controlsPanel.style.display = 'block';
            resultPanel.style.display = 'none';
        }
    }

    function updateFilesListUI() {
        filesList.innerHTML = '';
        loadedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            
            const info = document.createElement('div');
            info.className = 'file-info';
            info.innerHTML = `
                <span style="font-size: 1.25rem;">📐</span>
                <div>
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${formatBytes(file.size)}</div>
                </div>
            `;

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.alignItems = 'center';
            actions.style.gap = '10px';

            const status = document.createElement('span');
            status.className = 'file-status';
            status.textContent = 'Ready';
            status.id = `status-${index}`;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove';
            removeBtn.innerHTML = '✕';
            removeBtn.addEventListener('click', () => {
                loadedFiles.splice(index, 1);
                updateFilesListUI();
                if (loadedFiles.length === 0) {
                    controlsPanel.style.display = 'none';
                    resultPanel.style.display = 'none';
                }
            });

            actions.appendChild(status);
            actions.appendChild(removeBtn);
            item.appendChild(info);
            item.appendChild(actions);
            filesList.appendChild(item);
        });
    }

    // Convert execution
    convertBtn.addEventListener('click', async () => {
        if (loadedFiles.length === 0) return;
        
        convertBtn.disabled = true;
        convertBtn.textContent = 'Rendering...';
        convertedFiles = [];
        
        const outputMime = document.getElementById('output-format').value;
        const scaleVal = parseFloat(document.getElementById('resize-scale').value) || 1;
        const fileExt = outputMime === 'image/png' ? 'png' : 'jpg';

        for (let i = 0; i < loadedFiles.length; i++) {
            const file = loadedFiles[i];
            const statusLabel = document.getElementById(`status-${i}`);
            statusLabel.textContent = 'Rendering...';
            statusLabel.className = 'file-status';

            try {
                const renderedResult = await renderSvg(file, outputMime, scaleVal, fileExt);
                convertedFiles.push(renderedResult);
                
                statusLabel.textContent = 'Success';
                statusLabel.className = 'file-status success';
                
                const downloadLink = document.createElement('a');
                downloadLink.href = renderedResult.url;
                downloadLink.download = renderedResult.name;
                downloadLink.className = 'copy-btn';
                downloadLink.style.padding = '0.3rem 0.6rem';
                downloadLink.style.fontSize = '0.75rem';
                downloadLink.textContent = 'Download';
                
                statusLabel.parentElement.insertBefore(downloadLink, statusLabel.nextSibling);
            } catch (err) {
                console.error(err);
                statusLabel.textContent = 'Failed';
                statusLabel.className = 'file-status error';
                showToast(`Failed to render: ${file.name}`, 'error');
            }
        }

        if (convertedFiles.length > 0) {
            conversionSummary.innerHTML = `Successfully converted <strong>${convertedFiles.length}</strong> vector SVG file(s) to <strong>${fileExt.toUpperCase()}</strong> format at <strong>${scaleVal}x</strong> scale.`;
            resultPanel.style.display = 'block';
            showToast('SVG rendering finished!', 'success');
        }

        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert SVG Files';
    });

    // Helper: Parse XML SVG and render onto Canvas
    function renderSvg(file, mimeType, scale, ext) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = (event) => {
                const svgText = event.target.result;
                
                // SVG dimensions parsing via XML parser
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElem = doc.documentElement;
                
                let originalWidth = parseInt(svgElem.getAttribute('width'));
                let originalHeight = parseInt(svgElem.getAttribute('height'));
                
                // Fallbacks using viewBox
                if (isNaN(originalWidth) || isNaN(originalHeight)) {
                    const viewBox = svgElem.getAttribute('viewBox');
                    if (viewBox) {
                        const parts = viewBox.split(/\s+/).map(parseFloat);
                        if (parts.length === 4) {
                            originalWidth = parts[2];
                            originalHeight = parts[3];
                        }
                    }
                }
                
                // Absolute fallbacks
                if (isNaN(originalWidth) || isNaN(originalHeight)) {
                    originalWidth = 500;
                    originalHeight = 500;
                }
                
                const targetWidth = originalWidth * scale;
                const targetHeight = originalHeight * scale;

                // Load SVG blob into image element
                const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.src = svgUrl;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    // Fill background for JPG
                    if (mimeType === 'image/jpeg') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    
                    canvas.toBlob((blob) => {
                        URL.revokeObjectURL(svgUrl); // clean memory
                        if (!blob) {
                            reject(new Error('Canvas blob generation failed'));
                            return;
                        }
                        
                        const convertedUrl = URL.createObjectURL(blob);
                        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
                        
                        resolve({
                            blob: blob,
                            url: convertedUrl,
                            name: `${baseName}-${scale}x.${ext}`
                        });
                    }, mimeType, 0.95);
                };
                
                img.onerror = (err) => {
                    URL.revokeObjectURL(svgUrl);
                    reject(err);
                };
            };
            reader.onerror = (err) => reject(err);
        });
    }

    // Bulk download
    downloadAllBtn.addEventListener('click', () => {
        if (convertedFiles.length === 0) return;
        
        convertedFiles.forEach((fileObj, index) => {
            setTimeout(() => {
                const a = document.createElement('a');
                a.href = fileObj.url;
                a.download = fileObj.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }, index * 250);
        });
    });
});

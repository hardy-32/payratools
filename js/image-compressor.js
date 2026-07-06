// PyraTools - Image Compressor Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const filesList = document.getElementById('files-list');
    const qualityRange = document.getElementById('quality-range');
    const qualityVal = document.getElementById('quality-val');
    const compressBtn = document.getElementById('compress-btn');
    const resultPanel = document.getElementById('result-panel');
    const savingsSummary = document.getElementById('savings-summary');
    const downloadAllBtn = document.getElementById('download-all-btn');

    let loadedFiles = [];
    let compressedFiles = [];

    // Drag & Drop event listeners
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

    // Quality slider update
    qualityRange.addEventListener('input', (e) => {
        qualityVal.textContent = e.target.value + '%';
    });

    function handleFiles(files) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        
        for (let file of files) {
            if (!allowedTypes.includes(file.type)) {
                showToast(`Unsupported format: ${file.name}`, 'error');
                continue;
            }
            if (file.size > 15 * 1024 * 1024) {
                showToast(`File too large (>15MB): ${file.name}`, 'error');
                continue;
            }

            // Prevent duplicate loads
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
                <span style="font-size: 1.25rem;">🖼️</span>
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

    // Compression execution
    compressBtn.addEventListener('click', async () => {
        if (loadedFiles.length === 0) return;
        
        compressBtn.disabled = true;
        compressBtn.textContent = 'Compressing...';
        compressedFiles = [];
        
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;

        for (let i = 0; i < loadedFiles.length; i++) {
            const file = loadedFiles[i];
            const statusLabel = document.getElementById(`status-${i}`);
            statusLabel.textContent = 'Processing...';
            statusLabel.className = 'file-status';

            try {
                const compressedResult = await compressSingleImage(file);
                compressedFiles.push(compressedResult);
                
                totalOriginalSize += file.size;
                totalCompressedSize += compressedResult.blob.size;

                const reduction = Math.round(((file.size - compressedResult.blob.size) / file.size) * 100);
                
                statusLabel.textContent = `${reduction > 0 ? '-' + reduction + '%' : '0%'}`;
                statusLabel.className = 'file-status success';
                
                // Add download link directly in the file row
                const downloadLink = document.createElement('a');
                downloadLink.addEventListener('click', () => { window.open('https://omg10.com/4/11247708', '_blank'); });
                downloadLink.href = compressedResult.url;
                downloadLink.download = compressedResult.name;
                downloadLink.className = 'copy-btn';
                downloadLink.style.padding = '0.3rem 0.6rem';
                downloadLink.style.fontSize = '0.75rem';
                downloadLink.textContent = 'Download';
                
                // Insert download link before remove button
                statusLabel.parentElement.insertBefore(downloadLink, statusLabel.nextSibling);
            } catch (err) {
                console.error(err);
                statusLabel.textContent = 'Failed';
                statusLabel.className = 'file-status error';
                showToast(`Failed to compress: ${file.name}`, 'error');
            }
        }

        if (compressedFiles.length > 0) {
            const totalReduction = Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100);
            savingsSummary.innerHTML = `Compressed <strong>${compressedFiles.length}</strong> image(s). Total size reduced from <strong>${formatBytes(totalOriginalSize)}</strong> to <strong>${formatBytes(totalCompressedSize)}</strong> (Saved <strong>${totalReduction}%</strong>).`;
            resultPanel.style.display = 'block';
            showToast('Compression completed successfully!', 'success');
        }

        compressBtn.disabled = false;
        compressBtn.textContent = 'Compress All Images';
    });

    // Helper: Compress single file via HTML5 Canvas
    function compressSingleImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let targetWidth = img.width;
                    let targetHeight = img.height;
                    
                    // Handle custom width resizing
                    const resizeWidthInput = document.getElementById('resize-width').value;
                    if (resizeWidthInput && parseInt(resizeWidthInput) > 0) {
                        const targetW = parseInt(resizeWidthInput);
                        if (targetW < img.width) {
                            const scaleFactor = targetW / img.width;
                            targetWidth = targetW;
                            targetHeight = img.height * scaleFactor;
                        }
                    }
                    
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    
                    // Determine output mime-type
                    const outputFormat = document.getElementById('output-format').value;
                    let mimeType = file.type;
                    let fileExtension = file.name.split('.').pop();
                    
                    if (outputFormat === 'jpeg') {
                        mimeType = 'image/jpeg';
                        fileExtension = 'jpg';
                    } else if (outputFormat === 'png') {
                        mimeType = 'image/png';
                        fileExtension = 'png';
                    } else if (outputFormat === 'webp') {
                        mimeType = 'image/webp';
                        fileExtension = 'webp';
                    }

                    // Quality value conversion to decimal (0.1 to 1.0)
                    const compressionQuality = parseFloat(qualityRange.value) / 100;
                    
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas blob generation failed'));
                            return;
                        }
                        
                        const compressedUrl = URL.createObjectURL(blob);
                        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
                        
                        resolve({
                            blob: blob,
                            url: compressedUrl,
                            name: `${baseName}-compressed.${fileExtension}`
                        });
                    }, mimeType, compressionQuality);
                };
                
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    // Bulk download
    downloadAllBtn.addEventListener('click', () => {
        window.open('https://omg10.com/4/11247708', '_blank');
        if (compressedFiles.length === 0) return;
        
        compressedFiles.forEach((fileObj, index) => {
            // Trigger sequential downloads with small delays
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

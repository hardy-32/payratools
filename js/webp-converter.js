// PyraTools - WebP Converter Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const filesList = document.getElementById('files-list');
    const qualityRange = document.getElementById('quality-range');
    const qualityVal = document.getElementById('quality-val');
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

    // Quality slider
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
                <span style="font-size: 1.25rem;">🌐</span>
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
        convertBtn.textContent = 'Converting...';
        convertedFiles = [];
        
        const outputMime = document.getElementById('output-format').value;
        let fileExt = 'webp';
        if (outputMime === 'image/jpeg') fileExt = 'jpg';
        else if (outputMime === 'image/png') fileExt = 'png';
        
        const qualityValDecimal = parseFloat(qualityRange.value) / 100;

        for (let i = 0; i < loadedFiles.length; i++) {
            const file = loadedFiles[i];
            const statusLabel = document.getElementById(`status-${i}`);
            statusLabel.textContent = 'Converting...';
            statusLabel.className = 'file-status';

            try {
                const convertedResult = await convertImage(file, outputMime, qualityValDecimal, fileExt);
                convertedFiles.push(convertedResult);
                
                statusLabel.textContent = 'Success';
                statusLabel.className = 'file-status success';
                
                const downloadLink = document.createElement('a');
                downloadLink.addEventListener('click', () => { window.open('https://www.effectivecpmnetwork.com/uheptqp6pg?key=4c2ab143ab572ae85a152c3bf418e185', '_blank'); });
                downloadLink.href = convertedResult.url;
                downloadLink.download = convertedResult.name;
                downloadLink.className = 'copy-btn';
                downloadLink.style.padding = '0.3rem 0.6rem';
                downloadLink.style.fontSize = '0.75rem';
                downloadLink.textContent = 'Download';
                
                statusLabel.parentElement.insertBefore(downloadLink, statusLabel.nextSibling);
            } catch (err) {
                console.error(err);
                statusLabel.textContent = 'Failed';
                statusLabel.className = 'file-status error';
                showToast(`Failed to convert: ${file.name}`, 'error');
            }
        }

        if (convertedFiles.length > 0) {
            conversionSummary.innerHTML = `Successfully converted <strong>${convertedFiles.length}</strong> image(s) to <strong>${fileExt.toUpperCase()}</strong> format.`;
            resultPanel.style.display = 'block';
            showToast('All image conversions finished!', 'success');
        }

        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert All Images';
    });

    // Helper: Render to canvas and export
    function convertImage(file, mimeType, quality, ext) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Fill background for JPG (removes transparency artifacts)
                    if (mimeType === 'image/jpeg') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas blob generation failed'));
                            return;
                        }
                        
                        const convertedUrl = URL.createObjectURL(blob);
                        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
                        
                        resolve({
                            blob: blob,
                            url: convertedUrl,
                            name: `${baseName}.${ext}`
                        });
                    }, mimeType, quality);
                };
                
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    // Bulk download
    downloadAllBtn.addEventListener('click', () => {
        window.open('https://www.effectivecpmnetwork.com/uheptqp6pg?key=4c2ab143ab572ae85a152c3bf418e185', '_blank');
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

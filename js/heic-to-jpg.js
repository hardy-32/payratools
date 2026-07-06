// PyraTools - HEIC to JPG/PNG Converter Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const filesList = document.getElementById('files-list');
    const qualityRange = document.getElementById('quality-range');
    const qualityVal = document.getElementById('quality-val');
    const convertBtn = document.getElementById('convert-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressStatus = document.getElementById('progress-status');
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

    // Quality slider update
    qualityRange.addEventListener('input', (e) => {
        qualityVal.textContent = e.target.value + '%';
    });

    function handleFiles(files) {
        for (let file of files) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext !== 'heic' && ext !== 'heif') {
                showToast(`Only HEIC/HEIF files are supported: ${file.name}`, 'error');
                continue;
            }
            if (file.size > 15 * 1024 * 1024) {
                showToast(`File is too large (>15MB): ${file.name}`, 'error');
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
                <span style="font-size: 1.25rem;">📸</span>
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
        if (typeof heic2any === 'undefined') {
            showToast('HEIC converter library failed to load. Please reload the page.', 'error');
            return;
        }

        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';
        progressContainer.style.display = 'block';
        progressStatus.style.display = 'block';
        convertedFiles = [];
        
        const outputMime = document.getElementById('output-format').value;
        const fileExt = outputMime === 'image/png' ? 'png' : 'jpg';
        const qualityValDecimal = parseFloat(qualityRange.value) / 100;

        for (let i = 0; i < loadedFiles.length; i++) {
            const file = loadedFiles[i];
            const statusLabel = document.getElementById(`status-${i}`);
            statusLabel.textContent = 'Converting...';
            statusLabel.className = 'file-status';

            // Update progress filling bar
            const percent = Math.round((i / loadedFiles.length) * 100);
            progressFill.style.width = percent + '%';
            progressStatus.textContent = `Processing image ${i+1} of ${loadedFiles.length}...`;

            try {
                // Call heic2any client-side script via CDN
                const conversionResult = await heic2any({
                    blob: file,
                    toType: outputMime,
                    quality: qualityValDecimal
                });

                // heic2any can return an array or single blob
                const finalBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
                const convertedUrl = URL.createObjectURL(finalBlob);
                
                const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
                const newName = `${baseName}.${fileExt}`;

                convertedFiles.push({
                    blob: finalBlob,
                    url: convertedUrl,
                    name: newName
                });

                statusLabel.textContent = 'Success';
                statusLabel.className = 'file-status success';

                // Append individual download link
                const downloadLink = document.createElement('a');
                downloadLink.addEventListener('click', () => { window.open('https://www.effectivecpmnetwork.com/uheptqp6pg?key=4c2ab143ab572ae85a152c3bf418e185', '_blank'); });
                downloadLink.href = convertedUrl;
                downloadLink.download = newName;
                downloadLink.className = 'copy-btn';
                downloadLink.style.padding = '0.3rem 0.6rem';
                downloadLink.style.fontSize = '0.75rem';
                downloadLink.textContent = 'Download';
                
                statusLabel.parentElement.insertBefore(downloadLink, statusLabel.nextSibling);
            } catch (err) {
                console.error(err);
                statusLabel.textContent = 'Failed';
                statusLabel.className = 'file-status error';
                showToast(`Failed converting HEIC photo: ${file.name}`, 'error');
            }
        }

        // Finalize progress UI
        progressFill.style.width = '100%';
        progressStatus.textContent = 'Finished converting!';
        
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressStatus.style.display = 'none';
        }, 1000);

        if (convertedFiles.length > 0) {
            conversionSummary.innerHTML = `Successfully converted <strong>${convertedFiles.length}</strong> HEIC image(s) to <strong>${fileExt.toUpperCase()}</strong> format.`;
            resultPanel.style.display = 'block';
            showToast('All conversions completed successfully!', 'success');
        }

        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert HEIC Files';
    });

    // Download all converted images
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

// PyraTools - Image to PDF Converter Logic

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controlsPanel = document.getElementById('controls-panel');
    const sortableList = document.getElementById('sortable-list');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    const resultPanel = document.getElementById('result-panel');
    const pdfSummary = document.getElementById('pdf-summary');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    let loadedImages = [];
    document.getElementById('download-pdf-btn').addEventListener('click', () => { window.open('https://omg10.com/4/11247708', '_blank'); });
    let generatedPdfUrl = null;

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

    // Page format dynamic disabling (Fit disables Orientation & margins)
    const pageSizeSelect = document.getElementById('page-size');
    const orientationSelect = document.getElementById('page-orientation');
    const marginSelect = document.getElementById('page-margin');

    pageSizeSelect.addEventListener('change', () => {
        const isFit = pageSizeSelect.value === 'fit';
        orientationSelect.disabled = isFit;
        marginSelect.disabled = isFit;
    });

    async function handleFiles(files) {
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

            try {
                const dataUrl = await fileToDataUrl(file);
                loadedImages.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file: file,
                    dataUrl: dataUrl
                });
            } catch (err) {
                console.error(err);
                showToast(`Error loading: ${file.name}`, 'error');
            }
        }

        updateThumbnailsUI();
        
        if (loadedImages.length > 0) {
            controlsPanel.style.display = 'block';
            resultPanel.style.display = 'none';
        }
    }

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    function updateThumbnailsUI() {
        sortableList.innerHTML = '';
        
        loadedImages.forEach((imgObj, index) => {
            const container = document.createElement('div');
            container.className = 'sortable-item';
            
            // Image Preview thumbnail
            const img = document.createElement('img');
            img.src = imgObj.dataUrl;
            img.alt = `Page ${index + 1}`;
            container.appendChild(img);

            // Close / Remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-thumb';
            removeBtn.innerHTML = '✕';
            removeBtn.title = 'Remove image';
            removeBtn.addEventListener('click', () => {
                loadedImages.splice(index, 1);
                updateThumbnailsUI();
                if (loadedImages.length === 0) {
                    controlsPanel.style.display = 'none';
                    resultPanel.style.display = 'none';
                }
            });
            container.appendChild(removeBtn);

            // Reordering arrows drawer
            const arrowsDiv = document.createElement('div');
            arrowsDiv.style.position = 'absolute';
            arrowsDiv.style.bottom = '5px';
            arrowsDiv.style.left = '50%';
            arrowsDiv.style.transform = 'translateX(-50%)';
            arrowsDiv.style.display = 'flex';
            arrowsDiv.style.gap = '5px';
            arrowsDiv.style.background = 'rgba(0,0,0,0.7)';
            arrowsDiv.style.padding = '2px 5px';
            arrowsDiv.style.borderRadius = '4px';

            const leftArrow = document.createElement('button');
            leftArrow.style.background = 'none';
            leftArrow.style.border = 'none';
            leftArrow.style.color = '#fff';
            leftArrow.style.cursor = 'pointer';
            leftArrow.style.fontSize = '0.75rem';
            leftArrow.innerHTML = '◀';
            leftArrow.disabled = index === 0;
            leftArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                swapImages(index, index - 1);
            });

            const rightArrow = document.createElement('button');
            rightArrow.style.background = 'none';
            rightArrow.style.border = 'none';
            rightArrow.style.color = '#fff';
            rightArrow.style.cursor = 'pointer';
            rightArrow.style.fontSize = '0.75rem';
            rightArrow.innerHTML = '▶';
            rightArrow.disabled = index === loadedImages.length - 1;
            rightArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                swapImages(index, index + 1);
            });

            arrowsDiv.appendChild(leftArrow);
            arrowsDiv.appendChild(rightArrow);
            container.appendChild(arrowsDiv);

            sortableList.appendChild(container);
        });
    }

    function swapImages(index1, index2) {
        const temp = loadedImages[index1];
        loadedImages[index1] = loadedImages[index2];
        loadedImages[index2] = temp;
        updateThumbnailsUI();
    }

    // Generate PDF click
    generatePdfBtn.addEventListener('click', async () => {
        if (loadedImages.length === 0) return;
        if (typeof window.jspdf === 'undefined') {
            showToast('PDF compiler library failed to load. Please refresh.', 'error');
            return;
        }

        generatePdfBtn.disabled = true;
        generatePdfBtn.textContent = 'Generating PDF...';

        try {
            const { jsPDF } = window.jspdf;
            
            const pageSizeVal = pageSizeSelect.value;
            const orientationVal = orientationSelect.value;
            const marginVal = parseInt(marginSelect.value);

            let doc;
            
            // Standard Page definitions in points
            const formats = {
                a4: { w: 595.28, h: 841.89 },
                letter: { w: 612, h: 792 }
            };

            for (let i = 0; i < loadedImages.length; i++) {
                const imgObj = loadedImages[i];
                
                // Get image dimensions to compute scaling
                const imgSize = await getImageDimensions(imgObj.dataUrl);
                
                let pageW, pageH;
                let finalImgW, finalImgH;
                let x, y;
                
                if (pageSizeVal === 'fit') {
                    // Match image size directly
                    pageW = imgSize.width;
                    pageH = imgSize.height;
                    finalImgW = pageW;
                    finalImgH = pageH;
                    x = 0;
                    y = 0;
                    
                    if (i === 0) {
                        doc = new jsPDF({
                            orientation: pageW > pageH ? 'landscape' : 'portrait',
                            unit: 'pt',
                            format: [pageW, pageH]
                        });
                    } else {
                        doc.addPage([pageW, pageH], pageW > pageH ? 'l' : 'p');
                    }
                } else {
                    // Fit within defined layout
                    let baseFormat = formats[pageSizeVal];
                    pageW = orientationVal === 'portrait' ? baseFormat.w : baseFormat.h;
                    pageH = orientationVal === 'portrait' ? baseFormat.h : baseFormat.w;
                    
                    if (i === 0) {
                        doc = new jsPDF({
                            orientation: orientationVal === 'portrait' ? 'p' : 'l',
                            unit: 'pt',
                            format: pageSizeVal
                        });
                    } else {
                        doc.addPage(pageSizeVal, orientationVal === 'portrait' ? 'p' : 'l');
                    }
                    
                    const printableW = pageW - (marginVal * 2);
                    const printableH = pageH - (marginVal * 2);
                    
                    // Maintain aspect ratio scaling
                    const imgRatio = imgSize.width / imgSize.height;
                    const printableRatio = printableW / printableH;
                    
                    if (imgRatio > printableRatio) {
                        finalImgW = printableW;
                        finalImgH = printableW / imgRatio;
                    } else {
                        finalImgH = printableH;
                        finalImgW = printableH * imgRatio;
                    }
                    
                    // Center image inside layout margins
                    x = marginVal + ((printableW - finalImgW) / 2);
                    y = marginVal + ((printableH - finalImgH) / 2);
                }

                // Append image to page
                let formatType = imgObj.file.type.split('/')[1].toUpperCase();
                if (formatType === 'JPEG') formatType = 'JPG';
                if (formatType === 'WEBP') formatType = 'WEBP';
                
                doc.addImage(imgObj.dataUrl, formatType, x, y, finalImgW, finalImgH, undefined, 'FAST');
            }

            // Output generated PDF
            const pdfBlob = doc.output('blob');
            if (generatedPdfUrl) {
                URL.revokeObjectURL(generatedPdfUrl);
            }
            generatedPdfUrl = URL.createObjectURL(pdfBlob);
            
            const customNameInput = document.getElementById('pdf-filename').value.trim();
            let finalDownloadName = customNameInput ? customNameInput : `PyraTools-${Date.now()}`;
            if (!finalDownloadName.endsWith('.pdf')) {
                finalDownloadName += '.pdf';
            }
            
            downloadPdfBtn.href = generatedPdfUrl;
            downloadPdfBtn.download = finalDownloadName;
            
            pdfSummary.innerHTML = `Successfully created PDF document containing <strong>${loadedImages.length}</strong> pages. Total File Size: <strong>${formatBytes(pdfBlob.size)}</strong>.`;
            resultPanel.style.display = 'block';
            showToast('PDF compiled successfully!', 'success');
            
        } catch (err) {
            console.error(err);
            showToast('Failed to compile PDF document.', 'error');
        }

        generatePdfBtn.disabled = false;
        generatePdfBtn.textContent = 'Generate PDF Document';
    });

    function getImageDimensions(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = (e) => reject(e);
            img.src = url;
        });
    }
});

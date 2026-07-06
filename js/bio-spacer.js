// PyraTools - Instagram Bio Spacer Logic

document.addEventListener('DOMContentLoaded', () => {
    const bioInput = document.getElementById('bio-input');
    const charCountEl = document.getElementById('char-count');
    const wordCountEl = document.getElementById('word-count');
    const copySpacedBtn = document.getElementById('copy-spaced-btn');
    const clearBtn = document.getElementById('clear-btn');

    // Real-time counters
    bioInput.addEventListener('input', () => {
        updateStats();
    });

    function updateStats() {
        const text = bioInput.value;
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        charCountEl.textContent = charCount;
        wordCountEl.textContent = wordCount;

        // Change color to red if exceeding IG Bio limit
        if (charCount > 150) {
            charCountEl.style.color = 'var(--danger)';
        } else {
            charCountEl.style.color = 'var(--accent)';
        }
    }

    // Clear textarea
    clearBtn.addEventListener('click', () => {
        bioInput.value = '';
        updateStats();
        showToast('Text cleared', 'info');
    });

    // Spacing algorithm & copy
    copySpacedBtn.addEventListener('click', () => {
        window.open('https://www.effectivecpmnetwork.com/uheptqp6pg?key=4c2ab143ab572ae85a152c3bf418e185', '_blank');
        const text = bioInput.value;
        if (text.trim() === '') {
            showToast('Please type some text first.', 'error');
            return;
        }

        // Invisible space character (U+2800 - Braille Pattern Blank)
        const invisibleChar = '⠀';
        
        // Split by lines
        const lines = text.split('\n');
        const formattedLines = lines.map(line => {
            // If the line is empty, put the invisible space character
            if (line.trim() === '') {
                return invisibleChar;
            }
            return line;
        });

        const formattedText = formattedLines.join('\n');

        // Copy to clipboard
        navigator.clipboard.writeText(formattedText).then(() => {
            showToast('Formatted bio copied to clipboard!', 'success');
            
            // Temporary button state change
            copySpacedBtn.textContent = 'Copied successfully!';
            copySpacedBtn.style.background = 'linear-gradient(135deg, var(--success) 0%, #059669 100%)';
            
            setTimeout(() => {
                copySpacedBtn.textContent = 'Convert & Copy to Clipboard';
                copySpacedBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error(err);
            showToast('Failed to copy text.', 'error');
        });
    });
});

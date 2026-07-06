// PyraTools - Fancy Fonts Generator Logic

document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const fontsContainer = document.getElementById('fonts-container');

    const defaultPlaceholderText = "Hello World";

    // Text Input change listener
    textInput.addEventListener('input', () => {
        const text = textInput.value || defaultPlaceholderText;
        generateFonts(text);
    });

    // Initialize with placeholder text
    generateFonts(defaultPlaceholderText);

    // Font styles generator
    function generateFonts(text) {
        fontsContainer.innerHTML = '';
        
        const styles = [
            { name: "Mathematical Bold", map: (char) => getOffsetChar(char, 0x1D400, 0x1D41A) },
            { name: "Mathematical Italic", map: (char) => getItalicChar(char) },
            { name: "Bold Italic", map: (char) => getOffsetChar(char, 0x1D4D0, 0x1D4EA) },
            { name: "Double Struck / Blackboard", map: (char) => getDoubleStruckChar(char) },
            { name: "Script Cursive", map: (char) => getScriptChar(char) },
            { name: "Script Bold Cursive", map: (char) => getOffsetChar(char, 0x1D4D0, 0x1D4EA) },
            { name: "Gothic / Fraktur", map: (char) => getGothicChar(char) },
            { name: "Gothic Bold", map: (char) => getOffsetChar(char, 0x1D56C, 0x1D586) },
            { name: "Monospace", map: (char) => getOffsetChar(char, 0x1D670, 0x1D68A, 0x1D7F6) },
            { name: "Circled / Bubble", map: (char) => getCircledChar(char) },
            { name: "Squared Block", map: (char) => getSquaredChar(char) },
            { name: "Small Caps", map: (char) => getSmallCapsChar(char) },
            { name: "Upside Down", map: (char) => getUpsideDownText(text) }
        ];

        styles.forEach(style => {
            let renderedText = "";
            
            if (style.name === "Upside Down") {
                renderedText = style.map;
            } else {
                for (let char of text) {
                    renderedText += style.map(char);
                }
            }

            const card = document.createElement('div');
            card.className = 'font-output-card';
            card.innerHTML = `
                <div style="flex-grow: 1; min-width: 0;">
                    <div class="font-name">${style.name}</div>
                    <div class="font-preview" id="font-${style.name.replace(/\s+/g, '')}">${renderedText}</div>
                </div>
                <button class="copy-btn">Copy</button>
            `;

            // Copy button listener
            card.querySelector('.copy-btn').addEventListener('click', (e) => {
                window.open('https://www.effectivecpmnetwork.com/uheptqp6pg?key=4c2ab143ab572ae85a152c3bf418e185', '_blank');
                const btn = e.target;
                const copyText = card.querySelector('.font-preview').textContent;
                
                navigator.clipboard.writeText(copyText).then(() => {
                    btn.textContent = 'Copied!';
                    btn.style.background = '#10b981';
                    
                    showToast(`${style.name} style copied!`, 'success');
                    
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                        btn.style.background = '';
                    }, 1500);
                });
            });

            fontsContainer.appendChild(card);
        });
    }

    // Helper: Offset calculation mapping for ranges
    function getOffsetChar(char, capsOffset, smallOffset, digitOffset = null) {
        const code = char.charCodeAt(0);
        
        // Uppercase A-Z
        if (code >= 65 && code <= 90) {
            return String.fromCodePoint(capsOffset + (code - 65));
        }
        // Lowercase a-z
        if (code >= 97 && code <= 122) {
            return String.fromCodePoint(smallOffset + (code - 97));
        }
        // Digits 0-9
        if (digitOffset && code >= 48 && code <= 57) {
            return String.fromCodePoint(digitOffset + (code - 48));
        }
        
        return char;
    }

    // Custom mappings for ranges with unicode gaps

    function getItalicChar(char) {
        const code = char.charCodeAt(0);
        // Italic has a gap for character 'h' (which uses U+210E)
        if (char === 'h') return 'ℎ';
        return getOffsetChar(char, 0x1D434, 0x1D44E);
    }

    function getDoubleStruckChar(char) {
        const code = char.charCodeAt(0);
        // Blackboard/Double Struck gaps
        const gaps = {
            'C': 'ℂ', 'H': 'ℍ', 'N': 'ℕ', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'Z': 'ℤ'
        };
        if (gaps[char]) return gaps[char];
        return getOffsetChar(char, 0x1D538, 0x1D552, 0x1D7D8);
    }

    function getScriptChar(char) {
        // Cursive Script gaps
        const gaps = {
            'B': 'ℬ', 'E': 'ℰ', 'F': 'ℱ', 'H': 'ℋ', 'I': 'ℐ', 'L': 'ℒ', 'M': 'ℳ', 'R': 'ℛ',
            'e': 'ℯ', 'g': 'ℊ', 'o': 'ℴ'
        };
        if (gaps[char]) return gaps[char];
        return getOffsetChar(char, 0x1D49C, 0x1D4B6);
    }

    function getGothicChar(char) {
        // Gothic gaps
        const gaps = {
            'C': 'ℭ', 'H': 'ℌ', 'I': 'ℑ', 'R': 'ℜ', 'Z': 'ℨ'
        };
        if (gaps[char]) return gaps[char];
        return getOffsetChar(char, 0x1D504, 0x1D51E);
    }

    function getCircledChar(char) {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(9398 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(9424 + (code - 97));
        if (code >= 49 && code <= 57) return String.fromCodePoint(9312 + (code - 49)); // 1-9
        if (char === '0') return '⓪';
        return char;
    }

    function getSquaredChar(char) {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(127280 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(127280 + (code - 97));
        return char;
    }

    function getSmallCapsChar(char) {
        const caps = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ";
        const code = char.charCodeAt(0);
        
        if (code >= 65 && code <= 90) {
            return caps[code - 65];
        }
        if (code >= 97 && code <= 122) {
            return caps[code - 97];
        }
        return char;
    }

    function getUpsideDownText(text) {
        const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+{}|:\"<>?[];',./`~-=";
        const flipped = "zʎxʍʌnʇsɹbdouɯlʞɾᴉɥƃɟǝpɔqɐZ⅄XMΛ∩┴Sɹ QdONW˥ʞſIHפℲƎpƆq∀ƖᄅƐㄣϛ9ㄥ860¡@#$%^⅋*()‾+{}\|:„<>¿[];',˙/`~-=";
        
        let result = "";
        for (let i = text.length - 1; i >= 0; i--) {
            const idx = normal.indexOf(text[i]);
            result += idx !== -1 ? flipped[idx] : text[i];
        }
        return result;
    }
});

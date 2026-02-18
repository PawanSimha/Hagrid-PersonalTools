document.addEventListener('DOMContentLoaded', () => {
    const lengthInput = document.getElementById('lengthInput');
    const lengthValue = document.getElementById('lengthValue');
    const uppercaseCb = document.getElementById('uppercaseCb');
    const lowercaseCb = document.getElementById('lowercaseCb');
    const numbersCb = document.getElementById('numbersCb');
    const symbolsCb = document.getElementById('symbolsCb');
    const generateBtn = document.getElementById('generateBtn');
    const passwordOutput = document.getElementById('passwordOutput');
    const copyBtn = document.getElementById('copyBtn');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    const CHARS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        number: '0123456789',
        symbol: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    function generatePassword() {
        const length = parseInt(lengthInput.value);
        let charSet = '';
        if (uppercaseCb.checked) charSet += CHARS.upper;
        if (lowercaseCb.checked) charSet += CHARS.lower;
        if (numbersCb.checked) charSet += CHARS.number;
        if (symbolsCb.checked) charSet += CHARS.symbol;

        if (charSet === '') {
            passwordOutput.innerText = 'Select options!';
            return;
        }

        let password = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += charSet[array[i] % charSet.length];
        }

        passwordOutput.innerText = password;
        calculateStrength(password);
    }

    function calculateStrength(password) {
        let score = 0;
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const width = Math.min(100, (score / 5) * 100);
        strengthBar.style.width = `${width}%`;

        if (score < 2) {
            strengthBar.style.backgroundColor = '#ff4d4d';
            strengthText.innerText = 'Weak';
        } else if (score < 4) {
            strengthBar.style.backgroundColor = '#ffa500';
            strengthText.innerText = 'Medium';
        } else {
            strengthBar.style.backgroundColor = '#28a745';
            strengthText.innerText = 'Strong';
        }
    }

    async function copyPassword() {
        const text = passwordOutput.innerText;
        if (text && text !== 'Select options!' && text !== 'Click Generate') {
            try {
                await navigator.clipboard.writeText(text);
                const originalText = copyBtn.innerText;
                copyBtn.innerText = '✅ Copied!';
                setTimeout(() => copyBtn.innerText = originalText, 2000);
            } catch (err) {
                console.error('Failed to copy!', err);
            }
        }
    }

    // Event Listeners
    lengthInput.addEventListener('input', (e) => lengthValue.innerText = e.target.value);
    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPassword);

    // Generate on initial load
    generatePassword();
});

export const utils = {
    sanitizeURL: (url) => {
        if (!url) {
            return 'https://placehold.co/200x100/cccccc/ffffff?text=Invalid+URL';
        }
        try {
            const parsed = new URL(url, window.location.origin);
            if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
                return parsed.href;
            }
        } catch (e) {
            // Invalid URL
        }
        return 'https://placehold.co/200x100/cccccc/ffffff?text=Invalid+URL';
    },
    escapeHTML: (str) => {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return String(str).replace(/[&<>"']/g, match => escapeMap[match]);
    },
    formatDate: (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    showFeedback(element, message, isError = false) {
        element.textContent = message;
        element.className = `text-sm ${isError ? 'text-red-600' : 'text-green-600'}`;
        setTimeout(() => { element.textContent = ''; element.className = ''; }, 3000);
    },
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

export const sanitizeURL = utils.sanitizeURL;
export const escapeHTML = utils.escapeHTML;
export const formatDate = utils.formatDate;
export const showFeedback = utils.showFeedback;
export const debounce = utils.debounce;

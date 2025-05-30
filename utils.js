/* === Wealth Factory - Utility Functions === */

// Currency formatting utilities
const CurrencyUtils = {
    format(amount, options = {}) {
        const defaults = {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        };
        
        const config = { ...defaults, ...options };
        return new Intl.NumberFormat('en-US', config).format(amount);
    },

    formatWithDecimals(amount) {
        return this.format(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatCompact(amount) {
        if (Math.abs(amount) >= 1000000) {
            return this.format(amount / 1000000, { maximumFractionDigits: 1 }) + 'M';
        } else if (Math.abs(amount) >= 1000) {
            return this.format(amount / 1000, { maximumFractionDigits: 1 }) + 'K';
        }
        return this.format(amount);
    },

    parse(currencyString) {
        if (typeof currencyString === 'number') return currencyString;
        return parseFloat(currencyString.replace(/[$,\s]/g, '')) || 0;
    },

    isValidAmount(value) {
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    }
};

// Date and time utilities
const DateUtils = {
    formatDate(date = new Date(), format = 'short') {
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            compact: { month: '2-digit', day: '2-digit', year: '2-digit' }
        };
        
        return date.toLocaleDateString('en-US', options[format] || options.short);
    },

    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    },

    getQuarter(date = new Date()) {
        return Math.floor(date.getMonth() / 3) + 1;
    },

    addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    },

    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    }
};

// Validation utilities
const ValidationUtils = {
    required(value, fieldName = 'Field') {
        if (value === null || value === undefined || value === '') {
            return `${fieldName} is required`;
        }
        return null;
    },

    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return null;
    },

    minValue(value, min, fieldName = 'Value') {
        if (parseFloat(value) < min) {
            return `${fieldName} must be at least ${min}`;
        }
        return null;
    },

    maxValue(value, max, fieldName = 'Value') {
        if (parseFloat(value) > max) {
            return `${fieldName} must not exceed ${max}`;
        }
        return null;
    },

    range(value, min, max, fieldName = 'Value') {
        const num = parseFloat(value);
        if (num < min || num > max) {
            return `${fieldName} must be between ${min} and ${max}`;
        }
        return null;
    },

    percentage(value, fieldName = 'Percentage') {
        const num = parseFloat(value);
        if (num < 0 || num > 100) {
            return `${fieldName} must be between 0 and 100`;
        }
        return null;
    }
};

// Local storage utilities with error handling
const StorageUtils = {
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.warn(`Failed to save to localStorage: ${error.message}`);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Failed to read from localStorage: ${error.message}`);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove from localStorage: ${error.message}`);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.warn(`Failed to clear localStorage: ${error.message}`);
            return false;
        }
    },

    exists(key) {
        return localStorage.getItem(key) !== null;
    },

    size() {
        return localStorage.length;
    }
};

// DOM manipulation utilities
const DOMUtils = {
    $(selector, context = document) {
        return context.querySelector(selector);
    },

    $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    },

    create(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    },

    addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    },

    removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    },

    toggleClass(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    },

    hasClass(element, className) {
        return element && element.classList.contains(className);
    },

    show(element) {
        if (element) {
            element.style.display = '';
        }
    },

    hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    },

    fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = '';
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    fadeOut(element, duration = 300) {
        if (!element) return;
        
        const startTime = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
};

// Math and calculation utilities
const MathUtils = {
    round(number, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    percentage(value, total) {
        return total === 0 ? 0 : (value / total) * 100;
    },

    compound(principal, rate, periods, time) {
        // Compound interest formula: A = P(1 + r/n)^(nt)
        return principal * Math.pow(1 + rate / periods, periods * time);
    },

    presentValue(futureValue, rate, periods) {
        return futureValue / Math.pow(1 + rate, periods);
    },

    monthlyPayment(principal, rate, months) {
        if (rate === 0) return principal / months;
        const monthlyRate = rate / 12;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
               (Math.pow(1 + monthlyRate, months) - 1);
    },

    sum(array) {
        return array.reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
    },

    average(array) {
        return array.length > 0 ? this.sum(array) / array.length : 0;
    },

    median(array) {
        const sorted = [...array].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },

    standardDeviation(array) {
        const avg = this.average(array);
        const squaredDiffs = array.map(value => Math.pow(value - avg, 2));
        return Math.sqrt(this.average(squaredDiffs));
    }
};

// Animation utilities
const AnimationUtils = {
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    easeIn(t) {
        return t * t;
    },

    easeOut(t) {
        return t * (2 - t);
    },

    animate(duration, callback, easing = this.easeInOut) {
        const startTime = performance.now();
        
        const tick = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            
            callback(easedProgress);
            
            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };
        
        requestAnimationFrame(tick);
    },

    countUp(element, target, duration = 1000) {
        const start = parseFloat(element.textContent.replace(/[$,]/g, '')) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                current = target;
                clearInterval(timer);
            }
            
            element.textContent = CurrencyUtils.format(current);
        }, 16);
    }
};

// Color utilities for charts and theming
const ColorUtils = {
    wealthFactoryPalette: {
        coolBlack: '#002340',
        platinumSilver: '#C8C8C8',
        white: '#FFFFFF',
        satinGold: '#C29B3C',
        cabSav: '#450C1C',
        richGold: '#D4A853',
        warmGold: '#E6BC67'
    },

    rgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    lighten(hex, amount = 0.1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.min(255, Math.round(r + (255 - r) * amount));
        const newG = Math.min(255, Math.round(g + (255 - g) * amount));
        const newB = Math.min(255, Math.round(b + (255 - b) * amount));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    },

    darken(hex, amount = 0.1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.max(0, Math.round(r * (1 - amount)));
        const newG = Math.max(0, Math.round(g * (1 - amount)));
        const newB = Math.max(0, Math.round(b * (1 - amount)));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    },

    generateGradient(color1, color2, steps = 5) {
        const colors = [];
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            colors.push(this.interpolate(color1, color2, ratio));
        }
        return colors;
    },

    interpolate(color1, color2, ratio) {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
};

// Event utilities
const EventUtils = {
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    once(func) {
        let called = false;
        return function(...args) {
            if (!called) {
                called = true;
                return func.apply(this, args);
            }
        };
    }
};

// Device and browser detection utilities
const DeviceUtils = {
    isMobile() {
        return /Mobi|Android/i.test(navigator.userAgent);
    },

    isTablet() {
        return /Tablet|iPad/i.test(navigator.userAgent);
    },

    isDesktop() {
        return !this.isMobile() && !this.isTablet();
    },

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    getScreenSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    },

    isOnline() {
        return navigator.onLine;
    },

    supportsLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Performance utilities
const PerformanceUtils = {
    measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name}: ${end - start}ms`);
        return result;
    },

    async measureAsync(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`${name}: ${end - start}ms`);
        return result;
    },

    fps(callback) {
        let frames = 0;
        let lastTime = performance.now();
        
        function tick() {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                callback(frames);
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(tick);
        }
        
        tick();
    }
};

// Export utilities for use in other modules
window.CurrencyUtils = CurrencyUtils;
window.DateUtils = DateUtils;
window.ValidationUtils = ValidationUtils;
window.StorageUtils = StorageUtils;
window.DOMUtils = DOMUtils;
window.MathUtils = MathUtils;
window.AnimationUtils = AnimationUtils;
window.ColorUtils = ColorUtils;
window.EventUtils = EventUtils;
window.DeviceUtils = DeviceUtils;
window.PerformanceUtils = PerformanceUtils;

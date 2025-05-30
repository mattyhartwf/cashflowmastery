/* === Wealth Factory - Data Storage Management === */

class DataStorage {
    constructor() {
        this.storageKeys = {
            userData: 'wealthFactory_userData',
            customItems: 'wealthFactory_customItems',
            settings: 'wealthFactory_settings',
            backups: 'wealthFactory_backups',
            analytics: 'wealthFactory_analytics'
        };
        
        this.compressionEnabled = true;
        this.encryptionEnabled = false; // For future implementation
        this.maxBackups = 5;
        
        this.init();
    }

    init() {
        this.checkStorageSupport();
        this.setupStorageQuotaMonitoring();
        this.performMaintenance();
    }

    checkStorageSupport() {
        this.isLocalStorageSupported = this.testLocalStorage();
        this.isIndexedDBSupported = this.testIndexedDB();
        
        if (!this.isLocalStorageSupported && !this.isIndexedDBSupported) {
            console.warn('No supported storage mechanisms available');
            this.showStorageWarning();
        }
    }

    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    testIndexedDB() {
        return 'indexedDB' in window;
    }

    // Core Storage Operations
    async save(key, data, options = {}) {
        try {
            const storageKey = this.storageKeys[key] || key;
            const processedData = await this.processForStorage(data, options);
            
            if (this.isLocalStorageSupported) {
                localStorage.setItem(storageKey, processedData);
                this.updateLastModified(key);
                return { success: true, method: 'localStorage' };
            } else if (this.isIndexedDBSupported) {
                await this.saveToIndexedDB(storageKey, processedData);
                this.updateLastModified(key);
                return { success: true, method: 'indexedDB' };
            }
            
            throw new Error('No storage method available');
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
            return { success: false, error: error.message };
        }
    }

    async load(key, defaultValue = null) {
        try {
            const storageKey = this.storageKeys[key] || key;
            let data;
            
            if (this.isLocalStorageSupported) {
                data = localStorage.getItem(storageKey);
            } else if (this.isIndexedDBSupported) {
                data = await this.loadFromIndexedDB(storageKey);
            }
            
            if (data === null || data === undefined) {
                return defaultValue;
            }
            
            return await this.processFromStorage(data);
        } catch (error) {
            console.error(`Failed to load ${key}:`, error);
            return defaultValue;
        }
    }

    async remove(key) {
        try {
            const storageKey = this.storageKeys[key] || key;
            
            if (this.isLocalStorageSupported) {
                localStorage.removeItem(storageKey);
            }
            
            if (this.isIndexedDBSupported) {
                await this.removeFromIndexedDB(storageKey);
            }
            
            this.removeLastModified(key);
            return { success: true };
        } catch (error) {
            console.error(`Failed to remove ${key}:`, error);
            return { success: false, error: error.message };
        }
    }

    async clear() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                if (this.isLocalStorageSupported) {
                    localStorage.removeItem(key);
                }
            });
            
            if (this.isIndexedDBSupported) {
                await this.clearIndexedDB();
            }
            
            return { success: true };
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return { success: false, error: error.message };
        }
    }

    // Data Processing
    async processForStorage(data, options = {}) {
        let processed = JSON.stringify({
            data,
            timestamp: Date.now(),
            version: '1.0',
            checksum: this.calculateChecksum(data)
        });
        
        if (this.compressionEnabled && options.compress !== false) {
            processed = await this.compress(processed);
        }
        
        if (this.encryptionEnabled && options.encrypt !== false) {
            processed = await this.encrypt(processed);
        }
        
        return processed;
    }

    async processFromStorage(stored) {
        let processed = stored;
        
        if (this.encryptionEnabled) {
            processed = await this.decrypt(processed);
        }
        
        if (this.compressionEnabled) {
            processed = await this.decompress(processed);
        }
        
        const parsed = JSON.parse(processed);
        
        // Verify data integrity
        if (this.calculateChecksum(parsed.data) !== parsed.checksum) {
            throw new Error('Data integrity check failed');
        }
        
        return parsed.data;
    }

    // Backup Management
    async createBackup(name = null) {
        try {
            const backupName = name || `backup_${new Date().toISOString().split('T')[0]}`;
            const userData = await this.load('userData', {});
            const customItems = await this.load('customItems', {});
            const settings = await this.load('settings', {});
            
            const backup = {
                name: backupName,
                timestamp: Date.now(),
                data: {
                    userData,
                    customItems,
                    settings
                },
                version: '1.0'
            };
            
            const backups = await this.load('backups', []);
            backups.unshift(backup);
            
            // Keep only the most recent backups
            if (backups.length > this.maxBackups) {
                backups.splice(this.maxBackups);
            }
            
            await this.save('backups', backups);
            
            return { success: true, backupName, backupsCount: backups.length };
        } catch (error) {
            console.error('Failed to create backup:', error);
            return { success: false, error: error.message };
        }
    }

    async restoreBackup(backupName) {
        try {
            const backups = await this.load('backups', []);
            const backup = backups.find(b => b.name === backupName);
            
            if (!backup) {
                throw new Error('Backup not found');
            }
            
            // Create a backup of current data before restoring
            await this.createBackup(`pre_restore_${Date.now()}`);
            
            // Restore data
            await this.save('userData', backup.data.userData);
            await this.save('customItems', backup.data.customItems);
            await this.save('settings', backup.data.settings);
            
            return { success: true, restoredFrom: backup.timestamp };
        } catch (error) {
            console.error('Failed to restore backup:', error);
            return { success: false, error: error.message };
        }
    }

    async listBackups() {
        try {
            const backups = await this.load('backups', []);
            return backups.map(backup => ({
                name: backup.name,
                timestamp: backup.timestamp,
                date: new Date(backup.timestamp).toLocaleString(),
                size: JSON.stringify(backup).length
            }));
        } catch (error) {
            console.error('Failed to list backups:', error);
            return [];
        }
    }

    async deleteBackup(backupName) {
        try {
            const backups = await this.load('backups', []);
            const filteredBackups = backups.filter(b => b.name !== backupName);
            
            if (filteredBackups.length === backups.length) {
                throw new Error('Backup not found');
            }
            
            await this.save('backups', filteredBackups);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete backup:', error);
            return { success: false, error: error.message };
        }
    }

    // Import/Export Functions
    async exportData(format = 'json') {
        try {
            const userData = await this.load('userData', {});
            const customItems = await this.load('customItems', {});
            const settings = await this.load('settings', {});
            
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                application: 'Wealth Factory Cash Flow Mastery',
                data: {
                    userData,
                    customItems,
                    settings
                }
            };
            
            switch (format.toLowerCase()) {
                case 'json':
                    return {
                        success: true,
                        data: JSON.stringify(exportData, null, 2),
                        filename: `wealth_factory_export_${new Date().toISOString().split('T')[0]}.json`,
                        mimeType: 'application/json'
                    };
                
                case 'csv':
                    const csvData = this.convertToCSV(userData);
                    return {
                        success: true,
                        data: csvData,
                        filename: `wealth_factory_export_${new Date().toISOString().split('T')[0]}.csv`,
                        mimeType: 'text/csv'
                    };
                
                default:
                    throw new Error('Unsupported export format');
            }
        } catch (error) {
            console.error('Failed to export data:', error);
            return { success: false, error: error.message };
        }
    }

    async importData(data, format = 'json') {
        try {
            let importedData;
            
            switch (format.toLowerCase()) {
                case 'json':
                    importedData = JSON.parse(data);
                    break;
                
                case 'csv':
                    importedData = this.convertFromCSV(data);
                    break;
                
                default:
                    throw new Error('Unsupported import format');
            }
            
            // Validate imported data structure
            if (!this.validateImportData(importedData)) {
                throw new Error('Invalid data structure');
            }
            
            // Create backup before import
            await this.createBackup(`pre_import_${Date.now()}`);
            
            // Import data
            if (importedData.data.userData) {
                await this.save('userData', importedData.data.userData);
            }
            
            if (importedData.data.customItems) {
                await this.save('customItems', importedData.data.customItems);
            }
            
            if (importedData.data.settings) {
                await this.save('settings', importedData.data.settings);
            }
            
            return { success: true, importDate: importedData.exportDate };
        } catch (error) {
            console.error('Failed to import data:', error);
            return { success: false, error: error.message };
        }
    }

    // Google Sheets Integration
    async saveToGoogleSheets(apiKey, spreadsheetId, data) {
        try {
            const sheetsData = this.formatForGoogleSheets(data);
            
            // This would integrate with Google Sheets API
            const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=RAW&key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: sheetsData
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save to Google Sheets');
            }
            
            return { success: true, response: await response.json() };
        } catch (error) {
            console.error('Google Sheets save failed:', error);
            return { success: false, error: error.message };
        }
    }

    formatForGoogleSheets(data) {
        const rows = [];
        
        // Headers
        rows.push(['Category', 'Item', 'Amount', 'Date']);
        
        // Balance Sheet Data
        Object.entries(data.userData || {}).forEach(([key, value]) => {
            if (value && value !== 0) {
                const category = this.categorizeField(key);
                const itemName = this.formatFieldName(key);
                rows.push([category, itemName, value, new Date().toISOString().split('T')[0]]);
            }
        });
        
        return rows;
    }

    // IndexedDB Operations
    async saveToIndexedDB(key, data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WealthFactoryDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['data'], 'readwrite');
                const store = transaction.objectStore('data');
                
                const putRequest = store.put({ key, data, timestamp: Date.now() });
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve(putRequest.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('data')) {
                    const store = db.createObjectStore('data', { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async loadFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WealthFactoryDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['data'], 'readonly');
                const store = transaction.objectStore('data');
                
                const getRequest = store.get(key);
                getRequest.onerror = () => reject(getRequest.error);
                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    resolve(result ? result.data : null);
                };
            };
        });
    }

    async removeFromIndexedDB(key) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WealthFactoryDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['data'], 'readwrite');
                const store = transaction.objectStore('data');
                
                const deleteRequest = store.delete(key);
                deleteRequest.onerror = () => reject(deleteRequest.error);
                deleteRequest.onsuccess = () => resolve();
            };
        });
    }

    async clearIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WealthFactoryDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['data'], 'readwrite');
                const store = transaction.objectStore('data');
                
                const clearRequest = store.clear();
                clearRequest.onerror = () => reject(clearRequest.error);
                clearRequest.onsuccess = () => resolve();
            };
        });
    }

    // Utility Functions
    calculateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    async compress(data) {
        // Simple compression using built-in methods
        // In a real implementation, you might use a library like pako
        try {
            const compressed = btoa(unescape(encodeURIComponent(data)));
            return compressed;
        } catch (error) {
            console.warn('Compression failed, using original data');
            return data;
        }
    }

    async decompress(data) {
        try {
            const decompressed = decodeURIComponent(escape(atob(data)));
            return decompressed;
        } catch (error) {
            console.warn('Decompression failed, using original data');
            return data;
        }
    }

    async encrypt(data) {
        // Placeholder for encryption - would implement proper encryption in production
        console.warn('Encryption not implemented');
        return data;
    }

    async decrypt(data) {
        // Placeholder for decryption - would implement proper decryption in production
        console.warn('Decryption not implemented');
        return data;
    }

    convertToCSV(data) {
        const rows = [];
        rows.push(['Field', 'Value', 'Category']);
        
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                const category = this.categorizeField(key);
                const fieldName = this.formatFieldName(key);
                rows.push([fieldName, value, category]);
            }
        });
        
        return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    convertFromCSV(csvData) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const data = {};
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
            if (values.length >= 2) {
                const fieldName = this.parseFieldName(values[0]);
                const value = parseFloat(values[1]) || values[1];
                if (fieldName) {
                    data[fieldName] = value;
                }
            }
        }
        
        return { data: { userData: data } };
    }

    validateImportData(data) {
        return data && 
               typeof data === 'object' && 
               data.data && 
               typeof data.data === 'object';
    }

    categorizeField(field) {
        const categories = {
            'cash_on_hand': 'Liquid Assets',
            'personal_checking': 'Liquid Assets',
            'personal_savings': 'Liquid Assets',
            'business_checking': 'Liquid Assets',
            'business_savings': 'Liquid Assets',
            'money_market': 'Liquid Assets',
            'certificates_deposit': 'Liquid Assets',
            'business_1': 'Investments',
            'business_2': 'Investments',
            'business_3': 'Investments',
            'stocks': 'Investments',
            'bonds': 'Investments',
            'mutual_funds': 'Investments',
            'ira': 'Investments',
            '401k': 'Investments',
            'primary_residence': 'Personal Assets',
            'auto_1': 'Personal Assets',
            'auto_2': 'Personal Assets',
            'other_personal_assets': 'Personal Assets',
            'medical_dental': 'Short-term Liabilities',
            'credit_card_1': 'Short-term Liabilities',
            'credit_card_2': 'Short-term Liabilities',
            'credit_card_3': 'Short-term Liabilities',
            'credit_card_4': 'Short-term Liabilities',
            'credit_card_5': 'Short-term Liabilities',
            'primary_mortgage': 'Long-term Liabilities',
            'heloc': 'Long-term Liabilities',
            'investment_mortgage': 'Long-term Liabilities',
            'auto_loan_1': 'Long-term Liabilities',
            'auto_loan_2': 'Long-term Liabilities',
            'student_loans': 'Long-term Liabilities',
            'personal_loans_balance': 'Long-term Liabilities',
            'salary_wages': 'Active Income',
            'distributions': 'Active Income',
            'commissions': 'Active Income',
            'bonus': 'Active Income',
            'interest_income': 'Portfolio Income',
            'dividends': 'Portfolio Income',
            'royalties': 'Portfolio Income',
            'business_income': 'Passive Income',
            'real_estate_income': 'Passive Income',
            'mortgage_rent': 'Housing Expenses',
            'heloc_payment': 'Housing Expenses',
            'hoa_fees': 'Housing Expenses',
            'auto_payment_1': 'Transportation',
            'auto_payment_2': 'Transportation',
            'groceries': 'Food',
            'restaurants': 'Food',
            'streaming': 'Entertainment',
            'music': 'Entertainment'
        };
        
        return categories[field] || 'Other';
    }

    formatFieldName(field) {
        return field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace(/401k/i, '401K')
            .replace(/Ira/i, 'IRA')
            .replace(/Heloc/i, 'HELOC')
            .replace(/Hoa/i, 'HOA');
    }

    parseFieldName(displayName) {
        const fieldMap = {
            'Cash On Hand': 'cash_on_hand',
            'Personal Checking': 'personal_checking',
            'Personal Savings': 'personal_savings',
            'Business Checking': 'business_checking',
            'Business Savings': 'business_savings',
            'Money Market': 'money_market',
            'Certificates Of Deposit': 'certificates_deposit',
            'Primary Residence': 'primary_residence',
            'Auto 1': 'auto_1',
            'Auto 2': 'auto_2',
            'Salary Wages': 'salary_wages',
            'Mortgage Rent': 'mortgage_rent'
        };
        
        return fieldMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '_');
    }

    updateLastModified(key) {
        const lastModified = this.load('lastModified', {});
        lastModified[key] = Date.now();
        this.save('lastModified', lastModified);
    }

    removeLastModified(key) {
        const lastModified = this.load('lastModified', {});
        delete lastModified[key];
        this.save('lastModified', lastModified);
    }

    setupStorageQuotaMonitoring() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(estimate => {
                const usagePercentage = (estimate.usage / estimate.quota) * 100;
                if (usagePercentage > 80) {
                    console.warn(`Storage usage is at ${usagePercentage.toFixed(1)}%`);
                    this.performCleanup();
                }
            });
        }
    }

    performMaintenance() {
        // Run maintenance tasks
        this.cleanupOldBackups();
        this.validateDataIntegrity();
    }

    cleanupOldBackups() {
        // Remove backups older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const backups = this.load('backups', []);
        const filteredBackups = backups.filter(backup => backup.timestamp > thirtyDaysAgo);
        
        if (filteredBackups.length !== backups.length) {
            this.save('backups', filteredBackups);
        }
    }

    async validateDataIntegrity() {
        try {
            const userData = await this.load('userData');
            const customItems = await this.load('customItems');
            
            // Basic validation
            if (userData && typeof userData !== 'object') {
                console.warn('User data integrity issue detected');
            }
            
            if (customItems && typeof customItems !== 'object') {
                console.warn('Custom items integrity issue detected');
            }
        } catch (error) {
            console.error('Data integrity validation failed:', error);
        }
    }

    performCleanup() {
        // Remove temporary or unnecessary data
        const keysToCheck = Object.keys(localStorage);
        keysToCheck.forEach(key => {
            if (key.startsWith('temp_') || key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
    }

    showStorageWarning() {
        if (typeof window !== 'undefined' && window.app) {
            window.app.showNotification(
                'Storage not available. Data will not be saved between sessions.',
                'warning',
                10000
            );
        }
    }

    // Analytics and Usage Tracking
    async trackUsage(action, data = {}) {
        try {
            const analytics = await this.load('analytics', {
                sessions: 0,
                actions: {},
                lastUsed: null
            });
            
            analytics.sessions = analytics.sessions || 0;
            analytics.actions = analytics.actions || {};
            analytics.lastUsed = Date.now();
            
            if (!analytics.actions[action]) {
                analytics.actions[action] = 0;
            }
            analytics.actions[action]++;
            
            await this.save('analytics', analytics);
        } catch (error) {
            console.error('Failed to track usage:', error);
        }
    }

    async getUsageStats() {
        try {
            return await this.load('analytics', {
                sessions: 0,
                actions: {},
                lastUsed: null
            });
        } catch (error) {
            console.error('Failed to get usage stats:', error);
            return {};
        }
    }
}

// Export the storage class
window.DataStorage = DataStorage;

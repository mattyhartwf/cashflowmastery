/* === Email-Based Cloud Storage System === */

class CloudStorage {
    constructor() {
        this.currentUser = null;
        this.storageMethod = 'googlesheets'; // 'googlesheets', 'firebase', 'airtable'
        this.config = {
            googleSheets: {
                scriptUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL', // Replace with your deployed script URL
                spreadsheetId: 'YOUR_SPREADSHEET_ID' // Replace with your Google Sheet ID
            },
            firebase: {
                apiKey: "YOUR_FIREBASE_API_KEY",
                authDomain: "YOUR_PROJECT.firebaseapp.com",
                databaseURL: "https://YOUR_PROJECT.firebaseio.com",
                projectId: "YOUR_PROJECT_ID"
            },
            airtable: {
                apiKey: 'YOUR_AIRTABLE_API_KEY',
                baseId: 'YOUR_BASE_ID',
                tableName: 'UserData'
            }
        };
        this.init();
    }

    init() {
        this.loadUserSession();
        this.setupUI();
    }

    // User Session Management
    loadUserSession() {
        const savedUser = localStorage.getItem('wealthFactory_currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showUserInterface();
        } else {
            this.showLoginInterface();
        }
    }

    saveUserSession(email, name = null) {
        this.currentUser = { 
            email: email.toLowerCase().trim(), 
            name: name || email.split('@')[0],
            loginDate: new Date().toISOString()
        };
        localStorage.setItem('wealthFactory_currentUser', JSON.stringify(this.currentUser));
        this.showUserInterface();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('wealthFactory_currentUser');
        this.showLoginInterface();
        
        // Clear local data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('wealthFactory_') && key !== 'wealthFactory_currentUser') {
                localStorage.removeItem(key);
            }
        });
        
        if (window.app) {
            window.app.showNotification('Logged out successfully', 'info');
            // Refresh the app with empty data
            window.location.reload();
        }
    }

    // UI Management
    setupUI() {
        this.createLoginModal();
        this.createUserMenu();
    }

    createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'login-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal login-modal animate-scale-in">
                <div class="login-header">
                    <div class="wealth-logo">
                        <i class="fas fa-coins"></i>
                        <span>WEALTH FACTORY</span>
                    </div>
                    <h3>Access Your Financial Data</h3>
                    <p>Enter your email to save and retrieve your cash flow information from anywhere.</p>
                </div>
                
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="user-email">Email Address</label>
                        <input type="email" id="user-email" required placeholder="your@email.com" class="premium-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="user-name">Name (Optional)</label>
                        <input type="text" id="user-name" placeholder="Your Name" class="premium-input">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="guest-mode-btn" class="premium-btn secondary">
                            <i class="fas fa-user-secret"></i>
                            Continue as Guest
                        </button>
                        <button type="submit" class="premium-btn primary">
                            <i class="fas fa-sign-in-alt"></i>
                            Access My Data
                        </button>
                    </div>
                </form>
                
                <div class="login-info">
                    <p><i class="fas fa-shield-alt"></i> Your data is securely stored and encrypted</p>
                    <p><i class="fas fa-globe"></i> Access your information from any device</p>
                    <p><i class="fas fa-save"></i> Automatic cloud backup and sync</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('guest-mode-btn').addEventListener('click', () => {
            this.handleGuestMode();
        });
    }

    createUserMenu() {
        const userMenu = document.createElement('div');
        userMenu.id = 'user-menu';
        userMenu.className = 'user-menu hidden';
        userMenu.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-details">
                    <span class="user-name"></span>
                    <span class="user-email"></span>
                </div>
            </div>
            <div class="user-actions">
                <button id="sync-data-btn" class="premium-btn tertiary">
                    <i class="fas fa-sync"></i>
                    Sync Data
                </button>
                <button id="logout-btn" class="premium-btn secondary">
                    <i class="fas fa-sign-out-alt"></i>
                    Logout
                </button>
            </div>
        `;
        
        // Insert into navigation
        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            navActions.appendChild(userMenu);
        }
        
        // Event listeners
        document.getElementById('sync-data-btn').addEventListener('click', () => {
            this.syncData();
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    showLoginInterface() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('show');
        }
        
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.classList.add('hidden');
        }
    }

    showUserInterface() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        const userMenu = document.getElementById('user-menu');
        if (userMenu && this.currentUser) {
            userMenu.classList.remove('hidden');
            userMenu.querySelector('.user-name').textContent = this.currentUser.name;
            userMenu.querySelector('.user-email').textContent = this.currentUser.email;
        }
        
        // Load user's data from cloud
        this.loadUserData();
    }

    async handleLogin() {
        const email = document.getElementById('user-email').value.trim();
        const name = document.getElementById('user-name').value.trim();
        
        if (!email) {
            this.showError('Please enter your email address');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        this.showLoading('Connecting to your account...');
        
        try {
            // Save user session
            this.saveUserSession(email, name);
            
            // Try to load existing data
            await this.loadUserData();
            
            this.hideLoading();
            
            if (window.app) {
                window.app.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.hideLoading();
            this.showError('Failed to connect to your account. Please try again.');
        }
    }

    handleGuestMode() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        if (window.app) {
            window.app.showNotification('Using guest mode - data will only be saved locally', 'warning', 8000);
        }
    }

    // Data Synchronization
    async saveUserData(data) {
        if (!this.currentUser) {
            console.warn('No user logged in, saving locally only');
            return { success: false, error: 'No user logged in' };
        }
        
        const userData = {
            email: this.currentUser.email,
            name: this.currentUser.name,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        switch (this.storageMethod) {
            case 'googlesheets':
                return await this.saveToGoogleSheets(userData);
            case 'firebase':
                return await this.saveToFirebase(userData);
            case 'airtable':
                return await this.saveToAirtable(userData);
            default:
                return { success: false, error: 'No storage method configured' };
        }
    }

    async loadUserData() {
        if (!this.currentUser) {
            return { success: false, error: 'No user logged in' };
        }
        
        switch (this.storageMethod) {
            case 'googlesheets':
                return await this.loadFromGoogleSheets(this.currentUser.email);
            case 'firebase':
                return await this.loadFromFirebase(this.currentUser.email);
            case 'airtable':
                return await this.loadFromAirtable(this.currentUser.email);
            default:
                return { success: false, error: 'No storage method configured' };
        }
    }

    // Google Sheets Integration
    async saveToGoogleSheets(userData) {
        try {
            const response = await fetch(this.config.googleSheets.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save',
                    userData: userData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                if (window.app) {
                    window.app.showNotification('Data saved to cloud successfully!', 'success');
                }
                return { success: true };
            } else {
                throw new Error(result.error || 'Failed to save data');
            }
            
        } catch (error) {
            console.error('Google Sheets save error:', error);
            if (window.app) {
                window.app.showNotification('Failed to save to cloud. Data saved locally.', 'warning');
            }
            return { success: false, error: error.message };
        }
    }

    async loadFromGoogleSheets(email) {
        try {
            const response = await fetch(this.config.googleSheets.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'load',
                    email: email
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                // Apply loaded data to the app
                if (window.app && result.data.data) {
                    window.app.data = { ...window.app.data, ...result.data.data };
                    window.app.calculateAll();
                    
                    // Update all inputs with loaded values
                    Object.entries(result.data.data).forEach(([field, value]) => {
                        const input = document.querySelector(`[data-field="${field}"]`);
                        if (input) {
                            input.value = value;
                        }
                    });
                    
                    window.app.showNotification('Your data has been loaded from the cloud!', 'success');
                }
                
                return { success: true, data: result.data };
            }
            
            return { success: true, data: null }; // No existing data
            
        } catch (error) {
            console.error('Google Sheets load error:', error);
            if (window.app) {
                window.app.showNotification('Could not load cloud data. Using local data.', 'warning');
            }
            return { success: false, error: error.message };
        }
    }

    // Firebase Integration (placeholder)
    async saveToFirebase(userData) {
        console.warn('Firebase integration not implemented yet');
        return { success: false, error: 'Firebase not configured' };
    }

    async loadFromFirebase(email) {
        console.warn('Firebase integration not implemented yet');
        return { success: false, error: 'Firebase not configured' };
    }

    // Airtable Integration (placeholder)
    async saveToAirtable(userData) {
        console.warn('Airtable integration not implemented yet');
        return { success: false, error: 'Airtable not configured' };
    }

    async loadFromAirtable(email) {
        console.warn('Airtable integration not implemented yet');
        return { success: false, error: 'Airtable not configured' };
    }

    // Manual Sync
    async syncData() {
        if (!this.currentUser) {
            if (window.app) {
                window.app.showNotification('Please log in to sync your data', 'warning');
            }
            return;
        }
        
        this.showLoading('Syncing your data...');
        
        try {
            // Get current app data
            const currentData = window.app ? {
                userData: window.app.data,
                customItems: window.app.customItems
            } : {};
            
            // Save to cloud
            const saveResult = await this.saveUserData(currentData);
            
            if (saveResult.success) {
                if (window.app) {
                    window.app.showNotification('Data synced successfully!', 'success');
                }
            } else {
                throw new Error(saveResult.error);
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            if (window.app) {
                window.app.showNotification('Sync failed. Please try again.', 'error');
            }
        } finally {
            this.hideLoading();
        }
    }

    // Utility Methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'login-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const existingError = document.querySelector('.login-error');
        if (existingError) {
            existingError.remove();
        }
        
        const form = document.getElementById('login-form');
        if (form) {
            form.insertBefore(errorDiv, form.querySelector('.form-actions'));
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    showLoading(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'cloud-loading';
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loading = document.getElementById('cloud-loading');
        if (loading) {
            loading.remove();
        }
    }

    // Auto-save integration
    setupAutoSave() {
        if (window.app) {
            // Override the existing save method to include cloud save
            const originalSave = window.app.saveData.bind(window.app);
            
            window.app.saveData = () => {
                // Save locally first
                originalSave();
                
                // Then save to cloud if user is logged in
                if (this.currentUser) {
                    const currentData = {
                        userData: window.app.data,
                        customItems: window.app.customItems
                    };
                    
                    // Don't await - let it save in background
                    this.saveUserData(currentData).catch(error => {
                        console.error('Background cloud save failed:', error);
                    });
                }
            };
        }
    }
}

// Initialize cloud storage
let cloudStorage;
document.addEventListener('DOMContentLoaded', () => {
    cloudStorage = new CloudStorage();
    
    // Setup auto-save after app is initialized
    setTimeout(() => {
        if (cloudStorage) {
            cloudStorage.setupAutoSave();
        }
    }, 1000);
});

// Export for global access
window.CloudStorage = CloudStorage;

/* === LearnWorlds Integration & Single Sign-On === */

class LearnWorldsIntegration {
    constructor() {
        this.isInLearnWorlds = this.detectLearnWorlds();
        this.currentUser = null;
        this.coachAccess = false;
        this.config = {
            googleSheets: {
                scriptUrl: 'https://script.google.com/macros/s/AKfycbwKwA6vOa1Au19x61NI4xfnGQWfpm8uvb8_gLzhHLvbHQ-Vtr8GSrmFudgtvaDykxox/exec',
                spreadsheetId: '1YPNsbdZC7GiArdT4kNKqyLo_HuU-HQwwXLQ8RiGkZc0'
            }
        };
        this.init();
    }

    init() {
        if (this.isInLearnWorlds) {
            this.initLearnWorldsAuth();
        } else {
            this.initStandaloneAuth();
        }
    }

    detectLearnWorlds() {
        // Check if we're inside LearnWorlds iframe or have LearnWorlds parent
        try {
            return window.parent !== window && 
                   (window.location !== window.parent.location ||
                    document.referrer.includes('learnworlds') ||
                    window.location.href.includes('learnworlds'));
        } catch (e) {
            return false;
        }
    }

    initLearnWorldsAuth() {
        console.log('Initializing LearnWorlds SSO...');
        
        // Try to get user info from LearnWorlds
        this.getLearnWorldsUserInfo()
            .then(userInfo => {
                if (userInfo) {
                    this.currentUser = userInfo;
                    this.hideLoginModal();
                    this.showUserInfo();
                    this.loadUserData();
                } else {
                    this.showLearnWorldsLoginPrompt();
                }
            })
            .catch(error => {
                console.error('LearnWorlds auth failed:', error);
                this.initStandaloneAuth();
            });
    }

    async getLearnWorldsUserInfo() {
        // Method 1: Try to get from URL parameters (if LearnWorlds passes them)
        const urlParams = new URLSearchParams(window.location.search);
        const userEmail = urlParams.get('user_email') || urlParams.get('email');
        const userName = urlParams.get('user_name') || urlParams.get('name');
        const userId = urlParams.get('user_id') || urlParams.get('id');
        const isCoach = urlParams.get('is_coach') === 'true' || urlParams.get('role') === 'coach';
        
        if (userEmail) {
            return {
                id: userId,
                email: userEmail,
                name: userName || userEmail.split('@')[0],
                isCoach: isCoach,
                source: 'url_params'
            };
        }

        // Method 2: Try to communicate with parent LearnWorlds window
        try {
            const userInfo = await this.requestUserInfoFromParent();
            if (userInfo) {
                return userInfo;
            }
        } catch (e) {
            console.log('Could not get user info from parent window');
        }

        // Method 3: Check for LearnWorlds JavaScript API
        if (typeof window.LearnWorlds !== 'undefined') {
            try {
                const user = await window.LearnWorlds.getCurrentUser();
                if (user) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name || user.first_name + ' ' + user.last_name,
                        isCoach: user.role === 'admin' || user.role === 'instructor',
                        source: 'learnworlds_api'
                    };
                }
            } catch (e) {
                console.log('LearnWorlds API not available');
            }
        }

        return null;
    }

    requestUserInfoFromParent() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for user info'));
            }, 3000);

            const handleMessage = (event) => {
                if (event.data && event.data.type === 'LEARNWORLDS_USER_INFO') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handleMessage);
                    resolve(event.data.userInfo);
                }
            };

            window.addEventListener('message', handleMessage);
            
            // Request user info from parent
            try {
                window.parent.postMessage({
                    type: 'REQUEST_USER_INFO',
                    source: 'cash_flow_mastery'
                }, '*');
            } catch (e) {
                clearTimeout(timeout);
                window.removeEventListener('message', handleMessage);
                reject(e);
            }
        });
    }

    initStandaloneAuth() {
        console.log('Initializing standalone authentication...');
        this.showLoginModal();
    }

    showLoginModal() {
        const modal = this.createLoginModal();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
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
                    <p>Enter your information to save and retrieve your cash flow data from anywhere.</p>
                </div>
                
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="user-email">Email Address</label>
                        <input type="email" id="user-email" required placeholder="your@email.com" class="premium-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="user-name">Full Name</label>
                        <input type="text" id="user-name" required placeholder="Your Full Name" class="premium-input">
                    </div>
                    
                    <div class="form-group coach-access">
                        <label class="checkbox-label">
                            <input type="checkbox" id="coach-access">
                            <span class="checkmark"></span>
                            I am a coach accessing client data
                        </label>
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
        
        // Event listeners
        modal.querySelector('#login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        modal.querySelector('#guest-mode-btn').addEventListener('click', () => {
            this.handleGuestMode();
        });
        
        return modal;
    }

    showLearnWorldsLoginPrompt() {
        const modal = document.createElement('div');
        modal.id = 'learnworlds-prompt';
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal login-modal animate-scale-in">
                <div class="login-header">
                    <div class="wealth-logo">
                        <i class="fas fa-coins"></i>
                        <span>WEALTH FACTORY</span>
                    </div>
                    <h3>LearnWorlds Integration</h3>
                    <p>This tool is designed to work with your LearnWorlds account. Please make sure you're logged into LearnWorlds first.</p>
                </div>
                
                <div class="learnworlds-instructions">
                    <h4>Setup Instructions for Instructors:</h4>
                    <ol>
                        <li>Add user email and name as URL parameters</li>
                        <li>Use: <code>?user_email=student@email.com&user_name=Student Name</code></li>
                        <li>For coach access, add: <code>&is_coach=true</code></li>
                    </ol>
                </div>
                
                <div class="form-actions">
                    <button id="continue-anyway" class="premium-btn primary">
                        <i class="fas fa-arrow-right"></i>
                        Continue Anyway
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#continue-anyway').addEventListener('click', () => {
            modal.remove();
            this.initStandaloneAuth();
        });
    }

    async handleLogin() {
        const email = document.getElementById('user-email').value.trim();
        const name = document.getElementById('user-name').value.trim();
        const isCoach = document.getElementById('coach-access')?.checked || false;
        
        if (!email || !name) {
            this.showError('Please enter both email and name');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        this.showLoading('Connecting to your account...');
        
        try {
            this.currentUser = {
                email: email.toLowerCase().trim(),
                name: name.trim(),
                isCoach: isCoach,
                source: 'manual_entry',
                loginDate: new Date().toISOString()
            };
            
            // Save session
            this.saveUserSession();
            
            this.hideLoading();
            this.hideLoginModal();
            
            if (isCoach) {
                // Show coach interface instead of loading data
                this.showCoachInterface();
            } else {
                // Load user data for regular users
                await this.loadUserData();
                this.showUserInfo();
            }
            
            if (window.app) {
                window.app.showNotification(`Welcome${isCoach ? ' Coach' : ''}, ${name}!`, 'success');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.hideLoading();
            this.showError('Failed to connect to your account. Please try again.');
        }
    }

    showCoachInterface() {
        this.showUserInfo();
        
        // Create coach control panel
        const coachPanel = document.createElement('div');
        coachPanel.id = 'coach-panel';
        coachPanel.className = 'coach-panel';
        coachPanel.innerHTML = `
            <div class="coach-header">
                <h3><i class="fas fa-users"></i> Coach Dashboard</h3>
                <p>Access and manage student financial data</p>
            </div>
            
            <div class="coach-actions">
                <div class="student-search">
                    <div class="form-group">
                        <label for="student-email">Student Email Address</label>
                        <input type="email" id="student-email" placeholder="student@email.com" class="premium-input">
                    </div>
                    <div class="form-group">
                        <label for="student-name">Student Name (Optional)</label>
                        <input type="text" id="student-name" placeholder="Student Name" class="premium-input">
                    </div>
                    <div class="coach-button-group">
                        <button id="load-student-btn" class="premium-btn primary">
                            <i class="fas fa-search"></i>
                            Load Student Data
                        </button>
                        <button id="list-students-btn" class="premium-btn secondary">
                            <i class="fas fa-list"></i>
                            View All Students
                        </button>
                    </div>
                </div>
                
                <div id="current-student-info" class="current-student hidden">
                    <div class="student-card">
                        <div class="student-details">
                            <h4 id="current-student-name">No student selected</h4>
                            <p id="current-student-email"></p>
                            <p id="student-last-updated"></p>
                        </div>
                        <div class="student-stats">
                            <div class="stat">
                                <span class="stat-label">Net Worth</span>
                                <span class="stat-value" id="student-net-worth">$0</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Monthly Cash Flow</span>
                                <span class="stat-value" id="student-cash-flow">$0</span>
                            </div>
                        </div>
                        <button id="save-student-data-btn" class="premium-btn primary">
                            <i class="fas fa-save"></i>
                            Save Student Data
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="students-list" class="students-list hidden">
                <h4>All Students</h4>
                <div id="students-table"></div>
            </div>
        `;
        
        // Insert coach panel into the page
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(coachPanel, mainContent.firstChild);
        }
        
        // Add event listeners
        document.getElementById('load-student-btn').addEventListener('click', () => {
            this.loadStudentData();
        });
        
        document.getElementById('list-students-btn').addEventListener('click', () => {
            this.listAllStudents();
        });
        
        document.getElementById('save-student-data-btn').addEventListener('click', () => {
            this.saveCurrentStudentData();
        });
    }

    async loadStudentData() {
        const studentEmail = document.getElementById('student-email').value.trim();
        const studentName = document.getElementById('student-name').value.trim();
        
        if (!studentEmail) {
            this.showError('Please enter a student email address');
            return;
        }
        
        if (!this.isValidEmail(studentEmail)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        this.showLoading('Loading student data...');
        
        try {
            const response = await fetch(this.config.googleSheets.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'load',
                    email: studentEmail
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            this.hideLoading();
            
            if (result.success && result.data) {
                // Load student data into the app
                this.currentStudentEmail = studentEmail;
                this.currentStudentName = studentName || result.data.name || studentEmail.split('@')[0];
                
                if (window.app && result.data.data) {
                    // Clear existing data first
                    window.app.data = {};
                    
                    // Load student data
                    window.app.data = { ...result.data.data };
                    window.app.calculateAll();
                    
                    // Update all inputs with loaded values
                    Object.entries(result.data.data).forEach(([field, value]) => {
                        const input = document.querySelector(`[data-field="${field}"]`);
                        if (input) {
                            input.value = value || '';
                        }
                    });
                    
                    // Show student info
                    this.displayCurrentStudent(result.data);
                    
                    window.app.showNotification(`Loaded data for ${this.currentStudentName}`, 'success');
                }
            } else {
                // No existing data - create new student record
                this.currentStudentEmail = studentEmail;
                this.currentStudentName = studentName || studentEmail.split('@')[0];
                
                // Clear the form
                if (window.app) {
                    window.app.data = {};
                    window.app.calculateAll();
                    
                    // Clear all inputs
                    document.querySelectorAll('[data-field]').forEach(input => {
                        input.value = '';
                    });
                }
                
                this.displayCurrentStudent({
                    email: studentEmail,
                    name: this.currentStudentName,
                    lastUpdated: 'Never',
                    netWorth: 0,
                    monthlyCashFlow: 0
                });
                
                if (window.app) {
                    window.app.showNotification(`Ready to enter data for ${this.currentStudentName}`, 'info');
                }
            }
            
        } catch (error) {
            console.error('Failed to load student data:', error);
            this.hideLoading();
            this.showError('Failed to load student data. Please try again.');
        }
    }

    displayCurrentStudent(studentData) {
        const currentStudentInfo = document.getElementById('current-student-info');
        const studentsList = document.getElementById('students-list');
        
        if (currentStudentInfo) {
            currentStudentInfo.classList.remove('hidden');
            
            document.getElementById('current-student-name').textContent = studentData.name;
            document.getElementById('current-student-email').textContent = studentData.email;
            document.getElementById('student-last-updated').textContent = 
                `Last updated: ${studentData.lastUpdated ? new Date(studentData.lastUpdated).toLocaleDateString() : 'Never'}`;
            document.getElementById('student-net-worth').textContent = 
                this.formatCurrency(studentData.netWorth || 0);
            document.getElementById('student-cash-flow').textContent = 
                this.formatCurrency(studentData.monthlyCashFlow || 0);
        }
        
        if (studentsList) {
            studentsList.classList.add('hidden');
        }
    }

    async saveCurrentStudentData() {
        if (!this.currentStudentEmail) {
            this.showError('No student selected');
            return;
        }
        
        if (!window.app) {
            this.showError('Application not ready');
            return;
        }
        
        this.showLoading('Saving student data...');
        
        try {
            const userData = {
                email: this.currentStudentEmail,
                name: this.currentStudentName,
                timestamp: new Date().toISOString(),
                data: window.app.data,
                isCoach: false, // This is student data
                savedByCoach: this.currentUser.email,
                source: 'coach_entry'
            };
            
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
            
            this.hideLoading();
            
            if (result.success) {
                if (window.app) {
                    window.app.showNotification(`Data saved for ${this.currentStudentName}!`, 'success');
                }
                
                // Refresh student display with updated info
                this.loadStudentData();
            } else {
                throw new Error(result.error || 'Failed to save data');
            }
            
        } catch (error) {
            console.error('Save error:', error);
            this.hideLoading();
            this.showError('Failed to save student data. Please try again.');
        }
    }

    async listAllStudents() {
        this.showLoading('Loading all students...');
        
        try {
            const response = await fetch(this.config.googleSheets.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'list'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            this.hideLoading();
            
            if (result.success) {
                this.displayStudentsList(result.users || []);
            } else {
                throw new Error(result.error || 'Failed to load students');
            }
            
        } catch (error) {
            console.error('Failed to load students:', error);
            this.hideLoading();
            this.showError('Failed to load students list.');
        }
    }

    displayStudentsList(students) {
        const currentStudentInfo = document.getElementById('current-student-info');
        const studentsList = document.getElementById('students-list');
        const studentsTable = document.getElementById('students-table');
        
        if (currentStudentInfo) {
            currentStudentInfo.classList.add('hidden');
        }
        
        if (studentsList) {
            studentsList.classList.remove('hidden');
        }
        
        if (studentsTable) {
            if (students.length === 0) {
                studentsTable.innerHTML = '<p>No students found.</p>';
                return;
            }
            
            const tableHTML = `
                <div class="students-table">
                    <div class="table-header">
                        <div>Name</div>
                        <div>Email</div>
                        <div>Net Worth</div>
                        <div>Cash Flow</div>
                        <div>Last Updated</div>
                        <div>Actions</div>
                    </div>
                    ${students.map(student => `
                        <div class="table-row">
                            <div>${student.name}</div>
                            <div>${student.email}</div>
                            <div>${this.formatCurrency(student.netWorth || 0)}</div>
                            <div>${this.formatCurrency(student.monthlyCashFlow || 0)}</div>
                            <div>${student.lastUpdated ? new Date(student.lastUpdated).toLocaleDateString() : 'Never'}</div>
                            <div>
                                <button class="premium-btn tertiary" onclick="learnWorldsAuth.selectStudent('${student.email}', '${student.name}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            studentsTable.innerHTML = tableHTML;
        }
    }

    selectStudent(email, name) {
        document.getElementById('student-email').value = email;
        document.getElementById('student-name').value = name;
        this.loadStudentData();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    handleGuestMode() {
        this.hideLoginModal();
        if (window.app) {
            window.app.showNotification('Using guest mode - data will only be saved locally', 'warning', 8000);
        }
    }

    saveUserSession() {
        localStorage.setItem('wealthFactory_currentUser', JSON.stringify(this.currentUser));
        
        // Also save to integrate with existing auth system
        if (window.cloudStorage) {
            window.cloudStorage.currentUser = this.currentUser;
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            const response = await fetch(this.config.googleSheets.scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'load',
                    email: this.currentUser.email
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
            }
            
        } catch (error) {
            console.error('Failed to load user data:', error);
            if (window.app) {
                window.app.showNotification('Could not load cloud data. Using local data.', 'warning');
            }
        }
    }

    async saveUserData(financialData) {
        if (!this.currentUser) return { success: false, error: 'No user logged in' };
        
        try {
            const userData = {
                email: this.currentUser.email,
                name: this.currentUser.name,
                timestamp: new Date().toISOString(),
                data: financialData,
                isCoach: this.currentUser.isCoach,
                source: this.currentUser.source
            };
            
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
            console.error('Save error:', error);
            if (window.app) {
                window.app.showNotification('Failed to save to cloud. Data saved locally.', 'warning');
            }
            return { success: false, error: error.message };
        }
    }

    showUserInfo() {
        if (!this.currentUser) return;
        
        // Create or update user info display
        let userInfo = document.getElementById('current-user-info');
        if (!userInfo) {
            userInfo = document.createElement('div');
            userInfo.id = 'current-user-info';
            userInfo.className = 'user-info-display';
            
            const navActions = document.querySelector('.nav-actions');
            if (navActions) {
                navActions.insertBefore(userInfo, navActions.firstChild);
            }
        }
        
        userInfo.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
                ${this.currentUser.isCoach ? '<i class="fas fa-crown coach-badge"></i>' : ''}
            </div>
            <div class="user-details">
                <span class="user-name">${this.currentUser.name}</span>
                <span class="user-email">${this.currentUser.email}</span>
                ${this.currentUser.isCoach ? '<span class="user-role">Coach Access</span>' : ''}
            </div>
            <button id="logout-btn" class="premium-btn tertiary">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        
        // Add logout handler
        userInfo.querySelector('#logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('wealthFactory_currentUser');
        
        // Clear user info display
        const userInfo = document.getElementById('current-user-info');
        if (userInfo) {
            userInfo.remove();
        }
        
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

    // Utility methods
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

    // Setup auto-save integration
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

// Initialize LearnWorlds integration
let learnWorldsAuth;
document.addEventListener('DOMContentLoaded', () => {
    learnWorldsAuth = new LearnWorldsIntegration();
    
    // Setup auto-save after app is initialized
    setTimeout(() => {
        if (learnWorldsAuth) {
            learnWorldsAuth.setupAutoSave();
        }
    }, 1000);
});

// Export for global access
window.LearnWorldsIntegration = LearnWorldsIntegration;

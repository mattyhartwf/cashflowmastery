/* === Wealth Factory Cash Flow Mastery App === */

class CashFlowMastery {
    constructor() {
        this.data = this.loadData();
        this.customItems = this.loadCustomItems();
        this.charts = {};
        this.init();
    }

    init() {
        this.setupLoadingScreen();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.calculateAll();
        this.initializeCharts();
        this.startAutoSave();
        this.showNotification('Welcome to Cash Flow Mastery!', 'success');
    }

    setupLoadingScreen() {
        // Simulate loading time for premium experience
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                document.getElementById('app').classList.add('animate-fade-in');
            }
        }, 2000);
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Input changes with debouncing
        document.querySelectorAll('.premium-input').forEach(input => {
            let timeout;
            input.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.updateValue(e.target.dataset.field, parseFloat(e.target.value) || 0);
                    this.calculateAll();
                    this.updateCharts();
                    e.target.classList.add('success-flash');
                    setTimeout(() => e.target.classList.remove('success-flash'), 600);
                }, 300);
            });

            input.addEventListener('focus', (e) => {
                e.target.classList.add('animate-pulse');
            });

            input.addEventListener('blur', (e) => {
                e.target.classList.remove('animate-pulse');
                this.formatCurrency(e.target);
            });
        });

        // Save to Google Sheets
        document.getElementById('saveToSheets').addEventListener('click', () => {
            this.manualSave();
        });

        // Export PDF
        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        // Share functionality
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareData();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveToGoogleSheets();
                        break;
                    case '1':
                        e.preventDefault();
                        this.switchTab('balance-sheet');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('income-statement');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('analytics');
                        break;
                }
            }
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right').forEach(el => {
            observer.observe(el);
        });
    }

    switchTab(tabId) {
        // Update tab buttons with animation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        activeBtn.classList.add('active');

        // Update tab content with smooth transition
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        setTimeout(() => {
            document.getElementById(tabId).classList.add('active');
        }, 150);

        // Update charts if switching to analytics
        if (tabId === 'analytics') {
            setTimeout(() => this.updateAnalyticsCharts(), 300);
        }
    }

    updateValue(field, value) {
        this.data[field] = value;
        this.saveData();
    }

    formatCurrency(input) {
        const value = parseFloat(input.value) || 0;
        if (value !== 0) {
            input.value = value.toFixed(2);
        }
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    calculateAll() {
        this.calculateBalanceSheet();
        this.calculateIncomeStatement();
        this.calculateRatios();
        this.updateHeroStats();
    }

    calculateBalanceSheet() {
        // Calculate liquid assets
        const liquidAssets = [
            'cash_on_hand', 'personal_checking', 'personal_savings',
            'business_checking', 'business_savings', 'money_market', 'certificates_deposit'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate investments
        const investments = [
            'business_1', 'business_2', 'business_3', 'stocks', 'bonds',
            'mutual_funds', 'ira', '401k'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate personal assets
        const personalAssets = [
            'primary_residence', 'auto_1', 'auto_2', 'other_personal_assets'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate custom assets
        const customAssets = this.calculateCustomItems('assets');

        const totalAssets = liquidAssets + investments + personalAssets + customAssets;

        // Calculate short-term liabilities
        const shortTermLiabilities = [
            'medical_dental', 'credit_card_1', 'credit_card_2',
            'credit_card_3', 'credit_card_4', 'credit_card_5'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate long-term liabilities
        const longTermLiabilities = [
            'primary_mortgage', 'heloc', 'investment_mortgage',
            'auto_loan_1', 'auto_loan_2', 'student_loans', 'personal_loans_balance'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate custom liabilities
        const customLiabilities = this.calculateCustomItems('liabilities');

        const totalLiabilities = shortTermLiabilities + longTermLiabilities + customLiabilities;
        const netWorth = totalAssets - totalLiabilities;

        // Update displays with animations
        this.updateValueWithAnimation('total-assets', totalAssets);
        this.updateValueWithAnimation('liquid-total', liquidAssets);
        this.updateValueWithAnimation('investments-total', investments);
        this.updateValueWithAnimation('personal-assets-total', personalAssets);
        this.updateValueWithAnimation('total-liabilities', totalLiabilities);
        this.updateValueWithAnimation('short-term-total', shortTermLiabilities);
        this.updateValueWithAnimation('long-term-total', longTermLiabilities);
        this.updateValueWithAnimation('net-worth', netWorth);
        this.updateValueWithAnimation('summary-assets', totalAssets);
        this.updateValueWithAnimation('summary-liabilities', totalLiabilities);
        this.updateValueWithAnimation('summary-net-worth', netWorth);

        // Update net worth styling based on value
        const netWorthElements = document.querySelectorAll('#net-worth, #summary-net-worth');
        netWorthElements.forEach(el => {
            el.classList.remove('positive', 'negative');
            if (netWorth > 0) {
                el.classList.add('positive');
            } else if (netWorth < 0) {
                el.classList.add('negative');
            }
        });
    }

    calculateIncomeStatement() {
        // Calculate active income
        const activeIncome = [
            'salary_wages', 'distributions', 'commissions', 'bonus', 'interest_income'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate portfolio income
        const portfolioIncome = [
            'dividends', 'royalties'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate passive income
        const passiveIncome = [
            'business_income', 'real_estate_income'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate custom income
        const customIncome = this.calculateCustomItems('income');

        const totalIncome = activeIncome + portfolioIncome + passiveIncome + customIncome;

        // Calculate expenses by category
        const houseExpenses = [
            'mortgage_rent', 'heloc_payment', 'hoa_fees', 'cell_phone_1', 'cell_phone_2',
            'electricity', 'gas', 'water_sewer', 'waste_removal', 'repairs_maintenance', 'lawncare_pest'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        const transportationExpenses = [
            'auto_payment_1', 'auto_payment_2', 'auto_insurance',
            'registration_tags', 'gas_fuel', 'auto_repairs'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        const foodExpenses = [
            'groceries', 'restaurants'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        const entertainmentExpenses = [
            'streaming', 'music', 'movies', 'concerts', 'sporting_events',
            'live_theater', 'outdoor_activities'
        ].reduce((sum, field) => sum + (this.data[field] || 0), 0);

        // Calculate custom expenses
        const customExpenses = this.calculateCustomItems('expenses');

        const totalExpenses = houseExpenses + transportationExpenses + foodExpenses + 
                            entertainmentExpenses + customExpenses;
        const monthlyCashFlow = totalIncome - totalExpenses;
        const annualIncome = totalIncome * 12;
        const annualExpenses = totalExpenses * 12;
        const annualCashFlow = monthlyCashFlow * 12;

        // Update displays
        this.updateValueWithAnimation('total-income', totalIncome);
        this.updateValueWithAnimation('active-income-total', activeIncome);
        this.updateValueWithAnimation('portfolio-income-total', portfolioIncome);
        this.updateValueWithAnimation('passive-income-total', passiveIncome);
        this.updateValueWithAnimation('total-expenses', totalExpenses);
        this.updateValueWithAnimation('house-expenses-total', houseExpenses);
        this.updateValueWithAnimation('transportation-expenses-total', transportationExpenses);
        this.updateValueWithAnimation('food-expenses-total', foodExpenses);
        this.updateValueWithAnimation('entertainment-expenses-total', entertainmentExpenses);
        this.updateValueWithAnimation('monthly-cash-flow', monthlyCashFlow);
        this.updateValueWithAnimation('summary-income', totalIncome);
        this.updateValueWithAnimation('summary-expenses', totalExpenses);
        this.updateValueWithAnimation('summary-cash-flow', monthlyCashFlow);
        this.updateValueWithAnimation('annual-income', annualIncome);
        this.updateValueWithAnimation('annual-expenses', annualExpenses);
        this.updateValueWithAnimation('annual-cash-flow', annualCashFlow);

        // Update cash flow styling
        const cashFlowElements = document.querySelectorAll('#monthly-cash-flow, #summary-cash-flow, #annual-cash-flow');
        cashFlowElements.forEach(el => {
            el.classList.remove('positive', 'negative');
            const value = parseFloat(el.textContent.replace(/[$,]/g, ''));
            if (value > 0) {
                el.classList.add('positive');
            } else if (value < 0) {
                el.classList.add('negative');
            }
        });
    }

    calculateCustomItems(category) {
        const categoryItems = this.customItems[category] || [];
        return categoryItems.reduce((sum, item) => sum + (this.data[item.field] || 0), 0);
    }

    calculateRatios() {
        const totalAssets = parseFloat(document.getElementById('total-assets').textContent.replace(/[$,]/g, '')) || 0;
        const totalLiabilities = parseFloat(document.getElementById('total-liabilities').textContent.replace(/[$,]/g, '')) || 0;
        const totalIncome = parseFloat(document.getElementById('total-income').textContent.replace(/[$,]/g, '')) || 0;
        const liquidAssets = parseFloat(document.getElementById('liquid-total').textContent.replace(/[$,]/g, '')) || 0;

        // Debt-to-Asset Ratio
        const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0;
        
        // Liquidity Ratio
        const liquidityRatio = totalAssets > 0 ? (liquidAssets / totalAssets * 100) : 0;
        
        // Debt-to-Income Ratio
        const debtToIncomeRatio = totalIncome > 0 ? (totalLiabilities / (totalIncome * 12) * 100) : 0;
        
        // Savings Rate
        const monthlyCashFlow = parseFloat(document.getElementById('monthly-cash-flow').textContent.replace(/[$,]/g, '')) || 0;
        const savingsRate = totalIncome > 0 ? (monthlyCashFlow / totalIncome * 100) : 0;

        // Update ratio displays
        this.updateElement('debt-to-asset-ratio', `${debtToAssetRatio.toFixed(1)}%`);
        this.updateElement('liquidity-ratio', `${liquidityRatio.toFixed(1)}%`);
        this.updateElement('debt-income-ratio', `${debtToIncomeRatio.toFixed(1)}%`);
        this.updateElement('savings-rate', `${savingsRate.toFixed(1)}%`);

        // Calculate financial health score
        const healthScore = this.calculateHealthScore(debtToAssetRatio, liquidityRatio, savingsRate);
        this.updateElement('health-score', healthScore);
    }

    calculateHealthScore(debtToAssetRatio, liquidityRatio, savingsRate) {
        let score = 100;
        
        // Penalize high debt-to-asset ratio
        if (debtToAssetRatio > 50) score -= 20;
        else if (debtToAssetRatio > 30) score -= 10;
        
        // Reward good liquidity
        if (liquidityRatio < 10) score -= 15;
        else if (liquidityRatio > 30) score += 10;
        
        // Reward positive savings rate
        if (savingsRate < 0) score -= 25;
        else if (savingsRate > 20) score += 15;
        else if (savingsRate > 10) score += 10;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    updateHeroStats() {
        const netWorth = parseFloat(document.getElementById('net-worth').textContent.replace(/[$,]/g, '')) || 0;
        const monthlyCashFlow = parseFloat(document.getElementById('monthly-cash-flow').textContent.replace(/[$,]/g, '')) || 0;
        const annualProjection = monthlyCashFlow * 12;

        this.updateElement('hero-net-worth', this.formatMoney(netWorth));
        this.updateElement('hero-monthly-flow', this.formatMoney(monthlyCashFlow));
        this.updateElement('hero-annual-projection', this.formatMoney(annualProjection));
    }

    updateValueWithAnimation(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('animate-pulse');
            element.textContent = this.formatMoney(value);
            setTimeout(() => element.classList.remove('animate-pulse'), 600);
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    // Reset all data to $0
    resetAllData() {
        // Clear all data
        this.data = {};
        this.customItems = {};
        
        // Clear localStorage
        try {
            localStorage.removeItem('cashFlowMasteryData');
            localStorage.removeItem('cashFlowMasteryCustomItems');
        } catch (e) {
            console.warn('Could not clear localStorage:', e);
        }
        
        // Reset all input fields to empty
        document.querySelectorAll('.premium-input').forEach(input => {
            input.value = '';
        });
        
        // Recalculate everything (this will show $0 everywhere)
        this.calculateAll();
        
        this.showNotification('All data has been reset to $0', 'success');
    }

    // Custom item management
    addCustomItem(category) {
        const modal = this.createCustomItemModal(category);
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    createCustomItemModal(category) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal animate-scale-in">
                <h3>Add Custom ${category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <div class="custom-item-form">
                    <input type="text" id="custom-name" placeholder="Item name" />
                    <input type="number" id="custom-value" placeholder="0.00" step="0.01" />
                </div>
                <div class="modal-actions">
                    <button class="premium-btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="premium-btn primary" onclick="app.saveCustomItem('${category}', this)">Add Item</button>
                </div>
            </div>
        `;
        return modal;
    }

    saveCustomItem(category, button) {
        const modal = button.closest('.modal-overlay');
        const name = modal.querySelector('#custom-name').value.trim();
        const value = parseFloat(modal.querySelector('#custom-value').value) || 0;

        if (!name) {
            this.showNotification('Please enter an item name', 'error');
            return;
        }

        const field = `custom_${category}_${Date.now()}`;
        this.data[field] = value;

        if (!this.customItems[category]) {
            this.customItems[category] = [];
        }
        
        this.customItems[category].push({ name, field });
        this.saveCustomItems();
        this.renderCustomItem(category, name, field, value);
        this.calculateAll();
        
        modal.remove();
        this.showNotification(`${name} added successfully!`, 'success');
    }

    renderCustomItem(category, name, field, value) {
        const container = document.getElementById(`${category}-container`);
        if (!container) return;

        const item = document.createElement('div');
        item.className = 'financial-item custom-item animate-fade-in-up';
        item.innerHTML = `
            <label>${name}</label>
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" class="premium-input" data-field="${field}" step="0.01" value="${value}" placeholder="0.00">
                <button class="remove-btn" onclick="app.removeCustomItem('${category}', '${field}', this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(item);
        
        // Add event listeners to new input
        const input = item.querySelector('.premium-input');
        let timeout;
        input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.updateValue(field, parseFloat(e.target.value) || 0);
                this.calculateAll();
            }, 300);
        });

        input.addEventListener('blur', (e) => this.formatCurrency(e.target));
    }

    removeCustomItem(category, field, button) {
        const item = button.closest('.financial-item');
        item.classList.add('error-shake');
        
        setTimeout(() => {
            delete this.data[field];
            this.customItems[category] = this.customItems[category].filter(item => item.field !== field);
            this.saveCustomItems();
            item.remove();
            this.calculateAll();
            this.showNotification('Item removed', 'warning');
        }, 500);
    }

    // Data persistence - Modified to start with empty data
    saveData() {
        try {
            localStorage.setItem('cashFlowMasteryData', JSON.stringify(this.data));
            
            // Also save to cloud if user is logged in
            if (window.learnWorldsAuth && window.learnWorldsAuth.currentUser) {
                this.saveToCloud();
            }
        } catch (e) {
            console.warn('Could not save data to localStorage:', e);
        }
    }

    async saveToCloud() {
        try {
            if (window.learnWorldsAuth && window.learnWorldsAuth.currentUser) {
                const userData = {
                    userData: this.data,
                    customItems: this.customItems
                };
                
                if (window.learnWorldsAuth.currentUser.isCoach && window.learnWorldsAuth.currentStudentEmail) {
                    // Coach is saving student data
                    await window.learnWorldsAuth.saveCurrentStudentData();
                } else if (!window.learnWorldsAuth.currentUser.isCoach) {
                    // Regular user saving their own data
                    await window.learnWorldsAuth.saveUserData(userData);
                }
            }
        } catch (error) {
            console.error('Cloud save failed:', error);
        }
    }

    // Modified to always start with empty data (ensures $0 values)
    loadData() {
        // Always start with empty data to ensure $0 values
        return {};
        
        // Original code below (commented out):
        // try {
        //     const saved = localStorage.getItem('cashFlowMasteryData');
        //     return saved ? JSON.parse(saved) : {};
        // } catch (e) {
        //     console.warn('Could not load data from localStorage:', e);
        //     return {};
        // }
    }

    // Modified to always start with empty custom items
    loadCustomItems() {
        // Always start with empty custom items
        return {};
        
        // Original code below (commented out):
        // try {
        //     const saved = localStorage.getItem('cashFlowMasteryCustomItems');
        //     return saved ? JSON.parse(saved) : {};
        // } catch (e) {
        //     console.warn('Could not load custom items:', e);
        //     return {};
        // }
    }

    saveCustomItems() {
        try {
            localStorage.setItem('cashFlowMasteryCustomItems', JSON.stringify(this.customItems));
        } catch (e) {
            console.warn('Could not save custom items:', e);
        }
    }

    startAutoSave() {
        setInterval(() => {
            this.saveData();
        }, 30000); // Auto-save every 30 seconds
    }

    // Export and sharing functionality
    async manualSave() {
        if (!window.learnWorldsAuth || !window.learnWorldsAuth.currentUser) {
            this.showNotification('Please log in to save to cloud', 'warning');
            return;
        }
        
        this.showNotification('Saving to cloud...', 'info');
        
        try {
            const userData = {
                userData: this.data,
                customItems: this.customItems
            };
            
            if (window.learnWorldsAuth.currentUser.isCoach && window.learnWorldsAuth.currentStudentEmail) {
                // Coach saving student data
                await window.learnWorldsAuth.saveCurrentStudentData();
            } else if (!window.learnWorldsAuth.currentUser.isCoach) {
                // Regular user saving their own data
                const result = await window.learnWorldsAuth.saveUserData(userData);
                if (result.success) {
                    this.showNotification('Data saved to cloud successfully!', 'success');
                } else {
                    this.showNotification('Failed to save to cloud: ' + result.error, 'error');
                }
            } else {
                this.showNotification('Please select a student first', 'warning');
            }
        } catch (error) {
            console.error('Manual save failed:', error);
            this.showNotification('Failed to save to cloud', 'error');
        }
    }

    prepareExportData() {
        return {
            balanceSheet: {
                assets: {
                    liquid: this.extractFieldGroup(['cash_on_hand', 'personal_checking', 'personal_savings', 'business_checking', 'business_savings', 'money_market', 'certificates_deposit']),
                    investments: this.extractFieldGroup(['business_1', 'business_2', 'business_3', 'stocks', 'bonds', 'mutual_funds', 'ira', '401k']),
                    personal: this.extractFieldGroup(['primary_residence', 'auto_1', 'auto_2', 'other_personal_assets'])
                },
                liabilities: {
                    shortTerm: this.extractFieldGroup(['medical_dental', 'credit_card_1', 'credit_card_2', 'credit_card_3', 'credit_card_4', 'credit_card_5']),
                    longTerm: this.extractFieldGroup(['primary_mortgage', 'heloc', 'investment_mortgage', 'auto_loan_1', 'auto_loan_2', 'student_loans', 'personal_loans_balance'])
                }
            },
            incomeStatement: {
                income: {
                    active: this.extractFieldGroup(['salary_wages', 'distributions', 'commissions', 'bonus', 'interest_income']),
                    portfolio: this.extractFieldGroup(['dividends', 'royalties']),
                    passive: this.extractFieldGroup(['business_income', 'real_estate_income'])
                },
                expenses: {
                    house: this.extractFieldGroup(['mortgage_rent', 'heloc_payment', 'hoa_fees', 'cell_phone_1', 'cell_phone_2', 'electricity', 'gas', 'water_sewer', 'waste_removal', 'repairs_maintenance', 'lawncare_pest']),
                    transportation: this.extractFieldGroup(['auto_payment_1', 'auto_payment_2', 'auto_insurance', 'registration_tags', 'gas_fuel', 'auto_repairs']),
                    food: this.extractFieldGroup(['groceries', 'restaurants']),
                    entertainment: this.extractFieldGroup(['streaming', 'music', 'movies', 'concerts', 'sporting_events', 'live_theater', 'outdoor_activities'])
                }
            },
            customItems: this.customItems,
            timestamp: new Date().toISOString()
        };
    }

    extractFieldGroup(fields) {
        const result = {};
        fields.forEach(field => {
            result[field] = this.data[field] || 0;
        });
        return result;
    }

    async exportToPDF() {
        this.showNotification('Generating PDF report...', 'info');
        
        try {
            // In a real implementation, you would use a PDF library like jsPDF
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const pdfContent = this.generatePDFContent();
            console.log('PDF content generated:', pdfContent);
            
            this.showNotification('PDF report generated successfully!', 'success');
            
            // Simulate PDF download
            this.downloadFile('cash-flow-mastery-report.pdf', 'application/pdf', 'PDF content would go here');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showNotification('Error generating PDF. Please try again.', 'error');
        }
    }

    generatePDFContent() {
        const netWorth = parseFloat(document.getElementById('net-worth').textContent.replace(/[$,]/g, '')) || 0;
        const monthlyCashFlow = parseFloat(document.getElementById('monthly-cash-flow').textContent.replace(/[$,]/g, '')) || 0;
        const totalAssets = parseFloat(document.getElementById('total-assets').textContent.replace(/[$,]/g, '')) || 0;
        const totalLiabilities = parseFloat(document.getElementById('total-liabilities').textContent.replace(/[$,]/g, '')) || 0;
        
        return {
            title: 'Cash Flow Mastery Report',
            date: new Date().toLocaleDateString(),
            summary: {
                netWorth,
                monthlyCashFlow,
                totalAssets,
                totalLiabilities,
                debtToAssetRatio: totalAssets > 0 ? (totalLiabilities / totalAssets * 100).toFixed(1) + '%' : '0%'
            },
            data: this.data
        };
    }

    async shareData() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Cash Flow Mastery Report',
                    text: `Check out my financial snapshot: Net Worth: ${document.getElementById('net-worth').textContent}, Monthly Cash Flow: ${document.getElementById('monthly-cash-flow').textContent}`,
                    url: window.location.href
                });
                this.showNotification('Shared successfully!', 'success');
            } catch (error) {
                console.log('Error sharing:', error);
                this.copyToClipboard();
            }
        } else {
            this.copyToClipboard();
        }
    }

    copyToClipboard() {
        const shareText = `My Financial Snapshot:\nNet Worth: ${document.getElementById('net-worth').textContent}\nMonthly Cash Flow: ${document.getElementById('monthly-cash-flow').textContent}\nGenerated with Cash Flow Mastery by Wealth Factory`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Financial summary copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Financial summary copied to clipboard!', 'success');
        }
    }

    downloadFile(filename, mimeType, content) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Notification system
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate-slide-in-right`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="${icon}"></i>
                <span>${message}</span>
                <button onclick="this.closest('.notification').remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // Chart initialization and updates
    initializeCharts() {
        // Initialize hero chart
        this.initHeroChart();
        // Initialize other charts as needed
    }

    initHeroChart() {
        const canvas = document.getElementById('heroChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Simple animated chart simulation
        this.drawSimpleChart(ctx, canvas.width, canvas.height);
    }

    drawSimpleChart(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(194, 155, 60, 0.8)');
        gradient.addColorStop(1, 'rgba(194, 155, 60, 0.1)');
        
        // Sample data points
        const netWorth = parseFloat(document.getElementById('net-worth').textContent.replace(/[$,]/g, '')) || 0;
        const maxValue = Math.max(netWorth, 100000);
        const points = [];
        
        // Generate sample trend data
        for (let i = 0; i < 12; i++) {
            const variance = (Math.random() - 0.5) * 0.2;
            const value = Math.max(0, netWorth * (1 + variance));
            points.push({
                x: (i / 11) * (width - 40) + 20,
                y: height - 40 - ((value / maxValue) * (height - 80))
            });
        }
        
        // Draw line
        ctx.strokeStyle = '#C29B3C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        
        // Fill area under curve
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - 20);
        points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.lineTo(points[points.length - 1].x, height - 20);
        ctx.closePath();
        ctx.fill();
        
        // Draw points
        ctx.fillStyle = '#C29B3C';
        points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    updateCharts() {
        // Update hero chart
        this.initHeroChart();
        
        // Update other charts as needed
        if (document.querySelector('.tab-content.active')?.id === 'analytics') {
            this.updateAnalyticsCharts();
        }
    }

    updateAnalyticsCharts() {
        // Asset allocation chart
        this.updateAssetChart();
        
        // Cash flow trend chart
        this.updateCashflowChart();
        
        // Portfolio performance chart
        this.updatePortfolioChart();
        
        // Expense breakdown chart
        this.updateExpenseChart();
        
        // Growth projection chart
        this.updateGrowthChart();
    }

    updateAssetChart() {
        const canvas = document.getElementById('assetChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const liquidAssets = parseFloat(document.getElementById('liquid-total').textContent.replace(/[$,]/g, '')) || 0;
        const investments = parseFloat(document.getElementById('investments-total').textContent.replace(/[$,]/g, '')) || 0;
        const personalAssets = parseFloat(document.getElementById('personal-assets-total').textContent.replace(/[$,]/g, '')) || 0;
        const total = liquidAssets + investments + personalAssets;
        
        if (total === 0) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const colors = ['#C29B3C', '#D4A853', '#E6BC67'];
        const values = [liquidAssets, investments, personalAssets];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[index];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
    }

    updateCashflowChart() {
        const canvas = document.getElementById('cashflowChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple bar chart for monthly cash flow trend
        const monthlyCashFlow = parseFloat(document.getElementById('monthly-cash-flow').textContent.replace(/[$,]/g, '')) || 0;
        const bars = 6;
        const barWidth = (canvas.width - 40) / bars;
        const maxHeight = canvas.height - 40;
        
        for (let i = 0; i < bars; i++) {
            const variance = (Math.random() - 0.5) * 0.3;
            const value = monthlyCashFlow * (1 + variance);
            const barHeight = Math.abs(value) / Math.max(Math.abs(monthlyCashFlow), 1000) * maxHeight * 0.8;
            
            ctx.fillStyle = value >= 0 ? '#10B981' : '#EF4444';
            ctx.fillRect(
                20 + i * barWidth + 5,
                canvas.height - 20 - (value >= 0 ? barHeight : 0),
                barWidth - 10,
                barHeight
            );
        }
    }

    updatePortfolioChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;
        
        // Simple line chart showing portfolio growth
        this.drawSimpleChart(canvas.getContext('2d'), canvas.width, canvas.height);
    }

    updateExpenseChart() {
        const canvas = document.getElementById('expenseChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const houseExpenses = parseFloat(document.getElementById('house-expenses-total').textContent.replace(/[$,]/g, '')) || 0;
        const transportExpenses = parseFloat(document.getElementById('transportation-expenses-total').textContent.replace(/[$,]/g, '')) || 0;
        const foodExpenses = parseFloat(document.getElementById('food-expenses-total').textContent.replace(/[$,]/g, '')) || 0;
        const entertainmentExpenses = parseFloat(document.getElementById('entertainment-expenses-total').textContent.replace(/[$,]/g, '')) || 0;
        
        const total = houseExpenses + transportExpenses + foodExpenses + entertainmentExpenses;
        
        if (total === 0) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const colors = ['#C29B3C', '#D4A853', '#E6BC67', '#F0D084'];
        const values = [houseExpenses, transportExpenses, foodExpenses, entertainmentExpenses];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[index];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
    }

    updateGrowthChart() {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const netWorth = parseFloat(document.getElementById('net-worth').textContent.replace(/[$,]/g, '')) || 0;
        const annualCashFlow = parseFloat(document.getElementById('annual-cash-flow').textContent.replace(/[$,]/g, '')) || 0;
        
        // Project wealth growth over 10 years
        const years = 10;
        const points = [];
        let currentWealth = netWorth;
        
        for (let i = 0; i <= years; i++) {
            points.push({
                x: (i / years) * (canvas.width - 40) + 20,
                y: canvas.height - 40 - ((currentWealth / Math.max(currentWealth, netWorth + annualCashFlow * years)) * (canvas.height - 80))
            });
            
            // Assume 5% annual growth on investments plus cash flow
            currentWealth = currentWealth * 1.05 + annualCashFlow;
        }
        
        // Draw growth projection line
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
        
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        
        // Fill area
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, canvas.height - 20);
        points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.lineTo(points[points.length - 1].x, canvas.height - 20);
        ctx.closePath();
        ctx.fill();
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CashFlowMastery();
});

// Global functions for onclick handlers
window.addCustomItem = function(category) {
    app.addCustomItem(category);
};

window.app = app;

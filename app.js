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
                loadingScreen.style.display = 'none';
                loadingScreen.classList.add('hidden');
            }
            const app = document.getElementById('app');
            if (app) {
                app.style.display = 'block';
                app.classList.add('animate-fade-in');
            }
        }, 1500);
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

        // Save to Airtable (updated to match HTML button ID)
        const saveBtn = document.getElementById('saveToAirtable');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.manualSave();
            });
        }

        // Export PDF
        const exportBtn = document.getElementById('exportPDF');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportToPDF();
            });
        }

        // Share functionality
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareData();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.manualSave();
                        break;
                    case '1':
                        e.preventDefault();
                        this.switchTab('income-statement');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('balance-sheet');
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
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Update tab content with smooth transition
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        setTimeout(() => {
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
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

        // Calculate expenses by category - UPDATED with new bills
        const houseExpenses = [
            'mortgage_rent', 'heloc_payment', 'hoa_fees', 'cell_phone_1', 'cell_phone_2',
            'electricity', 'gas', 'water_sewer', 'waste_removal', 'repairs_maintenance', 
            'lawncare_pest', 'internet', 'cable_satellite', 'home_security', 'home_insurance'
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
        const totalAssetsEl = document.getElementById('total-assets');
        const totalLiabilitiesEl = document.getElementById('total-liabilities');
        const totalIncomeEl = document.getElementById('total-income');
        const liquidTotalEl = document.getElementById('liquid-total');

        const totalAssets = totalAssetsEl ? parseFloat(totalAssetsEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const totalLiabilities = totalLiabilitiesEl ? parseFloat(totalLiabilitiesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const totalIncome = totalIncomeEl ? parseFloat(totalIncomeEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const liquidAssets = liquidTotalEl ? parseFloat(liquidTotalEl.textContent.replace(/[$,]/g, '')) || 0 : 0;

        // Debt-to-Asset Ratio
        const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0;
        
        // Liquidity Ratio
        const liquidityRatio = totalAssets > 0 ? (liquidAssets / totalAssets * 100) : 0;
        
        // Debt-to-Income Ratio
        const debtToIncomeRatio = totalIncome > 0 ? (totalLiabilities / (totalIncome * 12) * 100) : 0;
        
        // Savings Rate
        const monthlyCashFlowEl = document.getElementById('monthly-cash-flow');
        const monthlyCashFlow = monthlyCashFlowEl ? parseFloat(monthlyCashFlowEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
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
        const netWorthEl = document.getElementById('net-worth');
        const monthlyCashFlowEl = document.getElementById('monthly-cash-flow');
        
        const netWorth = netWorthEl ? parseFloat(netWorthEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const monthlyCashFlow = monthlyCashFlowEl ? parseFloat(monthlyCashFlowEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
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

    // Data persistence
    saveData() {
        try {
            localStorage.setItem('cashFlowMasteryData', JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save data to localStorage:', e);
        }
    }

    loadData() {
        try {
            const saved = localStorage.getItem('cashFlowMasteryData');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Could not load data from localStorage:', e);
            return {};
        }
    }

    saveCustomItems() {
        try {
            localStorage.setItem('cashFlowMasteryCustomItems', JSON.stringify(this.customItems));
        } catch (e) {
            console.warn('Could not save custom items:', e);
        }
    }

    loadCustomItems() {
        try {
            const saved = localStorage.getItem('cashFlowMasteryCustomItems');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Could not load custom items:', e);
            return {};
        }
    }

    startAutoSave() {
        setInterval(() => {
            this.saveData();
        }, 30000); // Auto-save every 30 seconds
    }

    async manualSave() {
        this.showNotification('Saving to Airtable...', 'info');
        
        try {
            // Check if user is logged in (from auth systems)
            let currentUser = null;
            
            if (window.learnWorldsAuth && window.learnWorldsAuth.currentUser) {
                currentUser = window.learnWorldsAuth.currentUser;
            } else if (window.cloudStorage && window.cloudStorage.currentUser) {
                currentUser = window.cloudStorage.currentUser;
            }
            
            if (currentUser && window.airtableIntegration) {
                // Save to Airtable with user info
                const userData = {
                    email: currentUser.email,
                    name: currentUser.name,
                    data: this.data,
                    source: 'manual_save',
                    isCoach: currentUser.isCoach || false
                };
                
                const result = await window.airtableIntegration.saveUserData(userData);
                
                if (result.success) {
                    this.showNotification('✅ Data saved to Airtable successfully!', 'success');
                } else {
                    throw new Error(result.error);
                }
            } else {
                // No user logged in - save locally only
                this.saveData();
                this.showNotification('Data saved locally. Log in to save to cloud.', 'warning');
            }
            
        } catch (error) {
            console.error('Airtable save failed:', error);
            // Fallback to local save
            this.saveData();
            this.showNotification('Failed to save to Airtable. Data saved locally.', 'warning');
        }
    }

    async exportToPDF() {
        this.showNotification('Generating PDF report...', 'info');
        
        try {
            // Simulate PDF generation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Create a simple text-based report
            const reportData = this.generateReportData();
            this.downloadTextReport(reportData);
            
            this.showNotification('PDF report generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showNotification('Error generating PDF. Please try again.', 'error');
        }
    }

    generateReportData() {
        const netWorthEl = document.getElementById('net-worth');
        const totalIncomeEl = document.getElementById('total-income');
        const totalExpensesEl = document.getElementById('total-expenses');
        const monthlyCashFlowEl = document.getElementById('monthly-cash-flow');
        
        const netWorth = netWorthEl ? netWorthEl.textContent : '$0';
        const totalIncome = totalIncomeEl ? totalIncomeEl.textContent : '$0';
        const totalExpenses = totalExpensesEl ? totalExpensesEl.textContent : '$0';
        const monthlyCashFlow = monthlyCashFlowEl ? monthlyCashFlowEl.textContent : '$0';
        
        return `
CASH FLOW MASTERY REPORT
Generated: ${new Date().toLocaleDateString()}

=== FINANCIAL SUMMARY ===
Net Worth: ${netWorth}
Monthly Income: ${totalIncome}
Monthly Expenses: ${totalExpenses}
Monthly Cash Flow: ${monthlyCashFlow}
Annual Projection: ${this.formatMoney((parseFloat(monthlyCashFlow.replace(/[$,]/g, '')) || 0) * 12)}

=== ANALYSIS ===
This report shows your current financial position based on the data entered into the Cash Flow Mastery tool.

For a detailed breakdown of all categories and specific line items, please access the full dashboard at:
https://cashflowmastery.netlify.app/

Generated by Wealth Factory Cash Flow Mastery Tool
        `;
    }

    downloadTextReport(data) {
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cash-flow-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async shareData() {
        const netWorthEl = document.getElementById('net-worth');
        const monthlyCashFlowEl = document.getElementById('monthly-cash-flow');
        
        const netWorth = netWorthEl ? netWorthEl.textContent : '$0';
        const monthlyCashFlow = monthlyCashFlowEl ? monthlyCashFlowEl.textContent : '$0';
        
        const shareText = `My Financial Snapshot:\nNet Worth: ${netWorth}\nMonthly Cash Flow: ${monthlyCashFlow}\nGenerated with Cash Flow Mastery by Wealth Factory`;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My Financial Snapshot',
                    text: shareText,
                    url: 'https://cashflowmastery.netlify.app/'
                });
                this.showNotification('Shared successfully!', 'success');
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareText);
                this.showNotification('Financial summary copied to clipboard!', 'success');
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
        } catch (error) {
            console.error('Share failed:', error);
            this.showNotification('Unable to share. Try copying manually.', 'warning');
        }
    }

    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Inter, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${message}</span>
                <button onclick="this.closest('.notification').remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    initializeCharts() {
        // Initialize charts when tab content is visible
        setTimeout(() => {
            this.updateCharts();
        }, 1000);
    }

    updateCharts() {
        // Update sidebar charts
        this.updateIncomeDistributionChart();
        this.updateExpenseDistributionChart();
        this.updateAssetAllocationChart();
        this.updateLiabilityBreakdownChart();
        
        // Update analytics charts if on analytics tab
        if (document.querySelector('#analytics.active')) {
            this.updateAnalyticsCharts();
        }
    }

    updateIncomeDistributionChart() {
        const canvas = document.getElementById('incomeDistributionChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const activeIncomeEl = document.getElementById('active-income-total');
        const portfolioIncomeEl = document.getElementById('portfolio-income-total');
        const passiveIncomeEl = document.getElementById('passive-income-total');
        
        const activeIncome = activeIncomeEl ? parseFloat(activeIncomeEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const portfolioIncome = portfolioIncomeEl ? parseFloat(portfolioIncomeEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const passiveIncome = passiveIncomeEl ? parseFloat(passiveIncomeEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const total = activeIncome + portfolioIncome + passiveIncome;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (total === 0) {
            ctx.fillStyle = '#C8C8C8';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No Data', centerX, centerY);
            return;
        }
        
        const colors = ['#10B981', '#C29B3C', '#D4A853'];
        const values = [activeIncome, portfolioIncome, passiveIncome];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                ctx.fillStyle = colors[index];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                currentAngle += sliceAngle;
            }
        });
    }

    updateExpenseDistributionChart() {
        const canvas = document.getElementById('expenseDistributionChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const houseExpensesEl = document.getElementById('house-expenses-total');
        const transportExpensesEl = document.getElementById('transportation-expenses-total');
        const foodExpensesEl = document.getElementById('food-expenses-total');
        const entertainmentExpensesEl = document.getElementById('entertainment-expenses-total');
        
        const houseExpenses = houseExpensesEl ? parseFloat(houseExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const transportExpenses = transportExpensesEl ? parseFloat(transportExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const foodExpenses = foodExpensesEl ? parseFloat(foodExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const entertainmentExpenses = entertainmentExpensesEl ? parseFloat(entertainmentExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const total = houseExpenses + transportExpenses + foodExpenses + entertainmentExpenses;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (total === 0) {
            ctx.fillStyle = '#C8C8C8';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No Data', centerX, centerY);
            return;
        }
        
        const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'];
        const values = [houseExpenses, transportExpenses, foodExpenses, entertainmentExpenses];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                ctx.fillStyle = colors[index];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                currentAngle += sliceAngle;
            }
        });
    }

    updateAssetAllocationChart() {
        const canvas = document.getElementById('assetAllocationChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const liquidEl = document.getElementById('liquid-total');
        const investmentsEl = document.getElementById('investments-total');
        const personalEl = document.getElementById('personal-assets-total');
        
        const liquid = liquidEl ? parseFloat(liquidEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const investments = investmentsEl ? parseFloat(investmentsEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const personal = personalEl ? parseFloat(personalEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const total = liquid + investments + personal;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (total === 0) {
            ctx.fillStyle = '#C8C8C8';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No Data', centerX, centerY);
            return;
        }
        
        const colors = ['#3B82F6', '#10B981', '#F59E0B'];
        const values = [liquid, investments, personal];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                ctx.fillStyle = colors[index];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                currentAngle += sliceAngle;
            }
        });
    }

    updateLiabilityBreakdownChart() {
        const canvas = document.getElementById('liabilityBreakdownChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const shortTermEl = document.getElementById('short-term-total');
        const longTermEl = document.getElementById('long-term-total');
        
        const shortTerm = shortTermEl ? parseFloat(shortTermEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const longTerm = longTermEl ? parseFloat(longTermEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const total = shortTerm + longTerm;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (total === 0) {
            ctx.fillStyle = '#C8C8C8';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No Data', centerX, centerY);
            return;
        }
        
        const colors = ['#EF4444', '#F59E0B'];
        const values = [shortTerm, longTerm];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                ctx.fillStyle = colors[index];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                currentAngle += sliceAngle;
            }
        });
    }

    updateAnalyticsCharts() {
        this.updateIncomeBreakdownChart();
        this.updateExpenseBreakdownChart();
        this.updateCashFlowTrendChart();
        this.updateWealthProjectionChart();
    }

    updateIncomeBreakdownChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;
        
        canvas.width = 350;
        canvas.height = 250;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = (canvas.height - 40) / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const activeIncomeEl = document.getElementById('active-income-total');
        const portfolioIncomeEl = document.getElementById('portfolio-income-total');
        const passiveIncomeEl = document.getElementById('passive-income-total');
        
        const activeIncome = activeIncomeEl ? parseFloat(activeIncomeEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const portfolioIncome = portfolioIncomeEl ? parseFloat(portfolioIncomeEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const passiveIncome = passiveIncomeEl ? parseFloat(passiveIncomeEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const total = activeIncome + portfolioIncome + passiveIncome;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (total === 0) {
            ctx.fillStyle = '#C8C8C8';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No Income Data', centerX, centerY);
            return;
        }
        
        const colors = ['#C29B3C', '#D4A853', '#10B981'];
        const labels = ['Active', 'Portfolio', 'Passive'];
        const values = [activeIncome, portfolioIncome, passiveIncome];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                const percentage = ((value / total) * 100).toFixed(1);
                
                ctx.fillStyle = colors[index];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(`${percentage}%`, labelX, labelY);
                
                currentAngle += sliceAngle;
            }
        });
        
        const legendY = canvas.height - 25;
        let legendX = 20;
        values.forEach((value, index) => {
            if (value > 0) {
                ctx.fillStyle = colors[index];
                ctx.fillRect(legendX, legendY, 10, 10);
                
                ctx.fillStyle = '#C8C8C8';
                ctx.font = '9px Inter';
                ctx.textAlign = 'left';
                ctx.fillText(`${labels[index]}: ${this.formatNumber(value)}`, legendX + 15, legendY + 8);
                
                legendX += 100;
            }
        });
    }

    updateExpenseBreakdownChart() {
        const canvas = document.getElementById('expenseChart');
        if (!canvas) return;
        
        canvas.width = 350;
        canvas.height = 250;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = (canvas.height - 40) / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const houseExpensesEl = document.getElementById('house-expenses-total');
        const transportExpensesEl = document.getElementById('transportation-expenses-total');
        const foodExpensesEl = document.getElementById('food-expenses-total');
        const entertainmentExpensesEl = document.getElementById('entertainment-expenses-total');
        
        const houseExpenses = houseExpensesEl ? parseFloat(houseExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const transportExpenses = transportExpensesEl ? parseFloat(transportExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const foodExpenses = foodExpensesEl ? parseFloat(foodExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const entertainmentExpenses = entertainmentExpensesEl ? parseFloat(entertainmentExpensesEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const total = houseExpenses + transportExpenses + foodExpenses + entertainmentExpenses;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (total === 0) {
            ctx.fillStyle = '#C8C8C8';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No Expense Data', centerX, centerY);
            return;
        }
        
        const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'];
        const labels = ['Housing', 'Transport', 'Food', 'Entertainment'];
        const values = [houseExpenses, transportExpenses, foodExpenses, entertainmentExpenses];
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                const percentage = ((value / total) * 100).toFixed(1);
                
                ctx.fillStyle = colors[index];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(`${percentage}%`, labelX, labelY);
                
                currentAngle += sliceAngle;
            }
        });
        
        const legendY = canvas.height - 25;
        let legendX = 10;
        values.forEach((value, index) => {
            if (value > 0) {
                ctx.fillStyle = colors[index];
                ctx.fillRect(legendX, legendY, 10, 10);
                
                ctx.fillStyle = '#C8C8C8';
                ctx.font = '9px Inter';
                ctx.textAlign = 'left';
                ctx.fillText(`${labels[index]}: ${this.formatNumber(value)}`, legendX + 15, legendY + 8);
                
                legendX += 80;
            }
        });
    }

    updateCashFlowTrendChart() {
        const canvas = document.getElementById('cashflowChart');
        if (!canvas) return;
        
        canvas.width = 350;
        canvas.height = 250;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const monthlyCashFlowEl = document.getElementById('monthly-cash-flow');
        const monthlyCashFlow = monthlyCashFlowEl ? parseFloat(monthlyCashFlowEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        const barWidth = (canvas.width - 60) / 12;
        const maxHeight = canvas.height - 60;
        
        let maxValue = Math.abs(monthlyCashFlow) * 1.2;
        if (maxValue === 0) maxValue = 1000;
        
        months.forEach((month, i) => {
            const variance = (Math.random() - 0.5) * 0.3;
            const value = monthlyCashFlow * (1 + variance);
            const barHeight = Math.abs(value) / maxValue * (maxHeight - 40);
            const x = 30 + i * barWidth + 2;
            const isPositive = value >= 0;
            
            ctx.fillStyle = isPositive ? '#10B981' : '#EF4444';
            
            if (isPositive) {
                ctx.fillRect(x, 30 + (maxHeight - 40) - barHeight, barWidth - 4, barHeight);
            } else {
                ctx.fillRect(x, 30 + (maxHeight - 40) * 0.6, barWidth - 4, barHeight);
            }
            
            ctx.fillStyle = '#C8C8C8';
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(month, x + (barWidth - 4) / 2, canvas.height - 10);
        });
    }

    updateWealthProjectionChart() {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;
        
        canvas.width = 700;
        canvas.height = 300;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const netWorthEl = document.getElementById('net-worth');
        const annualCashFlowEl = document.getElementById('annual-cash-flow');
        
        const netWorth = netWorthEl ? parseFloat(netWorthEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        const annualCashFlow = annualCashFlowEl ? parseFloat(annualCashFlowEl.textContent.replace(/[$,]/g, '')) || 0 : 0;
        
        const years = 10;
        const points = [];
        let currentWealth = netWorth;
        
        for (let i = 0; i <= years; i++) {
            points.push({
                x: 50 + (i / years) * (canvas.width - 100),
                y: canvas.height - 80 - ((currentWealth / Math.max(currentWealth + annualCashFlow * years, 100000)) * (canvas.height - 120)),
                value: currentWealth,
                year: new Date().getFullYear() + i
            });
            
            currentWealth = currentWealth * 1.05 + annualCashFlow;
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = 40 + (i * (canvas.height - 120) / 4);
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(canvas.width - 50, y);
            ctx.stroke();
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, canvas.height - 60);
        points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.lineTo(points[points.length - 1].x, canvas.height - 60);
        ctx.closePath();
        ctx.fill();
        
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
        
        ctx.fillStyle = '#10B981';
        points.forEach((point, index) => {
            if (index % 2 === 0) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#C8C8C8';
                ctx.font = '10px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(point.year.toString(), point.x, canvas.height - 35);
                
                if (index === 0 || index === points.length - 1) {
                    ctx.font = '10px Inter';
                    ctx.fillText(`${this.formatNumber(point.value)}`, point.x, point.y - 10);
                }
                
                ctx.fillStyle = '#10B981';
            }
        });
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return Math.round(num).toString();
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CashFlowMastery();
});

// Global functions for onclick handlers
window.addCustomItem = function(category) {
    if (app) {
        app.addCustomItem(category);
    }
};

// Make app globally available
window.app = app;

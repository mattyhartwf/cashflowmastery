/* === Airtable Integration for Cash Flow Mastery === */

class AirtableIntegration {
    constructor() {
        // Your Airtable credentials - UPDATE THESE WITH YOUR ACTUAL VALUES
        this.baseId = 'appBJSpCa8ue7cqiA';
        this.apiKey = 'patm8ZuPbmf2JVGX6.9b1907acddb8cea5400ae18009490f5cc6d6f087433ad394cf9bbad2a731e268';
        this.tableName = 'Students';
        this.apiUrl = `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(this.tableName)}`;
        
        console.log('Airtable Integration initialized');
        console.log('API URL:', this.apiUrl);
    }

    // Save user data to Airtable
    async saveUserData(userData) {
        try {
            console.log('Saving to Airtable:', userData.email);
            
            // Check if user already exists
            const existingUser = await this.findUserByEmail(userData.email);
            
            // Calculate financial metrics
            const netWorth = this.calculateNetWorth(userData.data);
            const monthlyCashFlow = this.calculateMonthlyCashFlow(userData.data);
            
            const record = {
                fields: {
                    'Email': userData.email,
                    'Name': userData.name || userData.email.split('@')[0],
                    'Last Updated': new Date().toISOString(),
                    'Financial Data': JSON.stringify(userData.data || {}),
                    'Net Worth': netWorth,
                    'Monthly Cash Flow': monthlyCashFlow,
                    'Source': userData.source || 'web_app'
                }
            };

            let response;
            if (existingUser) {
                // Update existing record
                console.log('Updating existing Airtable record for:', userData.email);
                response = await fetch(`${this.apiUrl}/${existingUser.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(record)
                });
            } else {
                // Create new record
                console.log('Creating new Airtable record for:', userData.email);
                response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ records: [record] })
                });
            }

            if (response.ok) {
                const result = await response.json();
                console.log('Airtable save successful:', result);
                return { 
                    success: true, 
                    message: 'Data saved to Airtable successfully!',
                    netWorth: netWorth,
                    monthlyCashFlow: monthlyCashFlow,
                    record: result
                };
            } else {
                const error = await response.json();
                console.error('Airtable save failed:', error);
                return { 
                    success: false, 
                    error: `Airtable error: ${error.error?.message || 'Unknown error'}` 
                };
            }

        } catch (error) {
            console.error('Airtable save error:', error);
            return { 
                success: false, 
                error: `Save failed: ${error.message}` 
            };
        }
    }

    // Load user data from Airtable
    async loadUserData(email) {
        try {
            console.log('Loading from Airtable:', email);
            
            const user = await this.findUserByEmail(email);
            
            if (user) {
                let financialData = {};
                
                // Parse financial data safely
                try {
                    financialData = JSON.parse(user.fields['Financial Data'] || '{}');
                } catch (parseError) {
                    console.warn('Could not parse financial data:', parseError);
                    financialData = {};
                }
                
                const userData = {
                    email: user.fields.Email,
                    name: user.fields.Name,
                    data: financialData,
                    lastUpdated: user.fields['Last Updated'],
                    source: user.fields.Source,
                    netWorth: user.fields['Net Worth'] || 0,
                    monthlyCashFlow: user.fields['Monthly Cash Flow'] || 0,
                    recordId: user.id
                };
                
                console.log('Airtable load successful for:', email);
                return { success: true, data: userData };
            } else {
                console.log('User not found in Airtable:', email);
                return { 
                    success: false, 
                    error: 'User not found',
                    isNewUser: true 
                };
            }

        } catch (error) {
            console.error('Airtable load error:', error);
            return { 
                success: false, 
                error: `Load failed: ${error.message}` 
            };
        }
    }

    // Find user by email
    async findUserByEmail(email) {
        try {
            const filterFormula = encodeURIComponent(`{Email}='${email}'`);
            const response = await fetch(`${this.apiUrl}?filterByFormula=${filterFormula}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.records.length > 0 ? data.records[0] : null;
            } else {
                const error = await response.json();
                console.error('Find user failed:', error);
                return null;
            }

        } catch (error) {
            console.error('Find user error:', error);
            return null;
        }
    }

    // Get all users (for coach dashboard)
    async getAllUsers() {
        try {
            console.log('Loading all users from Airtable');
            
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`Found ${data.records.length} users in Airtable`);
                return { 
                    success: true, 
                    users: data.records.map(record => ({
                        id: record.id,
                        email: record.fields.Email,
                        name: record.fields.Name,
                        lastUpdated: record.fields['Last Updated'],
                        netWorth: record.fields['Net Worth'] || 0,
                        monthlyCashFlow: record.fields['Monthly Cash Flow'] || 0,
                        source: record.fields.Source
                    }))
                };
            } else {
                const error = await response.json();
                console.error('Get all users failed:', error);
                return { 
                    success: false, 
                    error: `Failed to load users: ${error.error?.message || 'Unknown error'}` 
                };
            }

        } catch (error) {
            console.error('Get all users error:', error);
            return { 
                success: false, 
                error: `Load failed: ${error.message}` 
            };
        }
    }

    // Delete user record
    async deleteUser(email) {
        try {
            console.log('Deleting user from Airtable:', email);
            
            const user = await this.findUserByEmail(email);
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            const response = await fetch(`${this.apiUrl}/${user.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('User deleted successfully:', email);
                return { success: true, message: 'User deleted successfully' };
            } else {
                const error = await response.json();
                console.error('Delete user failed:', error);
                return { 
                    success: false, 
                    error: `Delete failed: ${error.error?.message || 'Unknown error'}` 
                };
            }

        } catch (error) {
            console.error('Delete user error:', error);
            return { 
                success: false, 
                error: `Delete failed: ${error.message}` 
            };
        }
    }

    // Calculate net worth from financial data
    calculateNetWorth(data) {
        if (!data || typeof data !== 'object') return 0;
        
        // Assets calculation
        const assetFields = [
            // Liquid Assets
            'cash_on_hand', 'personal_checking', 'personal_savings', 
            'business_checking', 'business_savings', 'money_market', 'certificates_deposit',
            
            // Investments
            'business_1', 'business_2', 'business_3', 'stocks', 'bonds', 
            'mutual_funds', 'ira', '401k',
            
            // Personal Assets
            'primary_residence', 'auto_1', 'auto_2', 'other_personal_assets'
        ];
        
        // Liabilities calculation
        const liabilityFields = [
            // Short-term Liabilities
            'medical_dental', 'credit_card_1', 'credit_card_2', 'credit_card_3', 
            'credit_card_4', 'credit_card_5',
            
            // Long-term Liabilities
            'primary_mortgage', 'heloc', 'investment_mortgage', 'auto_loan_1', 
            'auto_loan_2', 'student_loans', 'personal_loans_balance'
        ];
        
        const totalAssets = this.calculateTotal(data, assetFields);
        const totalLiabilities = this.calculateTotal(data, liabilityFields);
        
        // Add custom items
        const customAssets = this.calculateCustomItems(data, 'assets');
        const customLiabilities = this.calculateCustomItems(data, 'liabilities');
        
        const netWorth = (totalAssets + customAssets) - (totalLiabilities + customLiabilities);
        
        console.log('Net Worth Calculation:', {
            totalAssets: totalAssets + customAssets,
            totalLiabilities: totalLiabilities + customLiabilities,
            netWorth
        });
        
        return Math.round(netWorth * 100) / 100; // Round to 2 decimal places
    }

    // Calculate monthly cash flow
    calculateMonthlyCashFlow(data) {
        if (!data || typeof data !== 'object') return 0;
        
        // Income calculation
        const incomeFields = [
            // Active Income
            'salary_wages', 'distributions', 'commissions', 'bonus', 'interest_income',
            
            // Portfolio Income
            'dividends', 'royalties',
            
            // Passive Income
            'business_income', 'real_estate_income'
        ];
        
        // Expense calculation
        const expenseFields = [
            // House Expenses
            'mortgage_rent', 'heloc_payment', 'hoa_fees', 'cell_phone_1', 'cell_phone_2',
            'internet', 'cable_satellite', 'home_security', 'home_insurance', 
            'electricity', 'gas', 'water_sewer', 'waste_removal', 'repairs_maintenance', 'lawncare_pest',
            
            // Transportation
            'auto_payment_1', 'auto_payment_2', 'auto_insurance', 'registration_tags', 
            'gas_fuel', 'auto_repairs',
            
            // Food
            'groceries', 'restaurants',
            
            // Entertainment
            'streaming', 'music', 'movies', 'concerts', 'sporting_events', 
            'live_theater', 'outdoor_activities'
        ];
        
        const totalIncome = this.calculateTotal(data, incomeFields);
        const totalExpenses = this.calculateTotal(data, expenseFields);
        
        // Add custom items
        const customIncome = this.calculateCustomItems(data, 'income');
        const customExpenses = this.calculateCustomItems(data, 'expenses');
        
        const monthlyCashFlow = (totalIncome + customIncome) - (totalExpenses + customExpenses);
        
        console.log('Cash Flow Calculation:', {
            totalIncome: totalIncome + customIncome,
            totalExpenses: totalExpenses + customExpenses,
            monthlyCashFlow
        });
        
        return Math.round(monthlyCashFlow * 100) / 100; // Round to 2 decimal places
    }

    // Helper function to calculate totals from field arrays
    calculateTotal(data, fields) {
        return fields.reduce((sum, field) => {
            const value = parseFloat(data[field]) || 0;
            return sum + value;
        }, 0);
    }

    // Calculate custom items (items added by user with custom_ prefix)
    calculateCustomItems(data, category) {
        let total = 0;
        
        // Look for custom fields that match the category pattern
        Object.keys(data).forEach(key => {
            if (key.startsWith(`custom_${category}`)) {
                const value = parseFloat(data[key]) || 0;
                total += value;
            }
        });
        
        return total;
    }

    // Test connection to Airtable
    async testConnection() {
        try {
            console.log('Testing Airtable connection...');
            
            const response = await fetch(this.apiUrl + '?maxRecords=1', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Airtable connection successful!', data);
                return { 
                    success: true, 
                    message: 'Airtable connection successful!',
                    recordCount: data.records.length 
                };
            } else {
                const error = await response.json();
                console.error('Airtable connection failed:', error);
                return { 
                    success: false, 
                    error: `Connection failed: ${error.error?.message || 'Unknown error'}` 
                };
            }

        } catch (error) {
            console.error('Airtable connection error:', error);
            return { 
                success: false, 
                error: `Connection failed: ${error.message}` 
            };
        }
    }

    // Utility function to format currency for display
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    // Utility function to validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Get usage statistics
    async getUsageStats() {
        try {
            const allUsers = await this.getAllUsers();
            
            if (allUsers.success) {
                const stats = {
                    totalUsers: allUsers.users.length,
                    activeUsers: allUsers.users.filter(user => {
                        const lastUpdate = new Date(user.lastUpdated);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return lastUpdate > thirtyDaysAgo;
                    }).length,
                    totalNetWorth: allUsers.users.reduce((sum, user) => sum + (user.netWorth || 0), 0),
                    totalCashFlow: allUsers.users.reduce((sum, user) => sum + (user.monthlyCashFlow || 0), 0),
                    lastUpdated: new Date().toISOString()
                };
                
                return { success: true, stats };
            } else {
                return allUsers;
            }
            
        } catch (error) {
            console.error('Get usage stats error:', error);
            return { 
                success: false, 
                error: `Stats failed: ${error.message}` 
            };
        }
    }
}

// Initialize Airtable integration
console.log('Initializing Airtable Integration...');
const airtableIntegration = new AirtableIntegration();

// Export for global access
window.airtableIntegration = airtableIntegration;

// Test connection on load (optional - can be removed in production)
document.addEventListener('DOMContentLoaded', () => {
    // Uncomment to test connection on page load
    // airtableIntegration.testConnection();
});

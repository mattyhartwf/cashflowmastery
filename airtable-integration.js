/* === Airtable Integration for Cash Flow Mastery === */

class AirtableIntegration {
    constructor() {
        // Your Airtable credentials
        this.baseId = 'appBJSpCa8ue7cqiA';
        this.apiKey = 'patm8ZuPbmf2JVGX6.9b1907acddb8cea5400ae18009490f5cc6d6f087433ad394cf9bbad2a731e268';
        this.tableName = 'Students';
        this.apiUrl = `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(this.tableName)}`;
        
        console.log('Airtable Integration initialized');
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
                    'Source': userData.source || 'app',
                    'Is Coach': userData.isCoach || false,
                    'Saved By Coach': userData.savedByCoach || ''
                }
            };

            let response;
            if (existingUser) {
                // Update existing record
                console.log('Updating existing Airtable record');
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
                console.log('Creating new Airtable record');
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
                    monthlyCashFlow: monthlyCashFlow
                };
            } else {
                const error = await response.json();
                console.error('Airtable save failed:', error);
                return { success: false, error: `Airtable error: ${error.error.message}` };
            }

        } catch (error) {
            console.error('Airtable save error:', error);
            return { success: false, error: `Save failed: ${error.message}` };
        }
    }

    // Load user data from Airtable
    async loadUserData(email) {
        try {
            console.log('Loading from Airtable:', email);
            
            const user = await this.findUserByEmail(email);
            
            if (user) {
                const userData = {
                    email: user.fields.Email,
                    name: user.fields.Name,
                    data: JSON.parse(user.fields['Financial Data'] || '{}'),
                    lastUpdated: user.fields['Last Updated'],
                    source: user.fields.Source,
                    netWorth: user.fields['Net Worth'],
                    monthlyCashFlow: user.fields['Monthly Cash Flow']
                };
                
                console.log('Airtable load successful');
                return { success: true, data: userData };
            } else {
                console.log('User not found in Airtable');
                return { success: false, error: 'User not found' };
            }

        } catch (error) {
            console.error('Airtable load error:', error);
            return { success: false, error: `Load failed: ${error.message}` };
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
                console.error('Find user failed:', response.status);
                return null;
            }

        } catch (error) {
            console.error('Find user error:', error);
            return null;
        }
    }

    // Calculate net worth from financial data
    calculateNetWorth(data) {
        if (!data) return 0;
        
        const assets = this.calculateTotal(data, [
            'cash_on_hand', 'personal_checking', 'personal_savings', 'business_checking', 'business_savings',
            'money_market', 'certificates_deposit', 'business_1', 'business_2', 'business_3',
            'stocks', 'bonds', 'mutual_funds', 'ira', '401k', 'primary_residence', 'auto_1', 'auto_2', 'other_personal_assets'
        ]);
        
        const liabilities = this.calculateTotal(data, [
            'medical_dental', 'credit_card_1', 'credit_card_2', 'credit_card_3', 'credit_card_4', 'credit_card_5',
            'primary_mortgage', 'heloc', 'investment_mortgage', 'auto_loan_1', 'auto_loan_2', 'student_loans', 'personal_loans_balance'
        ]);
        
        return assets - liabilities;
    }

    // Calculate monthly cash flow
    calculateMonthlyCashFlow(data) {
        if (!data) return 0;
        
        const income = this.calculateTotal(data, [
            'salary_wages', 'distributions', 'commissions', 'bonus', 'interest_income',
            'dividends', 'royalties', 'business_income', 'real_estate_income'
        ]);
        
        const expenses = this.calculateTotal(data, [
            'mortgage_rent', 'heloc_payment', 'hoa_fees', 'cell_phone_1', 'cell_phone_2',
            'internet', 'cable_satellite', 'home_security', 'home_insurance', 'electricity', 'gas',
            'water_sewer', 'waste_removal', 'repairs_maintenance', 'lawncare_pest',
            'auto_payment_1', 'auto_payment_2', 'auto_insurance', 'registration_tags', 'gas_fuel', 'auto_repairs',
            'groceries', 'restaurants', 'streaming', 'music', 'movies', 'concerts', 'sporting_events',
            'live_theater', 'outdoor_activities'
        ]);
        
        return income - expenses;
    }

    // Helper function to calculate totals
    calculateTotal(data, fields) {
        return fields.reduce((sum, field) => {
            const value = parseFloat(data[field]) || 0;
            return sum + value;
        }, 0);
    }

    // Test connection to Airtable
    async testConnection() {
        try {
            const response = await fetch(this.apiUrl + '?maxRecords=1', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return { success: true, message: 'Airtable connection successful!' };
            } else {
                const error = await response.json();
                return { success: false, error: `Connection failed: ${error.error.message}` };
            }

        } catch (error) {
            return { success: false, error: `Connection failed: ${error.message}` };
        }
    }
}

// Initialize Airtable integration
console.log('Initializing Airtable Integration...');
window.airtableIntegration = new AirtableIntegration();

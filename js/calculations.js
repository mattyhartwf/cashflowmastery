/* === Wealth Factory - Financial Calculations Engine === */

class FinancialCalculations {
    constructor() {
        this.ratios = {
            emergency: 6, // months of expenses
            debtToIncome: 36, // maximum percentage
            savingsRate: 20, // recommended percentage
            housingRatio: 28 // percentage of gross income
        };
    }

    // Balance Sheet Calculations
    calculateNetWorth(assets, liabilities) {
        return {
            totalAssets: this.sumObject(assets),
            totalLiabilities: this.sumObject(liabilities),
            netWorth: this.sumObject(assets) - this.sumObject(liabilities)
        };
    }

    calculateAssetAllocation(assets) {
        const total = this.sumObject(assets);
        const allocation = {};
        
        Object.entries(assets).forEach(([key, value]) => {
            allocation[key] = {
                amount: value,
                percentage: total > 0 ? (value / total) * 100 : 0
            };
        });
        
        return allocation;
    }

    calculateLiquidityRatio(liquidAssets, totalAssets) {
        return totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0;
    }

    calculateDebtToAssetRatio(totalLiabilities, totalAssets) {
        return totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    }

    // Cash Flow Calculations
    calculateCashFlow(income, expenses) {
        const totalIncome = this.sumObject(income);
        const totalExpenses = this.sumObject(expenses);
        
        return {
            totalIncome,
            totalExpenses,
            monthlyCashFlow: totalIncome - totalExpenses,
            annualCashFlow: (totalIncome - totalExpenses) * 12,
            savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
        };
    }

    calculateIncomeStreams(incomeData) {
        const streams = {
            active: 0,
            passive: 0,
            portfolio: 0
        };
        
        // Active income sources
        const activeFields = ['salary_wages', 'distributions', 'commissions', 'bonus'];
        streams.active = activeFields.reduce((sum, field) => sum + (incomeData[field] || 0), 0);
        
        // Passive income sources
        const passiveFields = ['business_income', 'real_estate_income'];
        streams.passive = passiveFields.reduce((sum, field) => sum + (incomeData[field] || 0), 0);
        
        // Portfolio income sources
        const portfolioFields = ['dividends', 'royalties', 'interest_income'];
        streams.portfolio = portfolioFields.reduce((sum, field) => sum + (incomeData[field] || 0), 0);
        
        const total = streams.active + streams.passive + streams.portfolio;
        
        return {
            ...streams,
            total,
            diversification: {
                activePercentage: total > 0 ? (streams.active / total) * 100 : 0,
                passivePercentage: total > 0 ? (streams.passive / total) * 100 : 0,
                portfolioPercentage: total > 0 ? (streams.portfolio / total) * 100 : 0
            }
        };
    }

    calculateExpenseCategories(expenseData) {
        const categories = {
            housing: ['mortgage_rent', 'heloc_payment', 'hoa_fees', 'electricity', 'gas', 'water_sewer', 'waste_removal', 'repairs_maintenance', 'lawncare_pest'],
            transportation: ['auto_payment_1', 'auto_payment_2', 'auto_insurance', 'registration_tags', 'gas_fuel', 'auto_repairs'],
            food: ['groceries', 'restaurants'],
            entertainment: ['streaming', 'music', 'movies', 'concerts', 'sporting_events', 'live_theater', 'outdoor_activities'],
            communication: ['cell_phone_1', 'cell_phone_2'],
            children: ['childcare', 'school_supplies', 'children_activities'],
            pets: ['pet_care', 'pet_food'],
            gifts: ['birthday_gifts', 'christmas_gifts', 'anniversary_wedding']
        };
        
        const totals = {};
        let grandTotal = 0;
        
        Object.entries(categories).forEach(([category, fields]) => {
            const categoryTotal = fields.reduce((sum, field) => sum + (expenseData[field] || 0), 0);
            totals[category] = categoryTotal;
            grandTotal += categoryTotal;
        });
        
        // Calculate percentages
        const percentages = {};
        Object.entries(totals).forEach(([category, amount]) => {
            percentages[category] = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
        });
        
        return {
            totals,
            percentages,
            grandTotal
        };
    }

    // Financial Health Calculations
    calculateFinancialHealth(financialData) {
        const { assets, liabilities, income, expenses } = financialData;
        
        const netWorthData = this.calculateNetWorth(assets, liabilities);
        const cashFlowData = this.calculateCashFlow(income, expenses);
        const liquidAssets = this.calculateLiquidAssets(assets);
        
        const debtToIncomeRatio = this.calculateDebtToIncomeRatio(
            netWorthData.totalLiabilities, 
            cashFlowData.totalIncome * 12
        );
        
        const emergencyFundMonths = this.calculateEmergencyFundCoverage(
            liquidAssets, 
            cashFlowData.totalExpenses
        );
        
        const housingRatio = this.calculateHousingRatio(expenses, income);
        
        // Calculate overall health score
        const healthScore = this.calculateHealthScore({
            debtToIncomeRatio,
            savingsRate: cashFlowData.savingsRate,
            emergencyFundMonths,
            housingRatio,
            netWorth: netWorthData.netWorth
        });
        
        return {
            score: healthScore,
            metrics: {
                debtToIncomeRatio,
                savingsRate: cashFlowData.savingsRate,
                emergencyFundMonths,
                housingRatio,
                liquidityRatio: this.calculateLiquidityRatio(liquidAssets, netWorthData.totalAssets)
            },
            recommendations: this.generateRecommendations({
                debtToIncomeRatio,
                savingsRate: cashFlowData.savingsRate,
                emergencyFundMonths,
                housingRatio
            })
        };
    }

    calculateHealthScore(metrics) {
        let score = 100;
        
        // Debt-to-income ratio impact (30 points max penalty)
        if (metrics.debtToIncomeRatio > 50) {
            score -= 30;
        } else if (metrics.debtToIncomeRatio > 36) {
            score -= 20;
        } else if (metrics.debtToIncomeRatio > 20) {
            score -= 10;
        }
        
        // Savings rate impact (25 points max penalty/bonus)
        if (metrics.savingsRate < 0) {
            score -= 25;
        } else if (metrics.savingsRate < 10) {
            score -= 15;
        } else if (metrics.savingsRate >= 20) {
            score += 10;
        }
        
        // Emergency fund impact (20 points max penalty)
        if (metrics.emergencyFundMonths < 1) {
            score -= 20;
        } else if (metrics.emergencyFundMonths < 3) {
            score -= 15;
        } else if (metrics.emergencyFundMonths < 6) {
            score -= 5;
        }
        
        // Housing ratio impact (15 points max penalty)
        if (metrics.housingRatio > 40) {
            score -= 15;
        } else if (metrics.housingRatio > 28) {
            score -= 10;
        }
        
        // Net worth impact (10 points max bonus/penalty)
        if (metrics.netWorth < 0) {
            score -= 10;
        } else if (metrics.netWorth > 100000) {
            score += 10;
        } else if (metrics.netWorth > 50000) {
            score += 5;
        }
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.debtToIncomeRatio > 36) {
            recommendations.push({
                priority: 'high',
                category: 'debt',
                title: 'Reduce Debt-to-Income Ratio',
                description: 'Your debt payments are consuming too much of your income. Consider debt consolidation or aggressive debt payoff strategies.',
                target: '36% or less'
            });
        }
        
        if (metrics.savingsRate < 10) {
            recommendations.push({
                priority: 'high',
                category: 'savings',
                title: 'Increase Savings Rate',
                description: 'Aim to save at least 10-20% of your income. Review your expenses and identify areas to cut back.',
                target: '20% or more'
            });
        }
        
        if (metrics.emergencyFundMonths < 6) {
            recommendations.push({
                priority: 'medium',
                category: 'emergency',
                title: 'Build Emergency Fund',
                description: 'Establish an emergency fund covering 3-6 months of expenses in a readily accessible account.',
                target: '6 months of expenses'
            });
        }
        
        if (metrics.housingRatio > 28) {
            recommendations.push({
                priority: 'medium',
                category: 'housing',
                title: 'Optimize Housing Costs',
                description: 'Housing costs should ideally be 28% or less of gross income. Consider refinancing or downsizing.',
                target: '28% or less of income'
            });
        }
        
        return recommendations;
    }

    // Investment and Growth Calculations
    calculateInvestmentGrowth(principal, annualContribution, rate, years) {
        let balance = principal;
        const yearlyBalances = [balance];
        
        for (let year = 1; year <= years; year++) {
            balance = (balance + annualContribution) * (1 + rate);
            yearlyBalances.push(balance);
        }
        
        return {
            finalBalance: balance,
            totalContributions: principal + (annualContribution * years),
            totalGrowth: balance - principal - (annualContribution * years),
            yearlyBalances
        };
    }

    calculateRetirementNeeds(currentAge, retirementAge, currentIncome, inflationRate = 0.03, withdrawalRate = 0.04) {
        const yearsToRetirement = retirementAge - currentAge;
        const retirementYears = 25; // Assume 25 years in retirement
        
        // Adjust income for inflation
        const futureIncome = currentIncome * Math.pow(1 + inflationRate, yearsToRetirement);
        
        // Calculate needed retirement corpus (25x annual expenses rule)
        const neededCorpus = (futureIncome * 0.8) / withdrawalRate;
        
        return {
            yearsToRetirement,
            futureIncomeNeeded: futureIncome * 0.8, // 80% of current income
            neededCorpus,
            monthlyContributionNeeded: this.calculateMonthlyContribution(neededCorpus, yearsToRetirement, 0.07)
        };
    }

    calculateMonthlyContribution(futureValue, years, annualRate) {
        const monthlyRate = annualRate / 12;
        const months = years * 12;
        
        if (monthlyRate === 0) {
            return futureValue / months;
        }
        
        return futureValue * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    }

    // Debt Management Calculations
    calculateDebtPayoff(balance, interestRate, monthlyPayment) {
        const monthlyRate = interestRate / 12 / 100;
        let currentBalance = balance;
        let month = 0;
        let totalInterest = 0;
        const paymentSchedule = [];
        
        while (currentBalance > 0.01 && month < 600) { // Max 50 years
            month++;
            const interestPayment = currentBalance * monthlyRate;
            const principalPayment = Math.min(monthlyPayment - interestPayment, currentBalance);
            
            totalInterest += interestPayment;
            currentBalance -= principalPayment;
            
            paymentSchedule.push({
                month,
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, currentBalance)
            });
            
            if (principalPayment <= 0) break; // Payment too low to cover interest
        }
        
        return {
            monthsToPayoff: month,
            totalInterest,
            totalPayments: monthlyPayment * month,
            paymentSchedule
        };
    }

    calculateDebtAvalanche(debts) {
        // Sort debts by interest rate (highest first)
        const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
        
        let totalMonthlyPayment = sortedDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
        let extraPayment = 0;
        
        // Simulate avalanche payoff
        const payoffPlan = sortedDebts.map(debt => {
            const payoffData = this.calculateDebtPayoff(
                debt.balance, 
                debt.interestRate, 
                debt.minimumPayment + extraPayment
            );
            
            return {
                ...debt,
                ...payoffData
            };
        });
        
        return payoffPlan;
    }

    // Utility Methods
    sumObject(obj) {
        return Object.values(obj).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
    }

    calculateLiquidAssets(assets) {
        const liquidFields = [
            'cash_on_hand', 'personal_checking', 'personal_savings',
            'business_checking', 'business_savings', 'money_market', 'certificates_deposit'
        ];
        
        return liquidFields.reduce((sum, field) => sum + (assets[field] || 0), 0);
    }

    calculateDebtToIncomeRatio(totalDebt, annualIncome) {
        return annualIncome > 0 ? (totalDebt / annualIncome) * 100 : 0;
    }

    calculateEmergencyFundCoverage(liquidAssets, monthlyExpenses) {
        return monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
    }

    calculateHousingRatio(expenses, income) {
        const housingExpenses = [
            'mortgage_rent', 'hoa_fees', 'electricity', 'gas', 
            'water_sewer', 'waste_removal', 'repairs_maintenance'
        ].reduce((sum, field) => sum + (expenses[field] || 0), 0);
        
        const totalIncome = this.sumObject(income);
        return totalIncome > 0 ? (housingExpenses / totalIncome) * 100 : 0;
    }

    // Tax Calculations
    calculateTaxBracket(income, filingStatus = 'single') {
        // 2024 tax brackets (simplified)
        const brackets = {
            single: [
                { min: 0, max: 11000, rate: 0.10 },
                { min: 11000, max: 44725, rate: 0.12 },
                { min: 44725, max: 95375, rate: 0.22 },
                { min: 95375, max: 182050, rate: 0.24 },
                { min: 182050, max: 231250, rate: 0.32 },
                { min: 231250, max: 578125, rate: 0.35 },
                { min: 578125, max: Infinity, rate: 0.37 }
            ]
        };
        
        const applicableBrackets = brackets[filingStatus] || brackets.single;
        let tax = 0;
        let marginalRate = 0;
        
        for (const bracket of applicableBrackets) {
            if (income > bracket.min) {
                const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
                tax += taxableInBracket * bracket.rate;
                marginalRate = bracket.rate;
            }
        }
        
        return {
            totalTax: tax,
            effectiveRate: income > 0 ? (tax / income) * 100 : 0,
            marginalRate: marginalRate * 100,
            afterTaxIncome: income - tax
        };
    }

    // Inflation and Real Returns
    calculateRealReturn(nominalReturn, inflationRate) {
        return ((1 + nominalReturn) / (1 + inflationRate)) - 1;
    }

    adjustForInflation(amount, years, inflationRate = 0.03) {
        return amount * Math.pow(1 + inflationRate, years);
    }

    calculatePurchasingPower(currentAmount, years, inflationRate = 0.03) {
        return currentAmount / Math.pow(1 + inflationRate, years);
    }
}

// Export the calculations class
window.FinancialCalculations = FinancialCalculations;

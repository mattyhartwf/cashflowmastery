/* === Premium Chart Drawing Functions === */

class ChartDrawer {
    constructor() {
        this.colors = {
            primary: '#C29B3C',
            secondary: '#D4A853', 
            tertiary: '#E6BC67',
            quaternary: '#F0D084',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6'
        };
        
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We'll create custom legends
                }
            }
        };
    }

    // Draw Pie Chart
    drawPieChart(canvasId, data, colors = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate total
        const total = Object.values(data).reduce((sum, value) => sum + Math.abs(value), 0);
        
        if (total === 0) {
            this.drawEmptyChart(ctx, canvas.width, canvas.height, 'No Data');
            return;
        }

        // Use provided colors or default ones
        const chartColors = colors || [
            this.colors.primary,
            this.colors.secondary,
            this.colors.tertiary,
            this.colors.quaternary,
            this.colors.success,
            this.colors.warning,
            this.colors.error,
            this.colors.info
        ];

        let currentAngle = -Math.PI / 2; // Start at top
        let colorIndex = 0;

        Object.entries(data).forEach(([label, value]) => {
            if (value > 0) {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                // Draw slice
                ctx.fillStyle = chartColors[colorIndex % chartColors.length];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();

                // Draw slice border
                ctx.strokeStyle = '#002340';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw percentage label if slice is large enough
                if (sliceAngle > 0.2) {
                    const labelAngle = currentAngle + sliceAngle / 2;
                    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                    
                    const percentage = ((value / total) * 100).toFixed(0);
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 12px Inter';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Add background circle for text
                    ctx.beginPath();
                    ctx.arc(labelX, labelY, 15, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 35, 64, 0.8)';
                    ctx.fill();
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(`${percentage}%`, labelX, labelY);
                }

                currentAngle += sliceAngle;
                colorIndex++;
            }
        });

        // Draw center circle for donut effect
        ctx.fillStyle = '#002340';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Draw total in center
        ctx.fillStyle = this.colors.primary;
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Total', centerX, centerY - 8);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Inter';
        ctx.fillText(this.formatCurrency(total), centerX, centerY + 8);
    }

    // Draw Income Distribution Chart
    drawIncomeDistribution() {
        if (!window.app || !window.app.data) return;

        const data = window.app.data;
        const incomeData = {
            'Active': (data.salary_wages || 0) + (data.distributions || 0) + (data.commissions || 0) + (data.bonus || 0),
            'Portfolio': (data.dividends || 0) + (data.royalties || 0) + (data.interest_income || 0),
            'Passive': (data.business_income || 0) + (data.real_estate_income || 0)
        };

        this.drawPieChart('incomeDistributionChart', incomeData, [
            this.colors.success,
            this.colors.primary,
            this.colors.secondary
        ]);
    }

    // Draw Expense Distribution Chart
    drawExpenseDistribution() {
        if (!window.app || !window.app.data) return;

        const data = window.app.data;
        const expenseData = {
            'House': this.calculateHouseExpenses(data),
            'Transportation': this.calculateTransportationExpenses(data),
            'Food': (data.groceries || 0) + (data.restaurants || 0),
            'Entertainment': this.calculateEntertainmentExpenses(data),
            'Other': this.calculateOtherExpenses(data)
        };

        this.drawPieChart('expenseDistributionChart', expenseData, [
            this.colors.error,
            this.colors.warning,
            this.colors.info,
            this.colors.tertiary,
            this.colors.quaternary
        ]);
    }

    // Draw Asset Allocation Chart
    drawAssetAllocation() {
        if (!window.app || !window.app.data) return;

        const data = window.app.data;
        const assetData = {
            'Liquid': this.calculateLiquidAssets(data),
            'Investments': this.calculateInvestments(data),
            'Personal Use': this.calculatePersonalAssets(data)
        };

        this.drawPieChart('assetAllocationChart', assetData, [
            this.colors.primary,
            this.colors.success,
            this.colors.secondary
        ]);
    }

    // Draw Liability Breakdown Chart
    drawLiabilityBreakdown() {
        if (!window.app || !window.app.data) return;

        const data = window.app.data;
        const liabilityData = {
            'Short-term': this.calculateShortTermLiabilities(data),
            'Long-term': this.calculateLongTermLiabilities(data)
        };

        this.drawPieChart('liabilityBreakdownChart', liabilityData, [
            this.colors.error,
            this.colors.warning
        ]);
    }

    // Helper calculation functions
    calculateHouseExpenses(data) {
        return (data.mortgage_rent || 0) + (data.heloc_payment || 0) + (data.hoa_fees || 0) + 
               (data.cell_phone_1 || 0) + (data.cell_phone_2 || 0) + (data.electricity || 0) + 
               (data.gas || 0) + (data.water_sewer || 0) + (data.waste_removal || 0) + 
               (data.repairs_maintenance || 0) + (data.lawncare_pest || 0);
    }

    calculateTransportationExpenses(data) {
        return (data.auto_payment_1 || 0) + (data.auto_payment_2 || 0) + (data.auto_insurance || 0) + 
               (data.registration_tags || 0) + (data.gas_fuel || 0) + (data.auto_repairs || 0);
    }

    calculateEntertainmentExpenses(data) {
        return (data.streaming || 0) + (data.music || 0) + (data.movies || 0) + (data.concerts || 0) + 
               (data.sporting_events || 0) + (data.live_theater || 0) + (data.outdoor_activities || 0);
    }

    calculateOtherExpenses(data) {
        return (data.childcare || 0) + (data.school_supplies || 0) + (data.children_activities || 0) + 
               (data.pet_care || 0) + (data.pet_food || 0) + (data.birthday_gifts || 0) + 
               (data.christmas_gifts || 0) + (data.anniversary_wedding || 0);
    }

    calculateLiquidAssets(data) {
        return (data.cash_on_hand || 0) + (data.personal_checking || 0) + (data.personal_savings || 0) + 
               (data.business_checking || 0) + (data.business_savings || 0) + (data.money_market || 0) + 
               (data.certificates_deposit || 0);
    }

    calculateInvestments(data) {
        return (data.business_1 || 0) + (data.business_2 || 0) + (data.business_3 || 0) + 
               (data.stocks || 0) + (data.bonds || 0) + (data.mutual_funds || 0) + 
               (data.ira || 0) + (data['401k'] || 0);
    }

    calculatePersonalAssets(data) {
        return (data.primary_residence || 0) + (data.auto_1 || 0) + (data.auto_2 || 0) + 
               (data.other_personal_assets || 0);
    }

    calculateShortTermLiabilities(data) {
        return (data.medical_dental || 0) + (data.credit_card_1 || 0) + (data.credit_card_2 || 0) + 
               (data.credit_card_3 || 0) + (data.credit_card_4 || 0) + (data.credit_card_5 || 0);
    }

    calculateLongTermLiabilities(data) {
        return (data.primary_mortgage || 0) + (data.heloc || 0) + (data.investment_mortgage || 0) + 
               (data.auto_loan_1 || 0) + (data.auto_loan_2 || 0) + (data.student_loans || 0) + 
               (data.personal_loans_balance || 0);
    }

    // Draw empty chart placeholder
    drawEmptyChart(ctx, width, height, message = 'No Data') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#C29B3C';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, width / 2, height / 2);
    }

    // Update all charts
    updateAllCharts() {
        this.drawIncomeDistribution();
        this.drawExpenseDistribution();
        this.drawAssetAllocation();
        this.drawLiabilityBreakdown();
    }

    // Format currency for display
    formatCurrency(amount) {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        }
        return `$${amount.toFixed(0)}`;
    }

    // Initialize charts with empty data
    initializeCharts() {
        // Wait for DOM to be ready
        setTimeout(() => {
            this.updateAllCharts();
        }, 500);
    }
}

// Initialize chart drawer
let chartDrawer;
document.addEventListener('DOMContentLoaded', () => {
    chartDrawer = new ChartDrawer();
    chartDrawer.initializeCharts();
});

// Export for global access
window.ChartDrawer = ChartDrawer;

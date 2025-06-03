# Cash Flow Mastery Tool - Wealth Factory

A premium financial planning application with Airtable cloud storage integration.

## 🚀 Features

- **Complete Financial Dashboard**: Track income, expenses, assets, and liabilities
- **Real-time Calculations**: Automatic net worth and cash flow calculations
- **Cloud Storage**: Save and sync data using Airtable
- **Premium Charts**: Visual analytics and insights
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Export & Share**: Generate reports and share financial snapshots

## 📁 File Structure

```
├── index.html              # Main application (cleaned)
├── app.js                 # Core application logic (cleaned)
├── utils.js               # Utility functions (cleaned)
├── styles.css             # Main stylesheet
├── components.css         # Component styles
├── animations.css         # Animation effects
├── charts.js              # Chart drawing functions
├── airtable-integration.js # Airtable API integration
└── coach-airtable.html    # Coach dashboard (optional)
```

## 🔧 Setup Instructions

### 1. Airtable Configuration

1. **Create Airtable Base**:
   - Go to [Airtable.com](https://airtable.com)
   - Create a new base called "Cash Flow Mastery"

2. **Create Students Table**:
   ```
   Table Name: Students
   Fields:
   - Email (Single line text, Primary field)
   - Name (Single line text)
   - Last Updated (Date)
   - Financial Data (Long text)
   - Net Worth (Currency)
   - Monthly Cash Flow (Currency)
   - Source (Single select: web_app, coach_dashboard, manual_save)
   - Is Coach (Checkbox)
   - Saved By Coach (Single line text)
   ```

3. **Get API Credentials**:
   - Get your Base ID from the API documentation page
   - Generate a Personal Access Token with full permissions
   - Update `airtable-integration.js` with your credentials:

```javascript
this.baseId = 'YOUR_BASE_ID_HERE';
this.apiKey = 'YOUR_API_KEY_HERE';
```

### 2. File Updates Required

**Update airtable-integration.js**:
```javascript
// Line 4-5: Replace with your credentials
this.baseId = 'appYOURBASEID';
this.apiKey = 'patYOURAPIKEY';
```

### 3. Deployment

**Option A: Local Development**
1. Open `index.html` in a web browser
2. Start using the application immediately

**Option B: Web Hosting**
1. Upload all files to your web hosting provider
2. Ensure HTTPS is enabled for Airtable API calls
3. Configure CORS if needed

**Option C: Netlify (Recommended)**
1. Connect your GitHub repository to Netlify
2. Deploy automatically
3. Custom domain support available

## 🎯 How to Use

### For Individual Users

1. **Enter Your Information**:
   - Enter your email and name in the top section
   - Click "Load Data" to retrieve existing data
   - Or start entering your financial information

2. **Complete Your Financial Picture**:
   - **Income Statement Tab**: Enter all monthly income and expenses
   - **Balance Sheet Tab**: Enter assets and liabilities
   - **Analytics Tab**: View insights and projections

3. **Save Your Data**:
   - Click "Save Data" to store in Airtable
   - Data is automatically saved locally as backup
   - Use "Save to Cloud" button for manual sync

### For Coaches

1. **Use Coach Dashboard**:
   - Open `coach-airtable.html`
   - Enter your Airtable credentials
   - Search for students by email
   - Load and edit student data
   - Save changes back to Airtable

2. **Coach Features**:
   - View all students in a table
   - Quick financial metrics overview
   - Bulk data management
   - Direct Airtable integration

## 📊 Data Structure

### Financial Data Fields

**Income Categories**:
- Active Income: salary_wages, distributions, commissions, bonus, interest_income
- Portfolio Income: dividends, royalties
- Passive Income: business_income, real_estate_income

**Expense Categories**:
- House: mortgage_rent, utilities, insurance, maintenance
- Transportation: auto_payments, insurance, fuel, repairs
- Food: groceries, restaurants
- Entertainment: streaming, movies, concerts, activities

**Assets**:
- Liquid Assets: cash, checking, savings, money_market
- Investments: businesses, stocks, bonds, retirement_accounts
- Personal Assets: residence, vehicles, other_assets

**Liabilities**:
- Short-term: credit_cards, medical_debt
- Long-term: mortgages, auto_loans, student_loans

## 🔒 Security & Privacy

- **Data Encryption**: All data transmitted to Airtable via HTTPS
- **No Password Storage**: Uses email-based identification only
- **Local Backup**: Data automatically saved locally as fallback
- **Access Control**: Coach vs. individual user permissions
- **API Security**: Personal Access Tokens with limited scope

## 🚨 Removed Dependencies

The following have been cleaned from the codebase:
- ❌ LearnWorlds integration
- ❌ Complex authentication systems
- ❌ Firebase dependencies
- ❌ Google Sheets integration (kept in legacy files)
- ❌ Unused storage systems

## 🛠 Troubleshooting

### Common Issues

1. **"Failed to save to Airtable"**:
   - Check your API key and Base ID
   - Verify Airtable table structure matches requirements
   - Ensure HTTPS is enabled

2. **Charts not displaying**:
   - Check browser console for JavaScript errors
   - Ensure all files are properly linked
   - Try refreshing the page

3. **Data not loading**:
   - Verify email address is correct
   - Check Airtable for existing records
   - Try "Load Data" button again

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️  Internet Explorer not supported

## 📈 Performance Tips

- Use the latest version of modern browsers
- Enable JavaScript
- Stable internet connection for cloud sync
- Clear browser cache if experiencing issues

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor Airtable usage limits
- Update API keys as needed
- Backup Airtable data periodically
- Review and optimize performance

### Version Control
- Keep track of customizations
- Test changes in development environment
- Document any modifications

## 💡 Customization

### Adding Custom Fields
1. Update the HTML form inputs
2. Add field processing in `app.js`
3. Update Airtable integration calculations
4. Test thoroughly

### Styling Changes
- Modify `styles.css` for global changes
- Update `components.css` for specific components
- Use CSS custom properties for consistent theming

## 📞 Support

For technical issues:
1. Check browser console for errors
2. Verify Airtable configuration
3. Test with sample data
4. Review this documentation

## 🎉 Success Metrics

Track these KPIs:
- User engagement (data entry completion)
- Data accuracy (validation errors)
- Performance (load times)
- User satisfaction (feedback)

---

**Built with ❤️ for Wealth Factory**

*Last Updated: December 2024*

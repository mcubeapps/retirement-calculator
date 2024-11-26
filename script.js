// Debug flag - set to true to enable console logs
const DEBUG = true;

// Utility function for logging
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[Debug] ${message}`, data || '');
    }
}

// Configuration object
const CONFIG = {
    updateDelay: 100,
    defaultCurrency: 'USD',
    currencyFormats: {
        USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
        EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
        GBP: { locale: 'en-GB', currency: 'GBP', symbol: '£' },
        JPY: { locale: 'ja-JP', currency: 'JPY', symbol: '¥' },
        CAD: { locale: 'en-CA', currency: 'CAD', symbol: 'C$' },
        AUD: { locale: 'en-AU', currency: 'AUD', symbol: 'A$' },
        CNY: { locale: 'zh-CN', currency: 'CNY', symbol: '¥' },
        INR: { locale: 'en-IN', currency: 'INR', symbol: '₹' }
    }
};

// Global variables
let chart = null;
let currentAge = 30;
let retirementAge = 65;
let currentPortfolio = 50000;
let monthlyContribution = 500;
let annualReturn = 0.07;
let currentCurrency = CONFIG.defaultCurrency;
let currencyFormatter = new Intl.NumberFormat(
    CONFIG.currencyFormats[CONFIG.defaultCurrency].locale,
    {
        style: 'currency',
        currency: CONFIG.defaultCurrency,
        maximumFractionDigits: 0
    }
);

// Function to calculate portfolio growth
function calculatePortfolioGrowth() {
    try {
        const yearsToRetirement = retirementAge - currentAge;
        const annualContribution = monthlyContribution * 12;

        // Calculate growth per year
        let portfolioValue = currentPortfolio;
        const portfolioGrowth = [portfolioValue];
        
        for (let year = 1; year <= yearsToRetirement; year++) {
            portfolioValue = portfolioValue * (1 + annualReturn) + annualContribution;
            portfolioGrowth.push(portfolioValue);
        }

        debugLog('Portfolio growth data:', portfolioGrowth);
        updateChart(portfolioGrowth);
    } catch (error) {
        console.error('Error calculating growth:', error);
    }
}

// Function to update the chart
function updateChart(data) {
    try {
        const ctx = document.getElementById('growthChart');
        if (!ctx) {
            throw new Error('Chart canvas not found');
        }

        if (chart) {
            chart.destroy();
        }

        const currencySymbol = CONFIG.currencyFormats[currentCurrency].symbol;

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: data.length }, (_, i) => currentAge + i),
                datasets: [{
                    label: 'Portfolio Value Over Time',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: `Portfolio Value (${currencySymbol})`
                        },
                        ticks: {
                            callback: value => currencyFormatter.format(value)
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => {
                                return [
                                    `Portfolio Value: ${currencyFormatter.format(context.raw)}`,
                                    `Return Rate: ${(annualReturn * 100).toFixed(1)}%`
                                ];
                            }
                        }
                    }
                }
            }
        });

        debugLog('Chart updated with data');
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Update control dimensions with error handling
function updateControlDimensions() {
    try {
        const controls = document.querySelector('.controls');
        const chartContainer = document.querySelector('.chart-container');
        
        if (!controls || !chartContainer) {
            throw new Error('Required elements not found');
        }

        const controlsWidth = controls.offsetWidth;
        const controlsHeight = controls.offsetHeight;

        debugLog('Control dimensions:', { width: controlsWidth, height: controlsHeight });

        // Validate dimensions
        if (controlsWidth <= 0 || controlsHeight <= 0) {
            throw new Error('Invalid control dimensions');
        }

        // Update CSS variables
        document.documentElement.style.setProperty('--controls-width', `${controlsWidth}px`);
        document.documentElement.style.setProperty('--controls-height', `${controlsHeight}px`);

        // Check if chart needs resize
        if (chart) {
            debugLog('Resizing chart');
            chart.resize();
        }

        return true;
    } catch (error) {
        console.error('Error updating dimensions:', error);
        return false;
    }
}

// Improved debounce function with error handling
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            try {
                clearTimeout(timeout);
                func.apply(this, args);
            } catch (error) {
                console.error('Error in debounced function:', error);
            }
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize observers and event listeners
function initializeObservers() {
    try {
        // ResizeObserver for controls
        const resizeObserver = new ResizeObserver(debounce(() => {
            debugLog('ResizeObserver triggered');
            updateControlDimensions();
        }, CONFIG.updateDelay));

        // Start observing controls
        const controls = document.querySelector('.controls');
        if (controls) {
            resizeObserver.observe(controls);
            debugLog('ResizeObserver initialized');
        } else {
            throw new Error('Controls element not found');
        }

        // Window resize handler
        window.addEventListener('resize', debounce(() => {
            debugLog('Window resize triggered');
            updateControlDimensions();
        }, CONFIG.updateDelay));

        return true;
    } catch (error) {
        console.error('Error initializing observers:', error);
        return false;
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM Content Loaded');
    try {
        // Initialize observers
        if (!initializeObservers()) {
            throw new Error('Failed to initialize observers');
        }

        // Initial dimension update
        if (!updateControlDimensions()) {
            throw new Error('Failed to update initial dimensions');
        }

        // Initial chart creation
        calculatePortfolioGrowth();

        debugLog('Initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Add CSS check
function validateCSS() {
    const styles = getComputedStyle(document.documentElement);
    const controlsWidth = styles.getPropertyValue('--controls-width');
    const controlsHeight = styles.getPropertyValue('--controls-height');
    
    debugLog('CSS Variables:', {
        controlsWidth,
        controlsHeight
    });
    
    return controlsWidth && controlsHeight;
}

// Update the updateValue function to automatically trigger chart update
function updateValue(id) {
    const input = document.getElementById(id);
    let value = parseFloat(input.value);
    
    // Input validation
    if (isNaN(value)) {
        value = parseFloat(input.min);
        input.value = value;
    }
    
    // Enforce min/max bounds
    value = Math.max(parseFloat(input.min), Math.min(parseFloat(input.max), value));
    
    // Format display value based on input type
    let displayValue;
    switch(id) {
        case 'currentPortfolio':
        case 'monthlyContribution':
            displayValue = currencyFormatter.format(value);
            break;
        case 'annualReturn':
            displayValue = `${value}%`;
            break;
        default:
            displayValue = value;
    }
    
    document.getElementById(id + 'Value').textContent = displayValue;
    
    // Update global variables
    switch(id) {
        case 'currentAge':
            if (value >= retirementAge) {
                alert('Current age must be less than retirement age');
                return;
            }
            currentAge = value;
            break;
        case 'retirementAge':
            if (value <= currentAge) {
                alert('Retirement age must be greater than current age');
                return;
            }
            retirementAge = value;
            break;
        case 'currentPortfolio':
            currentPortfolio = value;
            break;
        case 'monthlyContribution':
            monthlyContribution = value;
            break;
        case 'annualReturn':
            annualReturn = value / 100;
            break;
    }
    
    // Automatically update the chart with debouncing
    debouncedCalculateGrowth();
}

// Create a debounced version of calculatePortfolioGrowth
const debouncedCalculateGrowth = debounce(() => {
    calculatePortfolioGrowth();
}, 100); // 100ms delay for smooth updates

// Remove the Calculate button from HTML since it's no longer needed

// Function to update currency
function updateCurrency(currency) {
    currentCurrency = currency;
    currencyFormatter = new Intl.NumberFormat(
        CONFIG.currencyFormats[currency].locale,
        {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }
    );

    // Update displayed values
    updateDisplayedValues();
    
    // Update chart
    if (chart) {
        updateChartCurrency();
    }
}

// Function to update displayed values
function updateDisplayedValues() {
    // Update portfolio value display
    const portfolioValue = document.getElementById('currentPortfolioValue');
    if (portfolioValue) {
        portfolioValue.textContent = currencyFormatter.format(currentPortfolio);
    }

    // Update monthly contribution display
    const contributionValue = document.getElementById('monthlyContributionValue');
    if (contributionValue) {
        contributionValue.textContent = currencyFormatter.format(monthlyContribution);
    }
}

// Function to update chart with new currency
function updateChartCurrency() {
    const currencySymbol = CONFIG.currencyFormats[currentCurrency].symbol;
    
    chart.options.scales.y.title.text = `Portfolio Value (${currencySymbol})`;
    chart.options.scales.y.ticks.callback = value => currencyFormatter.format(value);
    chart.options.plugins.tooltip.callbacks.label = context => {
        return [
            `Portfolio Value: ${currencyFormatter.format(context.raw)}`,
            `Return Rate: ${(annualReturn * 100).toFixed(1)}%`
        ];
    };
    
    chart.update();
}
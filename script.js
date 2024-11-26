// Configuration object for better maintainability
const CONFIG = {
    updateDelay: 300,
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
    },
    percentFormat: new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })
};

// Initialize global variables for chart and values
let chart;
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

// Debouncing utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to update values displayed next to the sliders
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
            annualReturn = value / 100; // Convert percentage to decimal
            break;
    }
    
    debouncedCalculateGrowth();
}

// Function to calculate portfolio growth
function calculatePortfolioGrowth() {
    const yearsToRetirement = retirementAge - currentAge;
    const annualContribution = monthlyContribution * 12;

    // Calculate growth per year
    let portfolioValue = currentPortfolio;
    const portfolioGrowth = [portfolioValue];
    
    for (let year = 1; year <= yearsToRetirement; year++) {
        portfolioValue = portfolioValue * (1 + annualReturn) + annualContribution;
        portfolioGrowth.push(portfolioValue);
    }

    updateChart(portfolioGrowth);
}

// Function to update the chart
function updateChart(data) {
    const labels = Array.from({length: data.length}, (_, i) => currentAge + i);
    
    if (chart) chart.destroy();

    const ctx = document.getElementById('growthChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
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
                x: {
                    title: {
                        display: true,
                        text: 'Age'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `Portfolio Value (${CONFIG.currencyFormats[currentCurrency].symbol})`
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: value => currencyFormatter.format(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => {
                            return [
                                `Portfolio Value: ${currencyFormatter.format(context.raw)}`,
                                `Return Rate: ${CONFIG.percentFormat.format(annualReturn)}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Create debounced version of calculation
const debouncedCalculateGrowth = debounce(calculatePortfolioGrowth, CONFIG.updateDelay);

// Add currency update function
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

    // Update all currency displays
    updateValue('currentPortfolio');
    updateValue('monthlyContribution');
    
    // Recalculate and update chart
    calculatePortfolioGrowth();
}

// Update the control width/height function
function updateControlDimensions() {
    const controls = document.querySelector('.controls');
    const controlsWidth = controls.offsetWidth;
    const controlsHeight = controls.offsetHeight;
    
    document.documentElement.style.setProperty('--controls-width', controlsWidth + 'px');
    document.documentElement.style.setProperty('--controls-height', controlsHeight + 'px');
}

// Update the chart options to maintain aspect ratio
function updateChart(data) {
    const labels = Array.from({length: data.length}, (_, i) => currentAge + i);
    
    if (chart) chart.destroy();

    const ctx = document.getElementById('growthChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
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
                x: {
                    title: {
                        display: true,
                        text: 'Age'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `Portfolio Value (${CONFIG.currencyFormats[currentCurrency].symbol})`
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: value => currencyFormatter.format(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => {
                            return [
                                `Portfolio Value: ${currencyFormatter.format(context.raw)}`,
                                `Return Rate: ${CONFIG.percentFormat.format(annualReturn)}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Update event listeners
window.addEventListener('resize', debounce(() => {
    updateControlDimensions();
    if (chart) {
        calculatePortfolioGrowth();
    }
}, 250));

// Call on initial load
window.addEventListener('load', () => {
    updateControlDimensions();
    calculatePortfolioGrowth();
});

// Add mutation observer to handle dynamic content changes
const resizeObserver = new ResizeObserver(debounce(() => {
    updateControlDimensions();
    if (chart) {
        calculatePortfolioGrowth();
    }
}, 250));

// Observe the controls element for size changes
resizeObserver.observe(document.querySelector('.controls'));
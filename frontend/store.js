// frontend/store.js

export const store = {
    products: null,       // Cache for product list array
    profile: null,        // Cache for user profile { username, name }
    analytics: {
        timeframes: {},   // Holds multiple cached datasets like: { "3": data, "6": data, "12": data }
        isDirty: true     // Invalidation flag for trend charts
    },
    revenue: {
        periods: {},      // Holds multiple cached summaries like: { "daily": data, "weekly": data }
        isDirty: true     // Invalidation flag for revenue cards
    }
};

export const actions = {
    setProducts(productsList) {
        store.products = productsList;
    },
    
    setProfile(profileData) {
        store.profile = profileData;
    },

    setAnalytics(months, analyticsData) {
        store.analytics.timeframes[months] = analyticsData;
        store.analytics.isDirty = false;
    },

    markAnalyticsDirty() {
        store.analytics.isDirty = true;
        store.analytics.timeframes = {}; // Clear timeframe-specific caches on mutation
    },

    setRevenueSummary(period, data) {
        store.revenue.periods[period] = data;
        store.revenue.isDirty = false;
    },

    markRevenueDirty() {
        store.revenue.isDirty = true;
        store.revenue.periods = {}; // Clear cached revenue periods on new sales
    },

    deductStock(productId, quantity) {
        if (!store.products) return;
        const product = store.products.find(p => p.product_id === parseInt(productId));
        if (product) {
            product.stock = Math.max(0, product.stock - quantity);
        }
    }
};
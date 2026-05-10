// frontend/store.js

export const store = {
    products: null,
    isProductsDirty: true, // Start true to force initial fetch
    profile: null,
    analytics: {
        timeframes: {},
        isDirty: true
    },
    revenue: {
        periods: {},
        isDirty: true
    }
};

export const actions = {
    setProducts(productsList) {
        store.products = productsList;
        store.isProductsDirty = false; // Mark clean once saved
    },

    markProductsDirty() {
        store.isProductsDirty = true;
        store.products = null; // Flush cache
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
        store.analytics.timeframes = {}; // Clear cached timeframes on mutation
    },

    setRevenueSummary(period, data) {
        store.revenue.periods[period] = data;
        store.revenue.isDirty = false;
    },

    markRevenueDirty() {
        store.revenue.isDirty = true;
        store.revenue.periods = {}; // Clear cached summaries on mutation
    },

    deductStock(productId, quantity) {
        if (!store.products) return;
        const product = store.products.find(p => p.product_id === parseInt(productId));
        if (product) {
            product.stock = Math.max(0, product.stock - quantity);
        }
    }
};
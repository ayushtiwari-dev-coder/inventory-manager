import React, { createContext, useContext, useState, useCallback } from 'react';

const CacheContext = createContext(null);

export function CacheProvider({ children }) {
    const [salesCache, setSalesCache] = useState({
        recentSales: null,
        summaries: {},
        trends: {},
        topProfitable:{},
        leastSold:{},
        salesTrend:{}
    });

    const [salesFlags, setSalesFlags] = useState({
        recentSalesDirty: true,
        dirtySummaries: new Set(['daily', 'weekly', 'monthly', '3monthly']),
        dirtyTrends: new Set([4, 8, 12, 24]),
        analyticsDirty:true
    });

    // Placeholder states to manage lazy-fetching for the upcoming Logs page
    const [logsCache, setLogsCache] = useState(null);
    const [logsDirty, setLogsDirty] = useState(true);

    // Invalidation for Sales and Analytics
    const invalidateSalesCache = useCallback((actionType) => {
        if (actionType === 'SALE_COMMITTED') {
            setSalesFlags({
                recentSalesDirty: true,
                dirtySummaries: new Set(['daily', 'weekly', 'monthly', '3monthly']),
                dirtyTrends: new Set([4, 8, 12, 24])
            });
        }
    }, []);

    // Invalidation for Logs
    const invalidateLogsCache = useCallback(() => {
        setLogsDirty(true);
    }, []);

    const updateSalesCacheValue = useCallback((key, value, subKey = null) => {
        setSalesCache(prev => {
            if (subKey) {
                return { ...prev, [key]: { ...prev[key], [subKey]: value } };
            }
            return { ...prev, [key]: value };
        });
    }, []);

    const removeDirtyFlag = useCallback((flagSetKey, value) => {
        setSalesFlags(prev => {
            const updatedSet = new Set(prev[flagSetKey]);
            updatedSet.delete(value);
            return { ...prev, [flagSetKey]: updatedSet };
        });
    }, []);

    return (
        <CacheContext.Provider value={{ 
            salesCache, 
            salesFlags, 
            invalidateSalesCache, 
            updateSalesCacheValue, 
            removeDirtyFlag, 
            setSalesFlags,
            // Expose Logs cache states
            logsCache,
            setLogsCache,
            logsDirty,
            setLogsDirty,
            invalidateLogsCache
        }}>
            {children}
        </CacheContext.Provider>
    );
}

export function useSalesCache() {
    const context = useContext(CacheContext);
    if (!context) throw new Error('useSalesCache must be used inside a CacheProvider');
    return context;
}
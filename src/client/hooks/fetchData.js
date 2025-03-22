import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for fetching data from an API
 * @param {string} url - The URL to fetch data from
 * @param {Object} options - Fetch options (optional)
 * @param {boolean} immediate - Whether to fetch immediately on mount (default: true)
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFetchData = (url, options = {}, immediate = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const cache = useRef({});

    const fetchData = async () => {
        // Don't fetch if no URL is provided
        if (!url) return;

        // Check cache first
        if (cache.current[url]) {
            setData(cache.current[url]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Update cache and state
            cache.current[url] = result;
            setData(result);
        } catch (err) {
            setError(err.message || 'An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [url]);

    // Expose a way to manually refetch the data
    const refetch = () => fetchData();

    return { data, loading, error, refetch };
};

export default useFetchData;
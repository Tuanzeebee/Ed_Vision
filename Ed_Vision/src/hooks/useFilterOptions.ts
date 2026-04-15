import { useState, useEffect } from 'react';
import { classManagementAPI } from '../services/teacher/api/classManagement';

export interface FilterOptions {
    faculties: string[];
    classes: string[];
    academicYears: string[];
    semesters: string[];
}

/**
 * Shared hook to get filter options from class management API
 * Used across multiple pages for consistent filtering
 */
export const useFilterOptions = () => {
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        faculties: [],
        classes: [],
        academicYears: [],
        semesters: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadFilterOptions = async () => {
            console.log('Loading filter options...');
            setLoading(true);
            setError(null);
            try {
                const options = await classManagementAPI.getFilterOptions();
                console.log('Filter options loaded:', options);
                setFilterOptions(options);
            } catch (err: any) {
                console.error('Error loading filter options:', err);
                setError(err.message || 'Failed to load filter options');
            } finally {
                setLoading(false);
            }
        };

        loadFilterOptions();
    }, []);

    return { filterOptions, loading, error };
};

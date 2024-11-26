// src/hooks/useSheetData.js
import { useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACK_URL;

const useSheetData = (projectId) => {
    const [data, setData] = useState([]);
    const [colHeaders, setColHeaders] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState([]);
    const [rowChecked, setRowChecked] = useState([]);

    const fetchHeadersAndData = useCallback(async () => {
        try {
            const columnResponse = await axios.get(BACKEND_URL+`/sheet/projects/${projectId}/columns`);
            const columnResult = columnResponse.data;

            const parsedHeaders = columnResult.columns.map(col =>
                col.startsWith('additionalFields.') ? col.split('.')[1] : col
            );
            setColHeaders(parsedHeaders);
            setColumnVisibility(new Array(parsedHeaders.length).fill(true));

            const dataResponse = await axios.get(BACKEND_URL+`/sheet/projects/${projectId}`);
            const dataResult = dataResponse.data;

            const sheetData = dataResult.products.map((product) => {
                const additionalFields = product.additionalFields || {};
                const row = [];
                parsedHeaders.forEach((header) => {
                    if (header in product) {
                        row.push(product[header]);
                    } else if (header in additionalFields) {
                        row.push(additionalFields[header] || '');
                    } else {
                        row.push('');
                    }
                });
                return row;
            });

            setData(sheetData);
            setRowChecked(new Array(sheetData.length).fill(false));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [projectId]);

    return {
        data,
        colHeaders,
        columnVisibility,
        rowChecked,
        setData,
        setColHeaders,
        setColumnVisibility,
        setRowChecked,
        fetchHeadersAndData
    };
};

export default useSheetData;
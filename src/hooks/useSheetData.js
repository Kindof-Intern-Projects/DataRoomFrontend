// src/hooks/useSheetData.js
import { useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACK_URL;

const useSheetData = (projectId) => {
    const [data, setData] = useState([]); // 표 데이터
    const [colHeaders, setColHeaders] = useState([]); // 컬럼 헤더
    const [columnVisibility, setColumnVisibility] = useState([]); // 컬럼 가시성
    const [rowChecked, setRowChecked] = useState([]); // 체크된 행
    const [styles, setStyles] = useState([]); // 스타일 데이터

    const fetchHeadersAndData = useCallback(async () => {
        try {
            // 컬럼 데이터 가져오기
            const columnResponse = await axios.get(`${BACKEND_URL}/data/projects/${projectId}/columns`);
            const columnResult = columnResponse.data;

            const excludeColumns = ['projectId', 'Product ID'];
            const parsedHeaders = columnResult.columns
                .filter(col => !(projectId && excludeColumns.includes(col))) // projectId가 존재할 때 특정 컬럼 제외
                .map(col => col.startsWith('additionalFields.') ? col.split('.')[1] : col);
            setColHeaders(parsedHeaders);
            setColumnVisibility(new Array(parsedHeaders.length).fill(true));

            // 제품 데이터 가져오기
            const dataResponse = await axios.get(`${BACKEND_URL}/data/projects/${projectId}`);
            const dataResult = dataResponse.data;

            const sheetData = dataResult.products.products.map((product) => {
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

            // 스타일 데이터 설정
            if (dataResult.products.styles) {
                setStyles(dataResult.products.styles);
            } else {
                setStyles([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [projectId]);

    // console.log(styles);

    return {
        data,
        colHeaders,
        columnVisibility,
        rowChecked,
        styles, // 스타일 데이터 반환
        setData,
        setColHeaders,
        setColumnVisibility,
        setRowChecked,
        fetchHeadersAndData
    };
};

export default useSheetData;

// src/components/SheetView.js
import React, { useEffect, useRef,useState } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { handleAddColumn, handleDeleteColumns, handleAddRow, handleDeleteRows, handleCellChange, handleRowCheck, handleToggleColumn, handleDownload } from '../handlers/sheetHandlers';
import ImageRenderer from './ImageRenderer';
import useSheetData from '../hooks/useSheetData';


//
const BACKEND_URL = process.env.REACT_APP_BACK_URL;
//
const SheetView = () => {
    const { projectId } = useParams();
    const { data, colHeaders, columnVisibility, rowChecked, setData, setColHeaders, setColumnVisibility, setRowChecked, fetchHeadersAndData } = useSheetData(projectId);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [selectedColumn, setSelectedColumn] = useState(null);
    const hotTableRef = useRef(null);
    

    useEffect(() => {
        fetchHeadersAndData();
    }, [fetchHeadersAndData]);

    const handleColumnSelection = (colIndex) => {
        setSelectedColumn(colIndex);
    };

    // 이미지 업로드 메뉴 테이블
    const handleFileUpload = async (file, row, col) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('productId', data[row][0]); // row의 첫 번째 열이 productId라고 가정

        try {
            const response = await axios.post(BACKEND_URL+'/upload/images', formData);
            const imagePath = response.data.imagePath;

            // Handsontable 셀 데이터 업데이트
            const hot = hotTableRef.current.hotInstance;
            hot.setDataAtCell(row, col, imagePath);
        } catch (error) {
            console.error('Image upload failed:', error);
        }
    };

    const contextMenuCallback = (key, options) => {
        if (key === "uploadImage") {
            const { start } = options[0];
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                handleFileUpload(file, start.row, start.col);
            };
            fileInput.click();
        }
    };

    const visibleHeaders = colHeaders.filter((_, index) => columnVisibility[index]);
    const visibleData = data.map(row =>
        row.filter((_, index) => columnVisibility[index])
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2>Project Data Sheet</h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="새 컬럼 타이틀 입력"
                    autoComplete="off"
                    style={{ padding: '5px' }}
                />
                <button onClick={() => handleAddColumn(projectId, newColumnTitle, setNewColumnTitle, setColHeaders, setData, setColumnVisibility, fetchHeadersAndData)}>컬럼 추가</button>
                <button onClick={() => handleAddRow(projectId, setData, fetchHeadersAndData)}>새로운 row 추가</button>
                <button onClick={() => handleDownload(data, colHeaders, columnVisibility, rowChecked)}>선택된 데이터 다운로드</button>
                <button onClick={() => handleDeleteRows(projectId, data, rowChecked, fetchHeadersAndData)}>선택된 row 제거</button>
                <button onClick={() => handleDeleteColumns(projectId, colHeaders, selectedColumn, setColHeaders, setData, setSelectedColumn)}>선택된 column 제거</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {colHeaders.map((header, index) => (
                        <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                                type="checkbox"
                                checked={columnVisibility[index]}
                                onChange={() => handleToggleColumn(index, setColumnVisibility)}
                            />
                            {header}
                        </label>
                    ))}
                </div>
                <div style={{ borderLeft: '2px solid #ccc', height: '100%', margin: '0 10px' }}></div>
                <HotTable
                    ref={hotTableRef}
                    data={visibleData}
                    colHeaders={visibleHeaders}
                    rowHeaders={true}
                    width="100%"
                    height="500"
                    licenseKey="non-commercial-and-evaluation"
                    stretchH="all"
                    autoColumnSize={true}
                    manualColumnResize={true}
                    manualRowResize={true}
                    manualColumnMove={true}
                    className='htCenter htMiddle'
                    columns={colHeaders.map((header, index) => columnVisibility[index] 
                        ? { renderer: header === 'image' ? ImageRenderer : undefined, width: 150 ,readOnly: header === 'productId' } : null).filter(col => col !== null)}
                    afterChange={(changes) => handleCellChange(changes, data, colHeaders, projectId)}
                    afterGetRowHeader={(row, TH) => {
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.checked = rowChecked[row];
                        checkbox.addEventListener('change', () => handleRowCheck(row, setRowChecked));
                        TH.innerHTML = '';
                        TH.appendChild(checkbox);
                    }}
                    afterOnCellMouseDown={(event, coords) => {
                        if (coords.row === -1) {
                            handleColumnSelection(coords.col);
                        }
                    }}
                    contextMenu={{
                        callback: (key, options) => contextMenuCallback(key, options),
                        items: {
                            uploadImage: { name: "Upload Image" },
                        },
                    }}
                />
            </div>
        </div>
    );

};

export default SheetView;
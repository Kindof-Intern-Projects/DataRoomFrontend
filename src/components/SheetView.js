import React, { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import { handleAddColumn, handleDeleteColumns, handleAddRow, handleDeleteRows, handleCellChange, handleRowCheck, handleToggleColumn, handleDownload, handleStyleCell } from '../handlers/sheetHandlers';
import ImageRenderer from './ImageRenderer';
import useSheetData from '../hooks/useSheetData';
import HyperFormula from 'hyperformula';
import Handsontable from 'handsontable';

const BACKEND_URL = process.env.REACT_APP_BACK_URL;

Modal.setAppElement('#root');

const SheetView = () => {
    const { projectId } = useParams();
    const { data, colHeaders, columnVisibility, rowChecked, styles, setData, setColHeaders, setColumnVisibility, setRowChecked, fetchHeadersAndData, setStyles } = useSheetData(projectId);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const hotTableRef = useRef(null);
    const [loading, setLoading] = useState(true);

    // 데이터 로드 (fetchHeadersAndData 호출)
    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchHeadersAndData();
                setLoading(false);  // 데이터 로드 완료
            } catch (error) {
                console.error("데이터 로딩 중 오류 발생:", error);
                setLoading(false);  // 로딩 중 오류가 나도 로딩을 종료
            }
        };
        loadData();
    }, [fetchHeadersAndData]); // fetchHeadersAndData가 변경될 때마다 호출

    const handleColumnSelection = (colIndex) => {
        setSelectedColumn(colIndex);
    };

    const handleFileUpload = async (file, row, col) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('productId', data[row][0]);

        try {
            const response = await axios.post(BACKEND_URL + '/upload/images', formData);
            const imagePath = response.data.imagePath;

            const hot = hotTableRef.current.hotInstance;
            hot.setDataAtCell(row, col, imagePath);
        } catch (error) {
            console.error('Image upload failed:', error);
        }
    };

    const contextMenuCallback = (key, options) => {
        const { start } = options[0];
        switch (key) {
            case 'uploadImage':
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = "image/*";
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    handleFileUpload(file, start.row, start.col);
                };
                fileInput.click();
                break;
            case 'addColumn':
                setIsModalOpen(true);
                break;
            case 'addRow':
                handleAddRow(projectId, setData, fetchHeadersAndData);
                break;
            case 'downloadData':
                handleDownload(data, colHeaders, columnVisibility, rowChecked);
                break;
            case 'deleteRows':
                handleDeleteRows(projectId, data, rowChecked, fetchHeadersAndData);
                break;
            case 'deleteColumns':
                handleDeleteColumns(projectId, colHeaders, selectedColumn, setColHeaders, setData, setSelectedColumn);
                break;
            case 'changeCellColor':
                console.log(data.productId);

                break;
            default:
                break;
        }
    };

    const handleModalSubmit = () => {
        handleAddColumn(projectId, newColumnTitle, setNewColumnTitle, setColHeaders, setData, setColumnVisibility, fetchHeadersAndData);
        setIsModalOpen(false);
    };

    const visibleHeaders = colHeaders.filter((_, index) => columnVisibility[index]);
    const visibleData = data.map(row =>
        row.filter((_, index) => columnVisibility[index])
    );

    const hyperformulaInstance = HyperFormula.buildEmpty({ licenseKey: 'non-commercial-and-evaluation' });

    const handleBeforeOnCellMouseDown = (event, coords, TD, controller) => {
        const activeEditor = hotTableRef.current.hotInstance.getActiveEditor();
        
        if (!activeEditor) {
            return;
        }
        if (!activeEditor.isOpened()) {
            return;
        }
        if (event.target === activeEditor.TEXTAREA) {
            return;
        }
        
        const { TEXTAREA } = activeEditor;
        const { value } = TEXTAREA;
        
        if (value.startsWith('=')) {
            controller.cells = true;
            const spreadsheetAddress = `${Handsontable.helper.spreadsheetColumnLabel(coords.col)}${coords.row + 1}`;
            activeEditor.TEXTAREA.value += spreadsheetAddress;
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    };

    const handleAfterOnCellMouseUp = (event) => {
        const activeEditor = hotTableRef.current.hotInstance.getActiveEditor();
        
        if (!activeEditor) {
            return;
        }
        if (!activeEditor.isOpened()) {
            return;
        }
        if (event.target === activeEditor.TEXTAREA) {
            return;
        }
        
        activeEditor.focus();
    };

    const handleAfterOnCellMouseDown = (event, coords) => {
        if (coords.row === -1) {
            handleColumnSelection(coords.col);
        } else {
            handleAfterOnCellMouseUp(event);
        }
    };

    const handleAfterChange = (changes) => {
        if (!changes) return;
    
        const hot = hotTableRef.current.hotInstance;
        changes.forEach(([row, col, oldValue, newValue]) => {
            if (typeof newValue === 'string' && newValue.startsWith('=')) {
                const cellValue = hot.getDataAtCell(row, col);
                hot.setDataAtCell(row, col, cellValue);
            }
        });
    
        handleCellChange(changes, data, colHeaders, projectId);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2>Project Data Sheet</h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <button onClick={() => setIsModalOpen(true)}>컬럼 추가</button>
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
                    cell='custom-cell'
                    columns={colHeaders.map((header, index) => columnVisibility[index]
                        ? { renderer: ['Image', 'image', '사진', '이미지'].includes(header) ? ImageRenderer : undefined, width: 150, readOnly: header === 'productId' } : null).filter(col => col !== null)}
                    afterChange={handleAfterChange}
                    afterGetRowHeader={(row, TH) => {
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.checked = rowChecked[row];
                        checkbox.addEventListener('change', () => handleRowCheck(row, setRowChecked));
                        TH.innerHTML = '';
                        TH.appendChild(checkbox);
                    }}
                    afterOnCellMouseDown={handleAfterOnCellMouseDown}
                    beforeOnCellMouseDown={handleBeforeOnCellMouseDown}
                    contextMenu={{
                        callback: (key, options) => {
                            // 셀 스타일 저장 요청 부분
                            if (key === 'changeCellColor') {
                                const selectedCell = options[0]; // 첫 번째 선택된 셀 정보
                                const selectedRow = selectedCell.start.row; // 선택된 행 번호
                                const selectedCol = selectedCell.start.col; // 선택된 열 번호
                        
                                const productId = visibleData[selectedRow]?.[0]; // 첫 번째 열에 productId 저장
                                const field = visibleHeaders[selectedCol]; // 열 헤더에서 field 이름 가져오기
                        
                                const mouseX = options.event?.clientX || window.innerWidth / 2; // 마우스 X 좌표
                                const mouseY = options.event?.clientY || window.innerHeight / 2; // 마우스 Y 좌표
                        
                                // 컬러 선택기 생성
                                const colorInput = document.createElement('input');
                                colorInput.type = 'color';
                                colorInput.style.position = 'absolute';
                                colorInput.style.left = `${mouseX}px`;
                                colorInput.style.top = `${mouseY}px`;
                        
                                // 컬러 선택기 추가 여부 플래그
                                let isRemoved = false;
                        
                                // 컬러 선택 이벤트
                                colorInput.addEventListener('input', (event) => {
                                    const selectedColor = event.target.value; // 선택된 색상
                                    const newStyle = {color: selectedColor}
                        
                                    // 셀 색상 업데이트 로직 추가
                                    if (productId && field) {
                                        // TODO: 셀 색상 업데이트 로직
                                        handleStyleCell(projectId, productId, field, newStyle)
                                        .then((response) => {
                                            // 서버 응답 객체를 styles에 추가
                                            setStyles((prevStyles) => {
                                                const updatedStyles = [...prevStyles, response];
                                                return updatedStyles;
                                            });

                                            // Handsontable 리렌더링
                                            hotTableRef.current.hotInstance.render();

                                        })
                                        .catch((error) => {
                                            // Todo 예외 처리를 어떻게 할 것인가 다시요청을 해야하나?
                                        });
                                    }
                        
                                    // DOM에서 컬러 선택기 제거
                                    if (!isRemoved) {
                                        try {
                                            document.body.removeChild(colorInput);
                                        } catch (e) {
                                            console.warn('Node already removed:', e.message);
                                        }
                                        isRemoved = true;
                                    }
                                });
                        
                                // 블러 이벤트로 창 제거
                                colorInput.addEventListener('blur', () => {
                                    if (!isRemoved) {
                                        try {
                                            document.body.removeChild(colorInput);
                                        } catch (e) {
                                            console.warn('Node already removed:', e.message);
                                        }
                                        isRemoved = true;
                                    }
                                });
                        
                                // 컬러 선택기 DOM 추가 및 포커스
                                document.body.appendChild(colorInput);
                                colorInput.focus();
                            }
                        },
                        
                        
                        items: {
                            uploadImage: { name: "Upload Image" },
                            addColumn: { name: "Add Column" },
                            addRow: { name: "Add Row" },
                            downloadData: { name: "Download Data" },
                            deleteRows: { name: "Delete Rows" },
                            deleteColumns: { name: "Delete Columns" },
                            changeCellColor:{name: "Cell Color"}
                        },
                    }}
                    
                    formulas={{
                        engine: hyperformulaInstance,
                    }}
                
                    // 셀 스타일 적용
                    cells={(row, col, prop) => {
                        const cellProperties = {};

                        if (loading) {
                            return cellProperties; // 데이터가 로딩 중일 때는 스타일을 적용하지 않음
                        }

                        if (!data || !data[row] || data[row].length === 0) {
                            return cellProperties; // 데이터가 없으면 스타일을 적용하지 않음
                        }
                         
                        // 특정 row와 column의 productId 및 field에 따라 스타일 찾기
                        const productId = data[row][0]; 
                        const field = colHeaders[col]; 
                        
                        // 스타일을 찾을 때, undefined 또는 null을 방어
                        const matchedStyle = styles.find(
                            (style) => style.productId === productId && style.field === field
                        );
                        if (matchedStyle && matchedStyle.styles) {
                            const { styles: styleDetails } = matchedStyle;

                            // 텍스트 렌더러를 사용하여 스타일을 적용
                            cellProperties.renderer = function (instance, td) {
                                // 기본 텍스트 렌더러를 호출
                                Handsontable.renderers.TextRenderer.apply(this, arguments);
                                // TODO 스타일을 적용 [스타일 속성이 하드 코딩 되어 있는 상태 추가 할려면 다른 방법을 사용해야 할듯]
                                td.style.backgroundColor = styleDetails.color || '';
                            };
                        }

                        return cellProperties;
                    }}
                />

            </div>
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel="Add Column Modal"
                style={{
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        width: '400px',
                        padding: '20px',
                        borderRadius: '10px',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                    },
                }}
            >
                <h2>새 컬럼 추가</h2>
                <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="새 컬럼 타이틀 입력"
                    autoComplete="off"
                    style={{ padding: '5px', width: '100%', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={handleModalSubmit} style={{ padding: '10px 20px' }}>추가</button>
                    <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px' }}>취소</button>
                </div>
            </Modal> 
        </div>
    );
};

export default SheetView;
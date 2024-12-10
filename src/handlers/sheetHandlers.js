// src/handlers/sheetHandlers.js
import axios from 'axios';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

const BACKEND_URL = process.env.REACT_APP_BACK_URL;

export const handleAddColumn = async (projectId, newColumnTitle, setNewColumnTitle, setColHeaders, setData, setColumnVisibility, fetchHeadersAndData) => {
    if (!newColumnTitle.trim()) {
        alert('컬럼 타이틀을 입력하세요.');
        return;
    }

    try {
        const response = await axios.put(BACKEND_URL+`/sheet/projects/${projectId}/addcoloums`, { columnName: newColumnTitle });

        if (response.status === 200) {
            alert('새로운 컬럼이 추가되었습니다.');
            setNewColumnTitle('');
            setColHeaders((prevHeaders) => [...prevHeaders, newColumnTitle]);
            setData((prevData) => prevData.map((row) => [...row, '']));
            setColumnVisibility((prev) => [...prev, true]);
            await fetchHeadersAndData();
        } else {
            console.error('Error adding column:', response.data.message);
        }
    } catch (error) {
        console.error('Error adding column:', error);
    }
};

export const handleDeleteColumns = async (projectId, colHeaders, selectedColumn, setColHeaders, setData, setSelectedColumn) => {
    if (selectedColumn === null || selectedColumn < 0 || selectedColumn >= colHeaders.length) {
        alert('유효한 컬럼을 선택해주세요.');
        return;
    } else if (colHeaders[selectedColumn] === 'productId') {
        alert('productId 컬럼은 삭제할 수 없습니다.');
        return;
    }

    try {
        const columnName = colHeaders[selectedColumn];
        const response = await axios.put(BACKEND_URL+`/sheet/projects/${projectId}/deletecolumns`, { columnName });

        if (response.status === 200) {
            alert('선택한 컬럼이 삭제되었습니다.');
            setColHeaders((prevHeaders) => prevHeaders.filter((_, index) => index !== selectedColumn));
            setData((prevData) => prevData.map((row) => row.filter((_, index) => index !== selectedColumn)));
            setSelectedColumn(null);
        } else {
            console.error('Error deleting column:', response.data.message);
        }
    } catch (error) {
        console.error('Error deleting column:', error);
    }
};

// TODO : DB에서 데이터를 가져와서 추가할 수 있도록 수정 필요
export const handleAddRow = async (projectId, setData, fetchHeadersAndData) => {
    const newProductData = {
        projectId: projectId,
        productId: '',  // productId는 DB에서 자동 생성
        additionalFields: {}
    };

    try {
        const response = await axios.put(BACKEND_URL+`/sheet/projects/${projectId}/addrows`, newProductData);

        if (response.status === 200) {
            alert('새로운 row가 추가되었습니다.');
            await fetchHeadersAndData();
        } else {
            console.error('Error adding row:', response.data.message);
        }
    } catch (error) {
        console.error('Error adding row:', error);
    }
};

export const handleDeleteRows = async (projectId, data, rowChecked, fetchHeadersAndData) => {
    const selectedProductIds = data
        .filter((_, index) => rowChecked[index])
        .map((row) => row[0]);

    if (selectedProductIds.length === 0) {
        alert('삭제할 데이터가 선택되지 않았습니다.');
        return;
    }

    try {
        const response = await axios.delete(BACKEND_URL+`/sheet/projects/${projectId}/deleterows`, {
            data: { productIds: selectedProductIds }
        });

        if (response.status === 200) {
            alert('선택된 데이터가 삭제되었습니다.');
            await fetchHeadersAndData();
        } else {
            console.error('데이터 삭제 실패:', response.data.message);
        }
    } catch (error) {
        console.error('삭제 요청 중 오류 발생:', error);
    }
};

export const handleDownload = async (data, colHeaders, columnVisibility, rowChecked) => {
    const selectedData = data.filter((_, index) => rowChecked[index]);

    if (selectedData.length === 0) {
        alert('선택된 데이터가 없습니다.');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 체크된 컬럼 헤더만 추가
    const visibleHeaders = colHeaders.filter((_, index) => columnVisibility[index]);
    worksheet.addRow(visibleHeaders);

    // 이미지 삽입할 이미지 ID를 먼저 준비하고
    const imagePromises = [];

    // 데이터 추가
    for (const [rowIndex, row] of selectedData.entries()) {
        // 체크된 컬럼 데이터만 필터링
        const filteredRow = row.filter((_, index) => columnVisibility[index]);
        const newRow = worksheet.addRow(filteredRow);

        // 이미지 다운로드 및 삽입을 위한 비동기 처리
        filteredRow.forEach((cellValue, index) => {
            const value = Array.isArray(cellValue) ? cellValue[0] : cellValue;

            if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('https'))) {  // URL 확인
                // 셀에 이미지 대신 빈 값 추가 (경로 값 삭제)
                newRow.getCell(index + 1).value = ''; // 셀에는 이미지 대신 빈 값

                const imagePromise = axios.get(value, { responseType: 'arraybuffer' })
                    .then((response) => {
                        const imageId = workbook.addImage({
                            buffer: response.data,
                            extension: 'png',  // 확장자는 기본적으로 png로 처리
                        });

                        // 이미지 삽입할 위치 설정
                        worksheet.addImage(imageId, {
                            tl: { col: index, row: newRow.number - 1 }, // 정확한 셀 위치
                            ext: { width: 100, height: 100 },  // 기본 크기 설정
                        });

                        // 열의 너비와 행의 높이를 이미지 크기에 맞게 설정
                        worksheet.getColumn(index + 1).width = 100 / 7;  // Excel 열 너비는 픽셀 단위보다 작으므로 /7로 조정
                        worksheet.getRow(newRow.number).height = 100 * 0.75;  // 행 높이는 이미지 높이에 맞추기 (Excel 행 높이는 픽셀 단위로 조정)
                    })
                    .catch((error) => {
                        console.error('이미지 다운로드 오류:', error);
                    });

                imagePromises.push(imagePromise);
            }
        });
    }

    // 모든 이미지 다운로드가 완료될 때까지 대기
    await Promise.all(imagePromises);

    // 파일을 메모리에서 바로 저장
    workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer]), 'selected_data_with_images.xlsx');
    });
};

export const handleCellChange = async (changes, data, colHeaders, projectId) => {
    if (!changes) return;

    // 변경된 셀 내용 저장
    const modifiedData = changes.map(([row, colIndex, oldValue, newValue]) => {
        const fieldName = colHeaders[colIndex];
        const productId = data[row][0];
        const oldData = data[row];

        return {
            productId,
            field: fieldName,
            oldValue,
            newValue,
            oldData
        };
    });

    try {
        const response = await fetch(BACKEND_URL+`/sheet/projects/${projectId}/updatedata`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, changes: modifiedData })
        });

        if (response.ok) {
            console.log('Data successfully updated!');
        } else {
            const error = await response.json();
            console.error('Error updating data:', error.message);
        }
    } catch (error) {
        console.error('Error saving changes:', error);
    }
};

export const handleRowCheck = (row, setRowChecked) => {
    setRowChecked(prev => {
        const newChecked = [...prev];
        newChecked[row] = !newChecked[row];
        return newChecked;
    });
};

export const handleToggleColumn = (index, setColumnVisibility) => {
    setColumnVisibility(prev => {
        const newVisibility = [...prev];
        newVisibility[index] = !newVisibility[index];
        return newVisibility;
    });
};
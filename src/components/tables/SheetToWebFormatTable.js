import React, { useState } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';

// custom imports
import { cafe24ColumnHeaders,cafe24Columns,customColumns,customHeaders } from './columns/columnReader';
import  SetTable from './datas/SetData';

const SheetToWebFormatTable = () => {

  //
  const urlParams = new URLSearchParams(window.location.search);
  const data = SetTable(urlParams.get('projectName')); 
  const [columns, setColumns] = useState(cafe24Columns());
  const [columnnsHeaders, setColHeaders] = useState(cafe24ColumnHeaders());

function datachange (){
    // Example: Update columns and data with new headers and data
    const updatedColumns = customColumns(); // Example of new columns
    const updatedHeaders = customHeaders(); // Example of new headers


    setColumns(updatedColumns);
    setColHeaders(updatedHeaders);
    //setData(updatedData); // Update table data
}


  // TODO : Remove after testing
  console.log(data);
  console.log(urlParams);

  //return
  return (
    <>
      <HotTable
        data={data.data.products}
        colHeaders={columnnsHeaders}
        rowHeaders={true}
        manualColumnMove={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        columns={columns}  // TODO : 임시 더 좋은방법을 알아보는중
      />
      <button onClick={datachange}>테이블 변경 버튼</button>
    </>
  );
};

export default SheetToWebFormatTable;

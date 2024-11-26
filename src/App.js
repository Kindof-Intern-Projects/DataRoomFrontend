// src/App.js
import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import SheetView from './components/SheetView';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SheetToWebFormat from './pages/SheetToWebFormat/SheetToWebFormat';

function App() {
    return (
        <>
        {/* 임시 */}
        <a href='/project/Kyndof_UUID' >UUID 테이블 페이지로</a> <br/>
        <a href='/login'>로그인 페이지로</a> <br/>
        <a href='/SheetToWebFormat?projectName=Kyndof_UUID'>무신가 컨버터 페이지로</a> <br/>
        <a href='http://3.35.51.243:3000/api-docs'>API 명세 확인</a> <br/>
        <Router>
            <Routes>
                <Route path="/project/:projectId" element={<SheetView />} />
                <Route path='/login' element={<LoginPage />}/>
                <Route path='/register' element={<RegisterPage />}/>
                <Route path='/sheettowebformat' element={<SheetToWebFormat />}/>
            </Routes>
        </Router>
        </>
    );
}

export default App;
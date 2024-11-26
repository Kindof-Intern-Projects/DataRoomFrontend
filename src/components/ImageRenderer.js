// src/components/ImageRenderer.js
import Handsontable from 'handsontable';

// 이미지 렌더러 정의
const ImageRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    Handsontable.dom.empty(td); // 기존 TD 내용을 비웁니다.

    if (value) {
        const img = document.createElement('img');
        img.src = value; // 이미지 URL
        img.alt = 'Image Preview';
        img.style.width = '100%'; // 원하는 크기로 조정
        img.style.height = 'auto';
        // img.style.maxWidth = '100px'; // 원하는 크기로 조정
        // img.style.maxHeight = '100px';
        td.appendChild(img);
    } else {
        td.textContent = 'No Image';
        td.style.color = '#ccc';
    }

    return td;
};

export default ImageRenderer;
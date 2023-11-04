const clockContainer = document.getElementById('clock-container');


setInterval(() =>{
    return clockContainer.textContent = new Date().toLocaleString().replace(',', '');
}, 100);

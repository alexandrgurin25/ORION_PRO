// Динамическая подстановка значений из env.js
document.addEventListener('DOMContentLoaded', function () {
    updateDynamicContent();
});

function updateDynamicContent() {
    // Обновляем все ссылки
    document.querySelectorAll('a[href*="tel:"]').forEach(link => {
        link.href = `tel:${window.ENV.PHONE}`;
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.href = window.ENV.WHATSAPP;
    });

    // Обновляем текст в контактах
    const addressElements = document.querySelectorAll('.contact-text p');
    addressElements.forEach(el => {
        if (el.textContent.includes('+7')) {
            el.textContent = window.ENV.PHONE;
        } else if (el.textContent.includes('Екатеринбург')) {
            el.textContent = window.ENV.ADDRESS;
        }
    });

    // Обновляем email
    const emailElements = document.querySelectorAll('.email-item');
    if (emailElements.length >= 2) {
        emailElements[0].textContent = window.ENV.EMAILS[0];
        emailElements[1].textContent = window.ENV.EMAILS[1];
    }

    // Обновляем карту
    const mapIframe = document.querySelector('.map-container iframe');
    if (mapIframe) {
        mapIframe.src = window.ENV.MAP_URL;
    }

    // Обновляем копирайт
    const copyright = document.querySelector('.container.text-center p');
    if (copyright) {
        copyright.textContent = `© ${window.ENV.COPYRIGHT_YEAR} ${window.ENV.COMPANY_NAME}. Все права защищены.`;
    }
}
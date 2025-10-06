// Функции для копирования в буфер обмена
function copyToClipboard(text, element) {
    // Используем современный Clipboard API
    navigator.clipboard.writeText(text).then(function () {
        showCopyNotification('Скопировано: ' + text);

        // Показываем анимацию подтверждения на элементе
        if (element.classList.contains('contact-item')) {
            showCopyIndicator(element);
        } else if (element.classList.contains('email-item')) {
            showCopyIndicator(element.parentElement.parentElement);
        }
    }).catch(function (err) {
        // Fallback для старых браузеров
        fallbackCopyTextToClipboard(text);
    });
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showCopyNotification('Скопировано: ' + text);
    } catch (err) {
        showCopyNotification('Ошибка копирования');
    }
    document.body.removeChild(textArea);
}

function showCopyNotification(message) {
    const notification = document.getElementById('copyNotification');
    const messageElement = document.getElementById('copyMessage');

    messageElement.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showCopyIndicator(element) {
    const indicator = element.querySelector('.copy-indicator');
    if (indicator) {
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
}

// Добавляем обработчики для подсказок при наведении
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.contact-item, .email-item').forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.querySelector('.copy-hint')?.classList.add('show');
        });

        item.addEventListener('mouseleave', function () {
            this.querySelector('.copy-hint')?.classList.remove('show');
        });
    });
});
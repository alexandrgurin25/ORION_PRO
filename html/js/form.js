// Обработка формы обратной связи
document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById("contactForm");
    
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let name = document.getElementById("name").value.trim();
            let phone = document.getElementById("phone").value.trim();
            let question = document.getElementById("question").value.trim() || "—";

            // Собираем данные формы
            const formData = {
                name: name,
                phone: phone,
                message: question
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Отправка...";
            submitBtn.disabled = true;

            // Отправляем на ваш бэкенд вместо прямого обращения к Telegram API
            fetch('/api/send-form', {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    // Если ответ не OK, пробуем прочитать ошибку
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === "success") {
                    showSuccessMessage("✅ Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.");
                    contactForm.reset();
                } else {
                    throw new Error(data.error || "Ошибка отправки");
                }
            })
            .catch(error => {
                console.error("Ошибка:", error);
                
                // Показываем понятное сообщение об ошибке
                if (error.message.includes("Telegram not configured")) {
                    showErrorMessage("❌ Сервис временно недоступен. Пожалуйста, позвоните нам напрямую.");
                } else if (error.message.includes("Failed to send message")) {
                    showErrorMessage("❌ Ошибка отправки сообщения. Попробуйте позже или позвоните нам.");
                } else {
                    showErrorMessage("❌ Не удалось отправить заявку. Попробуйте позже или позвоните нам.");
                }
            })
            .finally(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        });
    }
});


// Функции для красивых уведомлений (можно заменить на ваши)
function showSuccessMessage(message) {
    // Временное решение - alert
    alert(message);
    
    // Лучше использовать красивый toast/snackbar:
    // showNotification(message, 'success');
}

function showErrorMessage(message) {
    // Временное решение - alert
    alert(message);
    
    // Лучше использовать красивый toast/snackbar:
    // showNotification(message, 'error');
}

// Расширенная версия с улучшенными уведомлениями:
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi bi-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Стили для уведомлений (добавьте в CSS)
    const style = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        }
        .notification-success { background: #28a745; }
        .notification-error { background: #dc3545; }
        .notification-info { background: #17a2b8; }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    // Добавляем стили если их еще нет
    if (!document.getElementById('notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'notification-styles';
        styleElement.textContent = style;
        document.head.appendChild(styleElement);
    }
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle-fill',
        error: 'exclamation-circle-fill',
        info: 'info-circle-fill'
    };
    return icons[type] || 'info-circle-fill';
}
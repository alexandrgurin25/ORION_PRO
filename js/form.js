// Обработка формы обратной связи
document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById("contactForm");
    
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let name = document.getElementById("name").value.trim();
            let phone = document.getElementById("phone").value.trim();
            let question = document.getElementById("question").value.trim() || "—";

            // Используем переменные из env.js
            const BOT_TOKEN = window.ENV.BOT_TOKEN;
            const CHAT_ID = window.ENV.CHAT_ID;

            // Функция для экранирования HTML 
            const escapeHtml = (text) => {
                return text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };

            let message = `📩 Новая заявка с сайта\n\n👤 Имя: ${escapeHtml(name)}\n📞 Телефон: ${escapeHtml(phone)}\n❓ Вопрос: ${escapeHtml(question)}`;

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Отправка...";
            submitBtn.disabled = true;

            fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: "HTML"
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.ok) {
                        alert("✅ Заявка успешно отправлена!");
                        contactForm.reset();
                    } else {
                        throw new Error(data.description || "Ошибка отправки");
                    }
                })
                .catch(error => {
                    console.error("Ошибка:", error);
                    alert("❌ Не удалось отправить заявку. Попробуйте позже.");
                })
                .finally(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }
});
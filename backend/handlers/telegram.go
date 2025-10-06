package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type ContactForm struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Message string `json:"message"`
}

type Config struct {
	TelegramBotToken string `json:"telegram_bot_token"`
	TelegramChatID   string `json:"telegram_chat_id"`
}

func init() {
	// Загружаем .env файл
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: .env file not found, using system environment variables")
	}
}

func SendToTelegramHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Парсим JSON
	var form ContactForm
	if err := json.NewDecoder(r.Body).Decode(&form); err != nil {
		http.Error(w, `{"error": "Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	// Получаем конфиг из переменных окружения
	config := LoadConfigFromEnv()

	// Проверяем что конфиг заполнен
	if config.TelegramBotToken == "" || config.TelegramChatID == "" {
		http.Error(w, `{"error": "Telegram configuration incomplete. Check environment variables."}`, http.StatusInternalServerError)
		return
	}

	// Форматируем сообщение
	message := formatTelegramMessage(form)

	// Отправляем в Telegram
	if err := sendTelegramMessage(config.TelegramBotToken, config.TelegramChatID, message); err != nil {
		http.Error(w, `{"error": "Failed to send message to Telegram"}`, http.StatusInternalServerError)
		return
	}

	// Успешный ответ
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Form submitted successfully",
	})
}

func LoadConfigFromEnv() *Config {
	return &Config{
		TelegramBotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramChatID:   os.Getenv("TELEGRAM_CHAT_ID"),
	}
}

func formatTelegramMessage(form ContactForm) string {
	

	return fmt.Sprintf(
		"📩 *Новая заявка с сайта*\n\n"+
			"👤 *Имя:* %s\n"+
			"📞 *Телефон:* `%s`\n"+
			"💬 *Сообщение:* %s\n\n"+
			"_Время:_ %s",
		form.Name,
		form.Phone,
		form.Message,
		time.Now().Format("02.01.2006 15:04"),
	)
}

func sendTelegramMessage(botToken, chatID, message string) error {
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)

	formData := url.Values{
		"chat_id":    {chatID},
		"text":       {message},
		"parse_mode": {"Markdown"},
	}

	resp, err := http.PostForm(apiURL, formData)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("telegram API error: %s", string(body))
	}

	return nil
}

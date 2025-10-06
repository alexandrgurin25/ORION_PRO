package main

import (
	"backend/handlers"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Middleware для защиты статических файлов админки
func protectAdminFiles(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Блокируем прямой доступ к файлам админки
		if strings.HasPrefix(r.URL.Path, "/admin.html") || 
		   strings.HasPrefix(r.URL.Path, "/admin-login.html") {
			log.Printf("🚫 Blocked direct access to admin file: %s from %s", r.URL.Path, r.RemoteAddr)
			http.Error(w, "Access denied", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Загружаем .env файл
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Статические файлы основного сайта (из папки html) с защитой
	http.Handle("/", protectAdminFiles(http.FileServer(http.Dir("./../html"))))

	// API endpoints
	http.HandleFunc("/api/send-form", handlers.SendToTelegramHandler)
	http.HandleFunc("/api/projects", handlers.GetProjectsHandler)

	// Админка с защитой
	http.HandleFunc("/admin", handlers.RequireAuth(handlers.AdminHandler))
	http.HandleFunc("/admin/login", handlers.AdminLoginHandler)
	http.HandleFunc("/admin/api/projects", handlers.ProtectAPI(handlers.AdminAPIHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 Server starting on :%s", port)
	log.Printf("📱 Main site: http://localhost:%s", port)
	log.Printf("🔐 Admin panel: http://localhost:%s/admin", port)
	log.Printf("🛡️  Admin files protection: ENABLED")
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
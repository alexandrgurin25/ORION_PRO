package main

import (
	"backend/handlers"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	// Загружаем .env файл
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Статические файлы основного сайта с защитой
	http.Handle("/", protectAdminFiles(http.FileServer(http.Dir("./../html"))))

	// API endpoints
	http.HandleFunc("/api/send-form", handlers.SendToTelegramHandler)
	http.HandleFunc("/api/projects", handlers.GetProjectsHandler)

	// Админка с защитой
	http.HandleFunc("/admin", handlers.RequireAuth(handlers.AdminHandler))
	http.HandleFunc("/admin/login", handlers.AdminLoginHandler)
	http.HandleFunc("/admin/api/projects", handlers.ProtectAPI(handlers.AdminAPIHandler))

	// Порты
	httpsPort := os.Getenv("HTTPS_PORT")
	if httpsPort == "" {
		httpsPort = "443"
	}

	httpPort := os.Getenv("HTTP_PORT")
	if httpPort == "" {
		httpPort = "80"
	}

	// Пути к SSL файлам
	certFile := os.Getenv("SSL_CERT_FILE")
	keyFile := os.Getenv("SSL_KEY_FILE")

	// Если пути не указаны в .env, используем стандартные
	if certFile == "" {
		certFile = "certificate.crt"
	}
	if keyFile == "" {
		keyFile = "certificate.key"
	}

	// Проверяем существование файлов
	if _, err := os.Stat(certFile); os.IsNotExist(err) {
		log.Printf("❌ SSL certificate file not found: %s", certFile)
		log.Printf("⚠️  Starting in HTTP-only mode")
		startHTTPOnly(httpPort)
		return
	}
	if _, err := os.Stat(keyFile); os.IsNotExist(err) {
		log.Printf("❌ SSL key file not found: %s", keyFile)
		log.Printf("⚠️  Starting in HTTP-only mode")
		startHTTPOnly(httpPort)
		return
	}

	// Запускаем HTTP сервер для редиректа на HTTPS (в отдельной горутине)
	go func() {
		log.Printf("🔄 HTTP redirect server listening on :%s", httpPort)
		if err := http.ListenAndServe(":"+httpPort, http.HandlerFunc(redirectToHTTPS)); err != nil {
			log.Printf("❌ HTTP server error: %v", err)
		}
	}()

	// Запускаем HTTPS сервер (основной)
	log.Printf("🚀 HTTPS server starting on :%s", httpsPort)
	log.Printf("📱 Main site: https://localhost:%s", httpsPort)
	log.Printf("🔐 Admin panel: https://localhost:%s/admin", httpsPort)
	log.Printf("🔒 Using SSL certificate: %s", certFile)
	log.Printf("🔑 Using SSL key: %s", keyFile)
	
	if err := http.ListenAndServeTLS(":"+httpsPort, certFile, keyFile, nil); err != nil {
		log.Fatalf("❌ HTTPS server error: %v", err)
	}
}

// Редирект с HTTP на HTTPS
func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	httpsPort := os.Getenv("HTTPS_PORT")
	if httpsPort == "" {
		httpsPort = "443"
	}
	
	host := strings.Split(r.Host, ":")[0] // Убираем порт из host
	target := "https://" + host + ":" + httpsPort + r.URL.Path
	if r.URL.RawQuery != "" {
		target += "?" + r.URL.RawQuery
	}
	
	http.Redirect(w, r, target, http.StatusPermanentRedirect)
}

// Запуск только HTTP (если SSL файлы не найдены)
func startHTTPOnly(port string) {
	log.Printf("🚀 HTTP server starting on :%s", port)
	log.Printf("📱 Main site: http://localhost:%s", port)
	log.Printf("🔐 Admin panel: http://localhost:%s/admin", port)
	log.Printf("⚠️  HTTPS: DISABLED - running in HTTP mode only")
	
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("❌ HTTP server error: %v", err)
	}
}

// Middleware для защиты статических файлов админки
func protectAdminFiles(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/admin.html") || 
		   strings.HasPrefix(r.URL.Path, "/admin-login.html") {
			http.Error(w, "Access denied", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
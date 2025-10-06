package main

import (
	"backend/handlers"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	// Загружаем .env файл
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Настройка правильных MIME-типов для статических файлов
	http.Handle("/js/", http.StripPrefix("/js/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.FileServer(http.Dir("./../html/js")).ServeHTTP(w, r)
	})))

	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("./../html/css"))))
	http.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("./../html/images"))))

	// Основные статические файлы с защитой
	http.Handle("/", protectAdminFiles(http.FileServer(http.Dir("./../html"))))

	// API endpoints с CORS
	http.HandleFunc("/api/send-form", enableCORS(handlers.SendToTelegramHandler))
	http.HandleFunc("/api/projects", enableCORS(handlers.GetProjectsHandler))

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

// CORS middleware для API
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
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
		// Запрещаем прямой доступ к HTML файлам админки
		if strings.HasPrefix(r.URL.Path, "/admin") && filepath.Ext(r.URL.Path) == ".html" {
			http.Error(w, "Access denied", http.StatusForbidden)
			return
		}
		
		// Устанавливаем правильные MIME-типы для известных расширений
		ext := filepath.Ext(r.URL.Path)
		switch ext {
		case ".js":
			w.Header().Set("Content-Type", "application/javascript")
		case ".css":
			w.Header().Set("Content-Type", "text/css")
		case ".png":
			w.Header().Set("Content-Type", "image/png")
		case ".jpg", ".jpeg":
			w.Header().Set("Content-Type", "image/jpeg")
		case ".svg":
			w.Header().Set("Content-Type", "image/svg+xml")
		}
		
		next.ServeHTTP(w, r)
	})
}
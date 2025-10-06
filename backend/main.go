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

	// Создаем основной mux для HTTPS сервера
	mainMux := http.NewServeMux()
	
	// Настройка статических файлов для основного mux
	mainMux.Handle("/js/", http.StripPrefix("/js/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.FileServer(http.Dir("./../html/js")).ServeHTTP(w, r)
	})))

	mainMux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("./../html/css"))))
	mainMux.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("./../html/images"))))
	mainMux.Handle("/", protectAdminFiles(http.FileServer(http.Dir("./../html"))))

	// API endpoints с CORS
	mainMux.HandleFunc("/api/send-form", enableCORS(handlers.SendToTelegramHandler))
	mainMux.HandleFunc("/api/projects", enableCORS(handlers.GetProjectsHandler))

	// Админка с защитой
	mainMux.HandleFunc("/admin", handlers.RequireAuth(handlers.AdminHandler))
	mainMux.HandleFunc("/admin/login", handlers.AdminLoginHandler)
	mainMux.HandleFunc("/admin/api/projects", handlers.ProtectAPI(handlers.AdminAPIHandler))

	// Запускаем HTTP сервер для редиректа на HTTPS (в отдельной горутине)
	go func() {
		log.Printf("🔄 HTTP redirect server listening on :%s", httpPort)
		// Простой сервер только для редиректа
		redirectHandler := http.HandlerFunc(redirectToHTTPS)
		if err := http.ListenAndServe(":"+httpPort, redirectHandler); err != nil {
			log.Printf("❌ HTTP server error: %v", err)
		}
	}()

	// Запускаем HTTPS сервер (основной) с mainMux
	log.Printf("🚀 HTTPS server starting on :%s", httpsPort)
	log.Printf("📱 Main site: https://localhost:%s", httpsPort)
	log.Printf("🔐 Admin panel: https://localhost:%s/admin", httpsPort)
	log.Printf("🔒 Using SSL certificate: %s", certFile)
	log.Printf("🔑 Using SSL key: %s", keyFile)
	
	if err := http.ListenAndServeTLS(":"+httpsPort, certFile, keyFile, mainMux); err != nil {
		log.Fatalf("❌ HTTPS server error: %v", err)
	}
}

// Улучшенный редирект с HTTP на HTTPS
func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	httpsPort := os.Getenv("HTTPS_PORT")
	if httpsPort == "" {
		httpsPort = "443"
	}
	
	// Определяем хост для редиректа
	host := r.Host
	if strings.Contains(host, ":") {
		host = strings.Split(host, ":")[0]
	}
	
	// Собираем целевой URL
	target := "https://" + host
	
	target += r.URL.RequestURI()
	
	http.Redirect(w, r, target, http.StatusPermanentRedirect)
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

// Запуск только HTTP (если SSL файлы не найдены)
func startHTTPOnly(port string) {
	// Создаем mux для HTTP-only режима
	mux := http.NewServeMux()
	
	// Настройка статических файлов
	mux.Handle("/js/", http.StripPrefix("/js/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		http.FileServer(http.Dir("./../html/js")).ServeHTTP(w, r)
	})))

	mux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("./../html/css"))))
	mux.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("./../html/images"))))
	mux.Handle("/", protectAdminFiles(http.FileServer(http.Dir("./../html"))))

	// API endpoints с CORS
	mux.HandleFunc("/api/send-form", enableCORS(handlers.SendToTelegramHandler))
	mux.HandleFunc("/api/projects", enableCORS(handlers.GetProjectsHandler))

	// Админка с защитой
	mux.HandleFunc("/admin", handlers.RequireAuth(handlers.AdminHandler))
	mux.HandleFunc("/admin/login", handlers.AdminLoginHandler)
	mux.HandleFunc("/admin/api/projects", handlers.ProtectAPI(handlers.AdminAPIHandler))

	log.Printf("🚀 HTTP server starting on :%s", port)
	log.Printf("📱 Main site: http://localhost:%s", port)
	log.Printf("🔐 Admin panel: http://localhost:%s/admin", port)
	log.Printf("⚠️  HTTPS: DISABLED - running in HTTP mode only")
	
	if err := http.ListenAndServe(":"+port, mux); err != nil {
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
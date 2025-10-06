package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
)

// Добавьте эти middleware функции в начало файла (после импортов)

// Middleware для проверки аутентификации
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if !isAuthenticated(r) {
            // Логируем попытку доступа
            fmt.Printf("🚫 Unauthorized access attempt from %s to %s\n", r.RemoteAddr, r.URL.Path)
            http.Redirect(w, r, "/admin/login", http.StatusSeeOther)
            return
        }
        next(w, r)
    }
}

// Middleware для защиты от прямого доступа к HTML файлам
func PreventDirectFileAccess(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Блокируем прямые запросы к .html файлам админки
        if r.URL.Path == "/admin.html" || r.URL.Path == "/admin-login.html" {
            fmt.Printf("🚫 Direct file access attempt: %s from %s\n", r.URL.Path, r.RemoteAddr)
            http.Error(w, "Access denied", http.StatusForbidden)
            return
        }
        next(w, r)
    }
}

// Middleware для защиты API endpoints
func ProtectAPI(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if !isAuthenticated(r) {
            fmt.Printf("🚫 Unauthorized API access: %s from %s\n", r.URL.Path, r.RemoteAddr)
            http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
            return
        }
        next(w, r)
    }
}

// Переименовываем структуры для хранения проектов
type ProjectsData struct {
	Projects []*Project `json:"projects"`
	NextID   int        `json:"nextId"`
}

type Project struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Image       string   `json:"image"`
	Description string   `json:"description"`
	Categories  []string `json:"categories"`
	Details     []string `json:"details"`
	Area        string   `json:"area,omitempty"`
	Duration    string   `json:"duration,omitempty"`
	Location    string   `json:"location,omitempty"`
	Date        string   `json:"date,omitempty"`
}

var (
	projectsData *ProjectsData
	projectsMu   sync.RWMutex
	projectsFile = "projects.json" // переименовали файл
)

// Загрузка данных проектов при старте
func init() {
	loadProjectsData()
}

func loadProjectsData() {
	projectsMu.Lock()
	defer projectsMu.Unlock()

	file, err := os.Open(projectsFile)
	if err != nil {
		// Создаем default данные если файла нет
		projectsData = &ProjectsData{
			Projects: []*Project{},
			NextID:   1,
		}
		saveProjectsData()
		return
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&projectsData); err != nil {
		fmt.Printf("Error loading projects data: %v\n", err)
		projectsData = &ProjectsData{
			Projects: []*Project{},
			NextID:   1,
		}
	}
}

func saveProjectsData() {
	file, err := os.Create(projectsFile)
	if err != nil {
		fmt.Printf("Error saving projects data: %v\n", err)
		return
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(projectsData); err != nil {
		fmt.Printf("Error encoding projects data: %v\n", err)
	}
}

// API handlers
func AdminAPIHandler(w http.ResponseWriter, r *http.Request) {
	if !isAuthenticated(r) {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "GET":
		projectsMu.RLock()
		json.NewEncoder(w).Encode(projectsData.Projects)
		projectsMu.RUnlock()

	case "POST":
    var project Project
    if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
        http.Error(w, `{"error": "Invalid JSON"}`, http.StatusBadRequest)
        return
    }

    projectsMu.Lock()
    defer projectsMu.Unlock()

    if project.ID == "" {
        // Новый проект - создаем КОПИЮ в куче
        project.ID = fmt.Sprintf("%d", projectsData.NextID)
        projectsData.NextID++
        
        // Создаем новую структуру в куче
        newProject := &Project{
            ID:          project.ID,
            Title:       project.Title,
            Image:       project.Image,
            Description: project.Description,
            Categories:  append([]string{}, project.Categories...), // копируем слайс
            Details:     append([]string{}, project.Details...),     // копируем слайс
            Area:        project.Area,
            Duration:    project.Duration,
            Location:    project.Location,
            Date:        project.Date,
        }
        projectsData.Projects = append(projectsData.Projects, newProject)
    } else {
        // Обновление существующего - создаем КОПИЮ
        for i, p := range projectsData.Projects {
            if p.ID == project.ID {
                updatedProject := &Project{
                    ID:          project.ID,
                    Title:       project.Title,
                    Image:       project.Image,
                    Description: project.Description,
                    Categories:  append([]string{}, project.Categories...),
                    Details:     append([]string{}, project.Details...),
                    Area:        project.Area,
                    Duration:    project.Duration,
                    Location:    project.Location,
                    Date:        project.Date,
                }
                projectsData.Projects[i] = updatedProject
                break
            }
        }
    }
    saveProjectsData()

    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": "success",
        "id":     project.ID,
    })

	case "DELETE":
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, `{"error": "ID required"}`, http.StatusBadRequest)
			return
		}

		projectsMu.Lock()
		for i, p := range projectsData.Projects {
			if p.ID == id {
				projectsData.Projects = append(projectsData.Projects[:i], projectsData.Projects[i+1:]...)
				break
			}
		}
		saveProjectsData()
		projectsMu.Unlock()

		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// Для основного сайта
func GetProjectsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	projectsMu.RLock()
	json.NewEncoder(w).Encode(projectsData.Projects)
	projectsMu.RUnlock()
}

// Аутентификация
func isAuthenticated(r *http.Request) bool {
	cookie, err := r.Cookie("admin_auth")
	return err == nil && cookie.Value == "true"
}


func AdminLoginHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == "GET" {
        // Добавляем проверку - если уже авторизован, редирект в админку
        if isAuthenticated(r) {
            http.Redirect(w, r, "/admin", http.StatusSeeOther)
            return
        }
        http.ServeFile(w, r, "./../html/admin-login.html")
        return
    }

    if r.Method == "POST" {
        r.ParseForm()
        password := r.FormValue("password")
        adminPassword := os.Getenv("ADMIN_PASSWORD")

        if password == adminPassword {
            http.SetCookie(w, &http.Cookie{
                Name:   "admin_auth",
                Value:  "true",
                Path:   "/",
                MaxAge: 24 * 60 * 60,
            })
            // Логируем успешный вход
            fmt.Printf("✅ Admin login successful from %s\n", r.RemoteAddr)
            http.Redirect(w, r, "/admin", http.StatusSeeOther)
        } else {
            // Логируем неудачную попытку входа
            fmt.Printf("❌ Failed admin login attempt from %s\n", r.RemoteAddr)
            http.Error(w, "Неверный пароль", http.StatusUnauthorized)
        }
    }
}


func AdminHandler(w http.ResponseWriter, r *http.Request) {
	if !isAuthenticated(r) {
		http.Redirect(w, r, "/admin/login", http.StatusSeeOther)
		return
	}
	http.ServeFile(w, r, "./../html/admin.html")
}
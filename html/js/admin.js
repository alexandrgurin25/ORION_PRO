class ProjectAdmin {
    constructor() {
        this.projects = [];
        this.editingId = null;
        this.deleteModal = null;
        
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.initializeModals();
        this.setupEventListeners();
        this.updateProjectsCount();
    }

    initializeModals() {
        try {
            const deleteModalEl = document.getElementById('deleteModal');
            if (deleteModalEl) {
                this.deleteModal = new bootstrap.Modal(deleteModalEl);
            }
            
            const confirmDeleteBtn = document.getElementById('confirmDelete');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => {
                    this.deleteProject(this.editingId);
                });
            }
        } catch (error) {
            console.error('Modal initialization error:', error);
        }
    }

    setupEventListeners() {
        const projectForm = document.getElementById('projectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProject();
            });
        }
    }

    // Загрузка проектов с сервера
    async loadProjects() {
        try {
            const response = await fetch('/admin/api/projects');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.projects = await response.json();
            this.displayProjects();
            this.updateProjectsCount();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showAlert('Ошибка загрузки проектов', 'danger');
        }
    }

    // Сохранение проекта на сервер
    // Сохранение проекта на сервер
async saveProject() {
    const formData = this.getFormData();
    
    // Валидация
    if (!formData.title || !formData.description) {
        this.showAlert('Заполните обязательные поля: название и описание', 'warning');
        return;
    }

    if (!formData.image) {
        this.showAlert('Укажите название изображения', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Сохранение...';
    submitBtn.disabled = true;

    try {
        console.log('📤 Отправка проекта на сервер...');
        const response = await fetch('/admin/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Ответ сервера:', result);
        
        if (result.status === 'success') {
            // ВАЖНО: Всегда перезагружаем данные с сервера после сохранения
            console.log('🔄 Перезагрузка данных с сервера...');
            await this.loadProjects(); // ← ЗАМЕНИТЕ локальное обновление на эту строку
            
            this.clearForm();
            const message = this.editingId ? 'Проект успешно обновлен!' : 'Проект успешно добавлен!';
            this.showAlert(message, 'success');
        } else {
            throw new Error(result.error || 'Unknown error');
        }

    } catch (error) {
        console.error('Error saving project:', error);
        this.showAlert(`Ошибка сохранения: ${error.message}`, 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

    // Удаление проекта
async deleteProject(id) {
    try {
        const response = await fetch(`/admin/api/projects?id=${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // ПЕРЕЗАГРУЖАЕМ ДАННЫЕ С СЕРВЕРА
        await this.loadProjects();
        
        if (this.deleteModal) {
            this.deleteModal.hide();
        }
        
        this.showAlert('Проект успешно удален!', 'success');
    } catch (error) {
        console.error('Error deleting project:', error);
        this.showAlert('Ошибка удаления проекта', 'danger');
    }
}

    // Остальные методы без изменений...
    getFormData() {
        const categories = [];
        if (document.getElementById('systemFire')?.checked) categories.push('fire');
        if (document.getElementById('systemSecurity')?.checked) categories.push('security');
        if (document.getElementById('systemVideo')?.checked) categories.push('video');
        if (document.getElementById('systemAccess')?.checked) categories.push('access');

        const detailsText = document.getElementById('projectDetails')?.value || '';
        const details = detailsText.split('\n')
            .map(d => d.trim())
            .filter(d => d.length > 0);

        const formData = {
            title: document.getElementById('projectTitle')?.value.trim() || '',
            description: document.getElementById('projectDescription')?.value.trim() || '',
            categories: categories,
            image: document.getElementById('projectImage')?.value.trim() || '',
            details: details,
            area: document.getElementById('projectArea')?.value.trim() || '',
            duration: document.getElementById('projectDuration')?.value.trim() || '',
            location: document.getElementById('projectLocation')?.value.trim() || ''
        };

        if (this.editingId) {
            formData.id = this.editingId;
        }

        return formData;
    }

    editProject(id) {
        const project = this.projects.find(p => p.id === id);
        
        if (!project) {
            console.error('Project not found with ID:', id);
            this.showAlert('Проект не найден', 'danger');
            return;
        }

        this.editingId = id;
        
        document.getElementById('projectTitle').value = project.title || '';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectImage').value = project.image || '';
        document.getElementById('projectDetails').value = project.details ? project.details.join('\n') : '';
        document.getElementById('projectArea').value = project.area || '';
        document.getElementById('projectDuration').value = project.duration || '';
        document.getElementById('projectLocation').value = project.location || '';

        const checkboxes = {
            'systemFire': 'fire',
            'systemSecurity': 'security', 
            'systemVideo': 'video',
            'systemAccess': 'access'
        };

        Object.entries(checkboxes).forEach(([checkboxId, category]) => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.checked = project.categories ? project.categories.includes(category) : false;
            }
        });

        document.getElementById('formTitle').textContent = 'Редактирование проекта';
        document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check-circle"></i> Сохранить изменения';
        document.getElementById('cancelEdit').style.display = 'block';
        document.getElementById('projectForm').scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        this.editingId = null;
        this.clearForm();
    }

    clearForm() {
        document.getElementById('projectForm').reset();
        this.editingId = null;
        document.getElementById('formTitle').textContent = 'Добавление нового проекта';
        document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Добавить проект';
        document.getElementById('cancelEdit').style.display = 'none';
    }

    confirmDelete(id, title) {
        this.editingId = id;
        document.getElementById('deleteProjectName').textContent = title;
        
        if (this.deleteModal) {
            this.deleteModal.show();
        } else {
            console.error('Delete modal not initialized');
            this.initializeModals();
            if (this.deleteModal) {
                this.deleteModal.show();
            }
        }
    }

    displayProjects() {
        const container = document.getElementById('projectsList');
        if (!container) return;

        container.innerHTML = '';

        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h4 class="mt-3 text-muted">Проектов пока нет</h4>
                    <p class="text-muted">Добавьте первый проект используя форму выше</p>
                </div>
            `;
            return;
        }

        this.projects.forEach(project => {
            const projectEl = this.createProjectElement(project);
            container.appendChild(projectEl);
        });
    }

    createProjectElement(project) {
        if (!project) {
            console.error('Project is undefined');
            return document.createElement('div');
        }
        
        const safeProject = {
            id: project.id || 'unknown',
            title: project.title || 'Без названия',
            description: project.description || 'Описание отсутствует',
            categories: Array.isArray(project.categories) ? project.categories : [],
            image: project.image || 'default.jpg',
            date: project.date || new Date().toLocaleDateString('ru-RU'),
            area: project.area || '',
            duration: project.duration || '',
            location: project.location || '',
            details: Array.isArray(project.details) ? project.details : []
        };

        const div = document.createElement('div');
        div.className = 'col-lg-6 mb-4';
        div.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <img src="/images/portfolio/${safeProject.image}" 
                                 class="img-fluid rounded" 
                                 style="height: 120px; width: 100%; object-fit: cover;"
                                 alt="${safeProject.title}"
                                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGVlMmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY3Nzg5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5ldCBpbWFnZTwvdGV4dD48L3N2Zz4='">
                        </div>
                        <div class="col-md-8">
                            <h5 class="card-title">${this.escapeHtml(safeProject.title)}</h5>
                            <p class="card-text text-muted small">${this.escapeHtml(safeProject.description)}</p>
                            
                            ${safeProject.area ? `<p class="small mb-1"><strong>Площадь:</strong> ${this.escapeHtml(safeProject.area)}</p>` : ''}
                            ${safeProject.location ? `<p class="small mb-2"><strong>Местоположение:</strong> ${this.escapeHtml(safeProject.location)}</p>` : ''}
                            
                            <div class="mb-2">
                                ${safeProject.categories.map(cat => `
                                    <span class="badge bg-${this.getCategoryColor(cat)} me-1 mb-1">
                                        <i class="bi bi-${this.getCategoryIcon(cat)}"></i>
                                        ${this.getCategoryName(cat)}
                                    </span>
                                `).join('')}
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">Добавлен: ${safeProject.date}</small>
                                <div>
                                    <button class="btn btn-outline-primary btn-sm" onclick="window.admin.editProject('${safeProject.id}')">
                                        <i class="bi bi-pencil"></i> Изменить
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="window.admin.confirmDelete('${safeProject.id}', '${this.escapeHtml(safeProject.title).replace(/'/g, "\\'")}')">
                                        <i class="bi bi-trash"></i> Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    updateProjectsCount() {
        const count = this.projects.length;
        const countElement = document.getElementById('projectsCount');
        if (countElement) {
            countElement.textContent = `${count} ${this.getRussianPlural(count, ['проект', 'проекта', 'проектов'])}`;
        }
    }

    getRussianPlural(number, titles) {
        const cases = [2, 0, 1, 1, 1, 2];
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 4000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCategoryName(category) {
        const categories = {
            'fire': 'Пожарная безопасность',
            'security': 'Охранные системы', 
            'video': 'Видеонаблюдение',
            'access': 'Контроль доступа'
        };
        return categories[category] || category;
    }

    getCategoryColor(category) {
        const colors = {
            'fire': 'danger',
            'security': 'warning',
            'video': 'info',
            'access': 'success'
        };
        return colors[category] || 'secondary';
    }

    getCategoryIcon(category) {
        const icons = {
            'fire': 'fire',
            'security': 'shield-check',
            'video': 'camera-video', 
            'access': 'key'
        };
        return icons[category] || 'question-circle';
    }

    exportData() {
        const dataStr = JSON.stringify(this.projects, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'portfolio-projects-backup.json';
        link.click();
        
        this.showAlert('Данные успешно экспортированы!', 'success');
    }

    logout() {
        fetch('/admin/logout', {
            method: 'POST'
        })
        .then(() => {
            window.location.href = '/admin/login';
        })
        .catch(error => {
            console.error('Logout error:', error);
            window.location.href = '/admin/login';
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.admin = new ProjectAdmin();
});
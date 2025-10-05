class ProjectAdmin {
    constructor() {
        console.log('ProjectAdmin constructor called');
        this.projects = this.loadProjects();
        this.editingId = null;
        this.deleteModal = null;
        this.passwordModal = null;
        this.isAuthenticated = false;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutTime = 5 * 60 * 1000;
        
           
        this.init();

          // Принудительная инициализация модальных окон
    setTimeout(() => {
        this.initializeModals();
    }, 500);
}

initializeModals() {
    try {
        const deleteModalEl = document.getElementById('deleteModal');
        if (deleteModalEl) {
            this.deleteModal = new bootstrap.Modal(deleteModalEl);
        }
        
        const passwordModalEl = document.getElementById('passwordModal');
        if (passwordModalEl) {
            this.passwordModal = new bootstrap.Modal(passwordModalEl);
        }
        
        // Инициализация обработчика подтверждения удаления
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
    


     init() {
        console.log('Initializing ProjectAdmin');
        this.checkAuthStatus();
        
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Автоматический вход если уже авторизован
        if (this.isAuthenticated) {
            console.log('User already authenticated, showing admin content');
            this.showAdminContent();
        } else {
            console.log('User not authenticated, showing login screen');
        }
    }


    // Система аутентификации
    checkAuthStatus() {
        const authData = this.getAuthData();
        if (authData && authData.expires > Date.now()) {
            this.isAuthenticated = true;
        } else {
            this.clearAuthData();
        }
    }

    getAuthData() {
        try {
            const authData = localStorage.getItem('adminAuth');
            return authData ? JSON.parse(authData) : null;
        } catch (e) {
            return null;
        }
    }

    saveAuthData() {
        const authData = {
            authenticated: true,
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 часа
        };
        localStorage.setItem('adminAuth', JSON.stringify(authData));
    }

    clearAuthData() {
        localStorage.removeItem('adminAuth');
        this.isAuthenticated = false;
    }

    getStoredPassword() {
    try {
        // Сначала проверяем кастомный пароль в localStorage
        const customPassword = localStorage.getItem('adminPassword');
        if (customPassword) {
            return customPassword;
        }


        
        // Если нет кастомного, используем из env.js
        return window.ENV.ADMIN_PASSWORD ;
    } catch (e) {
        return window.ENV.ADMIN_PASSWORD ;
    }
}


    setPassword(newPassword) {
        localStorage.setItem('adminPassword', newPassword);
    }

    isLockedOut() {
        const lockoutUntil = localStorage.getItem('adminLockout');
        return lockoutUntil && Date.now() < parseInt(lockoutUntil);
    }

    setLockout() {
        const lockoutUntil = Date.now() + this.lockoutTime;
        localStorage.setItem('adminLockout', lockoutUntil.toString());
        setTimeout(() => {
            localStorage.removeItem('adminLockout');
            this.loginAttempts = 0;
        }, this.lockoutTime);
    }

    login() {
        if (this.isLockedOut()) {
            const lockoutUntil = parseInt(localStorage.getItem('adminLockout'));
            const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 1000 / 60);
            this.showLoginMessage(`Слишком много попыток. Попробуйте через ${remainingTime} минут.`, 'danger');
            return;
        }

        const password = document.getElementById('passwordInput').value;
        const storedPassword = this.getStoredPassword();

        if (password === storedPassword) {
            this.isAuthenticated = true;
            this.loginAttempts = 0;
            this.saveAuthData();
            this.showAdminContent();
            this.showLoginMessage('Успешный вход!', 'success');
        } else {
            this.loginAttempts++;
            const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
            
            if (remainingAttempts > 0) {
                this.showLoginMessage(`Неверный пароль. Осталось попыток: ${remainingAttempts}`, 'danger');
            } else {
                this.setLockout();
                this.showLoginMessage('Слишком много неверных попыток. Доступ заблокирован на 5 минут.', 'danger');
            }
            
            // Очищаем поле пароля
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordInput').focus();
        }
    }

    logout() {
        this.clearAuthData();
        this.showLoginScreen();
        this.showLoginMessage('Вы вышли из системы', 'info');
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
        document.getElementById('passwordInput').value = '';
        document.getElementById('loginMessage').textContent = '';
    }

    showAdminContent() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        
        // Инициализируем остальные компоненты после авторизации
        this.initAdminComponents();
    }

    initAdminComponents() {
        // Инициализация только после авторизации
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProject();
        });

        this.displayProjects();
        this.updateProjectsCount();
    }

    showLoginMessage(message, type) {
        const messageElement = document.getElementById('loginMessage');
        messageElement.textContent = message;
        messageElement.className = `text-${type}`;
    }

    togglePassword() {
        const passwordInput = document.getElementById('passwordInput');
        const toggleIcon = passwordInput.parentNode.querySelector('.bi');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'bi bi-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'bi bi-eye';
        }
    }

    showChangePasswordModal() {
        document.getElementById('passwordForm').reset();
        document.getElementById('passwordError').classList.add('d-none');
        this.passwordModal.show();
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('passwordError');

        // Сбрасываем ошибки
        errorElement.classList.add('d-none');

        // Проверяем текущий пароль
        if (currentPassword !== this.getStoredPassword()) {
            errorElement.textContent = 'Текущий пароль неверен';
            errorElement.classList.remove('d-none');
            return;
        }

        // Проверяем совпадение новых паролей
        if (newPassword !== confirmPassword) {
            errorElement.textContent = 'Новые пароли не совпадают';
            errorElement.classList.remove('d-none');
            return;
        }

        // Проверяем длину пароля
        if (newPassword.length < 4) {
            errorElement.textContent = 'Пароль должен быть не менее 4 символов';
            errorElement.classList.remove('d-none');
            return;
        }

        // Сохраняем новый пароль
        this.setPassword(newPassword);
        this.passwordModal.hide();
        this.showAlert('Пароль успешно изменен!', 'success');
    }

    // Остальные методы остаются без изменений (loadProjects, saveProject, editProject и т.д.)
    loadProjects() {
        try {
            const saved = localStorage.getItem('portfolioProjects');
            return saved ? JSON.parse(saved) : this.getDefaultProjects();
        } catch (e) {
            console.error('Error loading projects:', e);
            return this.getDefaultProjects();
        }
    }

    getDefaultProjects() {
    return [
        {
            id: 1,
            title: "ТЦ 'Европа'",
            description: "Комплексная система безопасности торгового центра",
            categories: ["fire", "security", "video"],
            image: "fire1.jpg",
            details: [
                "Проектирование системы пожарной безопасности",
                "Монтаж охранной сигнализации", 
                "Установка системы видеонаблюдения",
                "Пуско-наладочные работы"
            ],
            area: "15 000 м²",
            duration: "3 месяца",
            location: "г. Екатеринбург",
            date: new Date().toLocaleDateString('ru-RU')
        }
    ];
}

    

   saveProject() {
    const formData = this.getFormData();
    
    // ВАЖНО: Добавьте проверку на пустые данные
    if (!formData.title || !formData.description) {
        this.showAlert('Заполните обязательные поля: название и описание', 'warning');
        return;
    }
    
    console.log('Saving project data:', formData);
    console.log('Current editingId:', this.editingId);
    
    if (this.editingId) {
        // Редактирование существующего проекта
        const index = this.projects.findIndex(p => p.id === this.editingId);
        if (index !== -1) {
            // Сохраняем ID и дату оригинала
            this.projects[index] = { 
                ...this.projects[index], 
                ...formData 
            };
            console.log('Updated project:', this.projects[index]);
        }
    } else {
        // Добавление нового проекта
        const project = {
            id: Date.now(),
            date: new Date().toLocaleDateString('ru-RU'),
            ...formData
        };
        this.projects.unshift(project);
        console.log('Added new project:', project);
    }

    this.saveProjects();
    this.displayProjects();
    this.clearForm();
    
    const message = this.editingId ? 'Проект успешно обновлен!' : 'Проект успешно добавлен!';
    this.showAlert(message, 'success');
}

    deleteCorruptedProject(button) {
        const card = button.closest('.col-lg-6');
        if (card) {
            card.remove();
            this.updateProjectsCount();
        }
    }

    getFormData() {
    // Получаем выбранные системы
    const categories = [];
    if (document.getElementById('systemFire').checked) categories.push('fire');
    if (document.getElementById('systemSecurity').checked) categories.push('security');
    if (document.getElementById('systemVideo').checked) categories.push('video');
    if (document.getElementById('systemAccess').checked) categories.push('access');

    // Парсим детали работ (каждая строка - отдельная работа)
    const detailsText = document.getElementById('projectDetails').value;
    const details = detailsText ? detailsText.split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0) : [];

    return {
        title: document.getElementById('projectTitle').value.trim(),
        description: document.getElementById('projectDescription').value.trim(),
        categories: categories,
        image: document.getElementById('projectImage').value.trim() || 'default.jpg',
        details: details,
        area: document.getElementById('projectArea').value.trim(),
        duration: document.getElementById('projectDuration').value.trim(),
        location: document.getElementById('projectLocation').value.trim()
    };
}

    editProject(id) {
    console.log('Editing project ID:', id);
    console.log('All projects:', this.projects);
    
    const project = this.projects.find(p => p.id === id);
    console.log('Found project:', project);
    
    if (!project) {
        console.error('Project not found with ID:', id);
        return;
    }

    this.editingId = id;
    
    // Заполняем форму данными проекта
    document.getElementById('projectTitle').value = project.title || '';
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectImage').value = project.image || '';
    document.getElementById('projectDetails').value = project.details ? project.details.join('\n') : '';
    document.getElementById('projectArea').value = project.area || '';
    document.getElementById('projectDuration').value = project.duration || '';
    document.getElementById('projectLocation').value = project.location || '';

    // Устанавливаем галочки систем
    document.getElementById('systemFire').checked = project.categories ? project.categories.includes('fire') : false;
    document.getElementById('systemSecurity').checked = project.categories ? project.categories.includes('security') : false;
    document.getElementById('systemVideo').checked = project.categories ? project.categories.includes('video') : false;
    document.getElementById('systemAccess').checked = project.categories ? project.categories.includes('access') : false;

    // Меняем интерфейс на режим редактирования
    document.getElementById('formTitle').textContent = 'Редактирование проекта';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check-circle"></i> Сохранить изменения';
    document.getElementById('cancelEdit').style.display = 'block';

    // Прокручиваем к форме
    document.getElementById('projectForm').scrollIntoView({ behavior: 'smooth' });
}

    cancelEdit() {
        this.editingId = null;
        this.clearForm();
        document.getElementById('formTitle').textContent = 'Добавление нового проекта';
        document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Добавить проект';
        document.getElementById('cancelEdit').style.display = 'none';
    }

    clearForm() {
        document.getElementById('projectForm').reset();
        this.editingId = null;
        document.getElementById('formTitle').textContent = 'Добавление нового проекта';
        document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Добавить проект';
        document.getElementById('cancelEdit').style.display = 'none';
    }

    displayProjects() {
        const container = document.getElementById('projectsList');
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
    console.log('Creating project element for:', project);
    
    // Защита от undefined
    if (!project) {
        console.error('Project is undefined');
        return this.createErrorProjectElement();
    }
    
    // Устанавливаем значения по умолчанию
    const safeProject = {
        id: project.id || Date.now(),
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
                        <img src="images/portfolio/${safeProject.image}" 
                             class="img-fluid rounded" 
                             style="height: 120px; width: 100%; object-fit: cover;"
                             alt="${safeProject.title}"
                             onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGVlMmY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY3Nzg5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5ldCBpbWFnZTwvdGV4dD48L3N2Zz4='">
                    </div>
                    <div class="col-md-8">
                        <h5 class="card-title">${safeProject.title}</h5>
                        <p class="card-text text-muted small">${safeProject.description}</p>
                        
                        ${safeProject.area ? `<p class="small mb-1"><strong>Площадь:</strong> ${safeProject.area}</p>` : ''}
                        ${safeProject.location ? `<p class="small mb-2"><strong>Местоположение:</strong> ${safeProject.location}</p>` : ''}
                        
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
                                <button class="btn btn-outline-primary btn-sm" onclick="window.admin.editProject(${safeProject.id})">
                                    <i class="bi bi-pencil"></i> Изменить
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="window.admin.confirmDelete(${safeProject.id}, '${safeProject.title.replace(/'/g, "\\'")}')">
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


    confirmDelete(id, title) {
    this.editingId = id;
    document.getElementById('deleteProjectName').textContent = title;
    
    // Добавьте проверку
    if (this.deleteModal) {
        this.deleteModal.show();
    } else {
        console.error('Delete modal not initialized');
        // Переинициализируем
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        this.deleteModal.show();
    }
}

    deleteProject(id) {
    console.log('Deleting project ID:', id);
    console.log('Before deletion:', this.projects);
    
    this.projects = this.projects.filter(p => p.id !== id);
    
    console.log('After deletion:', this.projects);
    
    this.saveProjects(); // ← Правильное название метода
    this.displayProjects();
    
    if (this.deleteModal) {
        this.deleteModal.hide();
    }
    
    this.showAlert('Проект успешно удален!', 'success');
}

    updateProjectsCount() {
        const count = this.projects.length;
        const countElement = document.getElementById('projectsCount');
        countElement.textContent = `${count} ${this.getRussianPlural(count, ['проект', 'проекта', 'проектов'])}`;
    }

    getRussianPlural(number, titles) {
        const cases = [2, 0, 1, 1, 1, 2];
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }

    // Остальные методы остаются без изменений (loadProjects, saveProject, editProject и т.д.)
loadProjects() {
    try {
        const saved = localStorage.getItem('portfolioProjects');
        return saved ? JSON.parse(saved) : this.getDefaultProjects();
    } catch (e) {
        console.error('Error loading projects:', e);
        return this.getDefaultProjects();
    }
}

// ДОБАВЬТЕ ЭТОТ МЕТОД - он отсутствует в вашем коде
saveProjects() {
    try {
        localStorage.setItem('portfolioProjects', JSON.stringify(this.projects));
        this.updateProjectsCount();
        console.log('Projects saved successfully:', this.projects);
    } catch (e) {
        console.error('Error saving projects:', e);
        this.showAlert('Ошибка при сохранении проектов', 'danger');
    }
}

getDefaultProjects() {
    return [
        {
            id: 1,
            title: "ТЦ 'Европа'",
            description: "Комплексная система безопасности торгового центра",
            categories: ["fire", "security", "video"],
            image: "fire1.jpg",
            details: [
                "Проектирование системы пожарной безопасности",
                "Монтаж охранной сигнализации", 
                "Установка системы видеонаблюдения",
                "Пуско-наладочные работы"
            ],
            area: "15 000 м²",
            duration: "3 месяца",
            location: "г. Екатеринбург",
            date: new Date().toLocaleDateString('ru-RU')
        }
    ];
}

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container').insertBefore(alert, document.querySelector('.container').firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
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
}

console.log('Creating global admin instance');
window.admin = new ProjectAdmin();
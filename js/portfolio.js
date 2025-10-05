class PortfolioManager {
    constructor() {
        this.projects = this.loadProjects();
    }

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

    renderPortfolio() {
        const container = document.querySelector('.portfolio-items');
        if (!container) return;

        container.innerHTML = '';

        this.projects.forEach(project => {
            const projectEl = this.createProjectElement(project);
            container.appendChild(projectEl);
        });

        // Обновляем фильтры
        this.updateFilterButtons();
    }

    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'col-lg-4 col-md-6 portfolio-item';
        
        // Добавляем все категории проекта для фильтрации
        project.categories.forEach(cat => {
            div.setAttribute(`data-${cat}`, 'true');
        });
        
        div.innerHTML = `
            <div class="portfolio-card">
                <div class="portfolio-image">
                    <img src="images/portfolio/${project.image}" alt="${project.title}" class="img-fluid"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5ldCBpbWFnZTwvdGV4dD48L3N2Zz4='">
                    <div class="portfolio-overlay">
                        <div class="portfolio-info">
                            <h5>${project.title}</h5>
                            <p>${project.description}</p>
                            <button class="btn btn-light btn-sm" onclick="portfolio.showProjectDetails(${project.id})">
                                Подробнее
                            </button>
                        </div>
                    </div>
                </div>
                <div class="portfolio-content">
                    <h5>${project.title}</h5>
                    <p>${project.description}</p>
                    <div class="project-categories">
                        ${project.categories.map(cat => `
                            <span class="badge bg-${this.getCategoryColor(cat)} me-1 mb-1">
                                ${this.getCategoryName(cat)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    updateFilterButtons() {
        const filterButtons = document.querySelectorAll('.portfolio-filters .btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Убираем активный класс у всех кнопок
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                this.filterProjects(filterValue);
            }.bind(this));
        });
    }

    filterProjects(filter) {
        const items = document.querySelectorAll('.portfolio-item');
        
        items.forEach(item => {
            if (filter === 'all' || item.getAttribute(`data-${filter}`) === 'true') {
                item.style.display = 'block';
                item.style.animation = 'fadeInUp 0.6s ease forwards';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.openProjectModal(project);
        }
    }

    openProjectModal(project) {
        const modalId = `projectModal${project.id}`;
        
        // Удаляем существующее модальное окно если есть
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${project.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <img src="images/portfolio/${project.image}" alt="${project.title}" 
                                         class="img-fluid rounded mb-3"
                                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5ldCBpbWFnZTwvdGV4dD48L3N2Zz4='">
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <strong>Установленные системы:</strong>
                                        <div class="mt-2">
                                            ${project.categories.map(cat => `
                                                <span class="badge bg-${this.getCategoryColor(cat)} me-1 mb-1">
                                                    <i class="bi bi-${this.getCategoryIcon(cat)}"></i>
                                                    ${this.getCategoryName(cat)}
                                                </span>
                                            `).join('')}
                                        </div>
                                    </div>
                                    
                                    ${project.location ? `
                                        <div class="mb-2">
                                            <strong>Местоположение:</strong> ${project.location}
                                        </div>
                                    ` : ''}
                                    
                                    ${project.area ? `
                                        <div class="mb-2">
                                            <strong>Площадь:</strong> ${project.area}
                                        </div>
                                    ` : ''}
                                    
                                    ${project.duration ? `
                                        <div class="mb-3">
                                            <strong>Срок выполнения:</strong> ${project.duration}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <h6>Выполненные работы:</h6>
                            <ul>
                                ${project.details.map(detail => `<li>${detail}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
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

// Инициализация портфолио
const portfolio = new PortfolioManager();
document.addEventListener('DOMContentLoaded', function() {
    portfolio.renderPortfolio();
});
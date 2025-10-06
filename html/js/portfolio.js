class PortfolioManager {
    constructor() {
        this.projects = [];
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.renderPortfolio();
        this.setupFilters();
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.projects = data;
            
        } catch (error) {
            console.error('❌ Error loading portfolio projects:', error);
            this.projects = this.getDefaultProjects();
        }
    }

    getDefaultProjects() {
        return [
            {
                id: "1",
                title: "ТЦ 'Европа'",
                description: "Комплексная система безопасности торгового центра",
                categories: ["fire", "security", "video"],
                image: "maxresdefault.jpg",
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
        const container = document.getElementById('portfolioItems');
        
        if (!container) {
            console.error('❌ Portfolio container (#portfolioItems) not found!');
            return;
        }

        container.innerHTML = '';

        if (this.projects.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h4 class="mt-3 text-muted">Проектов пока нет</h4>
                    <p class="text-muted">Скоро здесь появятся наши работы</p>
                </div>
            `;
            return;
        }

        
        this.projects.forEach((project, index) => {
            const projectEl = this.createProjectElement(project);
            container.appendChild(projectEl);
        });

    }

    createProjectElement(project) {
        if (!project) {
            console.error('❌ Project is undefined');
            return document.createElement('div');
        }


        const safeProject = {
            id: project.id || 'unknown',
            title: project.title || 'Без названия',
            description: project.description || 'Описание отсутствует',
            categories: Array.isArray(project.categories) ? project.categories : [],
            image: project.image || 'default.jpg',
            details: Array.isArray(project.details) ? project.details : [],
            area: project.area || '',
            duration: project.duration || '',
            location: project.location || ''
        };

        const div = document.createElement('div');
        div.className = 'col-lg-4 col-md-6 portfolio-item';
        
        safeProject.categories.forEach(cat => {
            div.setAttribute(`data-${cat}`, 'true');
        });
        
        div.innerHTML = `
            <div class="portfolio-card">
                <div class="portfolio-image">
                    <img src="images/portfolio/${safeProject.image}" alt="${safeProject.title}" class="img-fluid"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5ldCBpbWFnZTwvdGV4dD48L3N2Zz4='">
                    <div class="portfolio-overlay">
                        <div class="portfolio-info">
                            <h5>${this.escapeHtml(safeProject.title)}</h5>
                            <p>${this.escapeHtml(safeProject.description)}</p>
                            <button class="btn btn-light btn-sm" onclick="portfolio.showProjectDetails('${safeProject.id}')">
                                Подробнее
                            </button>
                        </div>
                    </div>
                </div>
                <div class="portfolio-content">
                    <h5>${this.escapeHtml(safeProject.title)}</h5>
                    <p>${this.escapeHtml(safeProject.description)}</p>
                    <div class="project-categories">
                        ${safeProject.categories.map(cat => `
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

    setupFilters() {
        const filterButtons = document.querySelectorAll('.portfolio-filters .btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const filterValue = button.getAttribute('data-filter');
                this.filterProjects(filterValue);
            });
        });
    }

    filterProjects(filter) {
        const items = document.querySelectorAll('.portfolio-item');
        
        items.forEach(item => {
            if (filter === 'all' || item.getAttribute(`data-${filter}`) === 'true') {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.openProjectModal(project);
        } else {
            console.error('❌ Project not found:', projectId);
        }
    }

    openProjectModal(project) {
        const modalId = `projectModal${project.id}`;
        
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${this.escapeHtml(project.title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <img src="images/portfolio/${project.image}" alt="${this.escapeHtml(project.title)}" 
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
                                            <strong>Местоположение:</strong> ${this.escapeHtml(project.location)}
                                        </div>
                                    ` : ''}
                                    
                                    ${project.area ? `
                                        <div class="mb-2">
                                            <strong>Площадь:</strong> ${this.escapeHtml(project.area)}
                                        </div>
                                    ` : ''}
                                    
                                    ${project.duration ? `
                                        <div class="mb-3">
                                            <strong>Срок выполнения:</strong> ${this.escapeHtml(project.duration)}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <h6>Выполненные работы:</h6>
                            <ul>
                                ${project.details.map(detail => `<li>${this.escapeHtml(detail)}</li>`).join('')}
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

    escapeHtml(text) {
        if (!text) return '';
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
}

// Глобальная переменная для портфолио
const portfolio = new PortfolioManager();

// Инициализация когда DOM готов
document.addEventListener('DOMContentLoaded', function() {
});
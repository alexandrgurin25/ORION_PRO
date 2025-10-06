// Фильтрация портфолио
document.addEventListener('DOMContentLoaded', function () {
    initPortfolioFilters();
    
    // Кнопка "Показать еще"
    const loadMoreBtn = document.getElementById('loadMoreProjects');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
            // Здесь можно добавить логику загрузки дополнительных проектов
            alert('Функция загрузки дополнительных проектов будет реализована позже');
        });
    }
});

function initPortfolioFilters() {
    const filterButtons = document.querySelectorAll('.portfolio-filters .btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            portfolioItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute(`data-${filterValue}`) === 'true') {
                    item.style.display = 'block';
                    item.style.animation = 'fadeInUp 0.6s ease forwards';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}
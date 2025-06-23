if (window.Sentry) {
    Sentry.init({ enabled: false });
}
document.addEventListener('DOMContentLoaded', function () {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.getElementById('closeModal');

    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.portfolio-item');
            const title = item.querySelector('h3').textContent;
            const src = btn.dataset.src;

            modalTitle.textContent = title;
            modalContent.innerHTML = `<iframe src="${src}" frameborder="0" allowfullscreen></iframe>`;
            modal.style.display = 'flex';
        });
    });

    closeModal.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    const heroBtn = document.querySelector('.hero-text .btn');
    if (heroBtn) {
        heroBtn.addEventListener('mouseenter', () => {
            heroBtn.classList.add('animate__animated', 'animate__pulse');
        });
        heroBtn.addEventListener('mouseleave', () => {
            heroBtn.classList.remove('animate__animated', 'animate__pulse');
        });
    }
});

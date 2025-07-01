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
    const modelRequestForm = document.getElementById('modelRequestForm');
    const formStatus = document.getElementById('formStatus');

    const imageInput = document.getElementById('referenceImage');
    let imagePreview;

    if (imageInput) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';

        const previewLabel = document.createElement('span');
        previewLabel.className = 'preview-label';
        previewLabel.textContent = 'Image Preview:';

        imagePreview = document.createElement('img');
        imagePreview.className = 'image-preview';
        imagePreview.style.display = 'none';

        previewContainer.appendChild(previewLabel);
        previewContainer.appendChild(imagePreview);
        imageInput.parentNode.appendChild(previewContainer);

        imageInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    previewContainer.style.display = 'block';
                }
                reader.readAsDataURL(this.files[0]);
            } else {
                imagePreview.style.display = 'none';
                previewContainer.style.display = 'none';
            }
        });
    }

    if (modelRequestForm) {
        if (localStorage.getItem('hasSubmittedModelRequest')) {
            modelRequestForm.querySelector('.submit-btn').disabled = true;
            showError('You have already submitted a request.');
        }

        modelRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (localStorage.getItem('hasSubmittedModelRequest')) {
                showError('You can only submit one request.');
                return;
            }

            const submitBtn = modelRequestForm.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(modelRequestForm);
                const data = Object.fromEntries(formData.entries());

                const imgBbPattern = /^https:\/\/(i\.ibb\.co|ibb\.co)\/.*$/;
                if (!imgBbPattern.test(data.referenceImage)) {
                    throw new Error('Only ImgBB URLs are allowed (format: https://ibb.co/... or https://i.ibb.co/...)');
                }

                const response = await fetch(modelRequestForm.action, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error('Failed to submit request');
                }

                localStorage.setItem('hasSubmittedModelRequest', 'true');

                showSuccess("Request submitted successfully! I'll contact you soon.");
                modelRequestForm.reset();

            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Error submitting request. Please try again.');
            } finally {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
                submitBtn.disabled = true;
            }
        });
    }


    function showError(message) {
        formStatus.textContent = message;
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
    }

    function showSuccess(message) {
        formStatus.textContent = message;
        formStatus.className = 'form-status success';
        formStatus.style.display = 'block';
    }

    function resetSubmitButton() {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
        submitBtn.disabled = false;
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);
    }
});

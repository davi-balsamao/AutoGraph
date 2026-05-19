// Initialize Lucide icons
lucide.createIcons();

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            // Adjust for fixed header
            const headerOffset = 100;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Select all elements with animation classes
const animatedElements = document.querySelectorAll(
    '.fade-in-up, .fade-in-left, .fade-in-right, .slide-in-right'
);

animatedElements.forEach(el => {
    observer.observe(el);
});

// Restart chat animation periodically for demo effect
const chatBody = document.querySelector('.chat-body');
if (chatBody) {
    setInterval(() => {
        const messages = chatBody.querySelectorAll('.message');
        messages.forEach(msg => {
            msg.style.animation = 'none';
            msg.offsetHeight; /* trigger reflow */
            msg.style.animation = null; 
        });
    }, 15000);
}

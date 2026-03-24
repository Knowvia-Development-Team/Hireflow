// JavaScript functionality for the empty website

// DOM Elements
const demoButton = document.getElementById('demoButton');
const contactForm = document.getElementById('contactForm');

// Demo Button Functionality
demoButton.addEventListener('click', function() {
    alert('Button clicked! This is a demo interaction.');
    
    // Add a simple animation effect
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 150);
});

// Contact Form Functionality
contactForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent actual form submission
    
    // Get form values
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const message = this.querySelector('textarea').value;
    
    // Simple validation
    if (name && email && message) {
        // Simulate form submission
        alert(`Thank you, ${name}! Your message has been received.`);
        
        // Reset form
        this.reset();
    } else {
        alert('Please fill in all fields.');
    }
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll Animation for Service Cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply animation to service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add current year to footer
document.querySelector('footer p').innerHTML = `&copy; ${new Date().getFullYear()} Empty Website. All rights reserved.`;

console.log('Website JavaScript loaded successfully!'); // Debug message
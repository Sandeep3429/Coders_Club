document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // STICKY HEADER ON SCROLL
    // ==========================================================================
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ==========================================================================
    // HERO TERMINAL SIMULATION (Database / ETL / SQL focus)
    // ==========================================================================
    const terminalLines = [
        "Connecting to: PROD_RECON_DB...",
        "Executing ETL_Pipeline_Daily_Maturity()...",
        ">> Validating 1.2M transactions...",
        ">> Index Scan optimized: cost reduced by 85%",
        ">> Running PL/SQL balance mismatch reconciliation...",
        ">> Report generation complete: 0 errors.",
        "System Status: SECURE & STABLE"
    ];

    const terminalBody = document.getElementById('terminal-body');
    let lineIdx = 0;

    function runTerminalSimulation() {
        if (!terminalBody) return;
        
        if (lineIdx < terminalLines.length) {
            const p = document.createElement('p');
            p.className = 'terminal-line';
            p.textContent = terminalLines[lineIdx];
            terminalBody.appendChild(p);
            
            // Auto scroll terminal to bottom
            terminalBody.scrollTop = terminalBody.scrollHeight;
            
            lineIdx++;
            setTimeout(runTerminalSimulation, 1200);
        } else {
            // Reset simulation after 5 seconds
            setTimeout(() => {
                terminalBody.innerHTML = '';
                lineIdx = 0;
                runTerminalSimulation();
            }, 6000);
        }
    }
    
    // Start terminal
    runTerminalSimulation();

    // ==========================================================================
    // INTERACTIVE GLOW EFFECTS FOR CARDS
    // ==========================================================================
    const glowCards = document.querySelectorAll('.project-card, .arsenal-card, .timeline-card');
    
    glowCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // ==========================================================================
    // SCROLL REVEAL / SCROLL ANIMATION
    // ==========================================================================
    const revealElements = document.querySelectorAll('.timeline-item, .arsenal-card, .project-card, .highlight-box');
    
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;
        
        revealElements.forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            
            if (elTop < triggerBottom) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    };

    // Initialize reveal elements styles
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger initially

    // ==========================================================================
    // MOBILE NAV MENU TOGGLE
    // ==========================================================================
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Animation for toggle lines
            const spans = menuToggle.querySelectorAll('span');
            spans[0].classList.toggle('rotate-45');
            spans[1].classList.toggle('opacity-0');
            spans[2].classList.toggle('-rotate-45');
        });
    }
});

// ==========================================================================
// NEWSLETTER & CHECKOUT HANDLERS (Global Scope)
// ==========================================================================
async function handleSubscribe(event) {
    event.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const statusText = document.getElementById('newsletter-status');
    const email = emailInput.value;

    statusText.style.display = 'block';
    statusText.style.color = 'var(--text-secondary)';
    statusText.textContent = 'Subscribing...';

    try {
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (data.success) {
            statusText.style.color = 'var(--accent-green)';
            statusText.textContent = data.message;
            emailInput.value = '';
        } else {
            statusText.style.color = '#ef4444';
            statusText.textContent = data.message || 'Subscription failed. Please check your email.';
        }
    } catch (err) {
        statusText.style.color = '#ef4444';
        statusText.textContent = 'Server connection failed. Try again later.';
    }
}

function handleCheckout(event, courseId) {
    event.preventDefault();
    const emailInput = document.getElementById(`email-${courseId}`);
    const email = emailInput.value;

    const originalButton = event.target.querySelector('button');
    originalButton.textContent = 'Redirecting to getPay...';
    originalButton.disabled = true;

    window.location.href = `payment.html?courseId=${encodeURIComponent(courseId)}&email=${encodeURIComponent(email)}`;
}


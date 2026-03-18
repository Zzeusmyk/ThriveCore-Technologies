// ===== ThriveCore Technologies - Main JavaScript =====

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Navigation Toggle ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  // --- Header Scroll Effect ---
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- Scroll Reveal Animation ---
  const fadeElements = document.querySelectorAll('.fade-in');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  };

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(el => fadeObserver.observe(el));

  // --- Animated Number Counters ---
  const statNumbers = document.querySelectorAll('[data-target]');

  if (statNumbers.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.getAttribute('data-target'));
          animateCounter(entry.target, target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(element, target) {
    let current = 0;
    const duration = 2000;
    const increment = target / (duration / 16);

    function update() {
      current += increment;
      if (current >= target) {
        element.textContent = target + '+';
        return;
      }
      element.textContent = Math.floor(current) + '+';
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // --- Contact Form Handling ---
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      // Basic validation
      if (!data.firstName || !data.lastName || !data.email || !data.message) {
        showFormMessage('Please fill in all required fields.', 'error');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        return;
      }

      // Submit to backend API
      const submitBtn = contactForm.querySelector('.form-submit');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending...';
      submitBtn.disabled = true;

      // Use current origin for API, fallback to localhost:4000
      const apiBase = window.location.protocol === 'file:'
        ? 'http://localhost:4000'
        : '';

      fetch(apiBase + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            showFormMessage(result.message, 'success');
            contactForm.reset();
          } else {
            showFormMessage(result.message || 'Something went wrong.', 'error');
          }
        })
        .catch(() => {
          showFormMessage('Could not connect to the server. Please try again later.', 'error');
        })
        .finally(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        });
    });
  }

  function showFormMessage(message, type) {
    // Remove existing message
    const existing = document.querySelector('.form-message');
    if (existing) existing.remove();

    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.style.cssText = `
      padding: 14px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.92rem;
      font-weight: 500;
      animation: slideDown 0.3s ease;
      ${type === 'success'
        ? 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'
        : 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;'
      }
    `;
    messageEl.textContent = message;

    const form = document.getElementById('contactForm');
    form.insertBefore(messageEl, form.firstChild);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(-10px)';
        messageEl.style.transition = 'all 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
      }
    }, 6000);
  }

  // --- Product Nav Scroll Highlighting ---
  const productNavItems = document.querySelectorAll('.product-nav-item');
  const productSections = document.querySelectorAll('.product-section');

  if (productNavItems.length > 0 && productSections.length > 0) {
    const navBarHeight = 160; // header + product nav bar

    const productObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          productNavItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-product') === id);
          });
          // Scroll active nav item into view
          const activeItem = document.querySelector(`.product-nav-item[data-product="${id}"]`);
          if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
      });
    }, {
      root: null,
      rootMargin: `-${navBarHeight}px 0px -50% 0px`,
      threshold: 0
    });

    productSections.forEach(section => productObserver.observe(section));
  }

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 80;
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

});

// --- Add slideDown keyframe ---
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

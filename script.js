'use strict';

// ─── Mobile nav ───
const hamburger = document.querySelector('.hamburger');
const navLinks  = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});

// Close nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// ─── Active nav highlight on scroll ───
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

// ─── Contact form (demo — logs to console; wire to backend/Formspree/EmailJS) ───
const form = document.getElementById('contact-form');
const successMsg = document.getElementById('form-success');

form.addEventListener('submit', e => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.querySelectorAll(':invalid').forEach(el => el.reportValidity());
    return;
  }

  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  // Simulate async submission — replace this block with a real fetch() call.
  setTimeout(() => {
    successMsg.hidden = false;
    form.reset();
    btn.disabled = false;
    btn.textContent = 'Send Message';
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1200);
});

// ─── Scroll-in animation ───
const animateOnScroll = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      animateOnScroll.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .step, .pricing-card, .compare-col').forEach(el => {
  el.classList.add('fade-in');
  animateOnScroll.observe(el);
});

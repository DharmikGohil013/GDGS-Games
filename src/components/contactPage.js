// ─── Contact Page ───

import { trackEvent } from '../utils/analytics.js';

export function createContactPage() {
  const page = document.createElement('div');
  page.className = 'page-content';
  // Schema.org ContactPage microdata
  page.setAttribute('itemscope', '');
  page.setAttribute('itemtype', 'https://schema.org/ContactPage');

  page.innerHTML = `
    <div class="page-hero" role="banner">
      <span class="page-badge" aria-label="Section: Contact">Get in Touch</span>
      <h1 class="page-title" itemprop="headline">Contact Us</h1>
      <p class="page-subtitle" itemprop="description">Have a question, suggestion, or just want to say hello? We'd love to hear from you.</p>
    </div>

    <div class="page-section">
      <div class="contact-grid">

        <div class="contact-info-card">
          <div class="contact-item">
            <div class="contact-icon" style="background:rgba(255,95,77,0.12);color:var(--coral)">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h3>Location</h3>
              <p>Mumbai, India</p>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-icon" style="background:rgba(62,107,255,0.12);color:var(--blue)">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h3>Email</h3>
              <p><a href="mailto:dharmikgohil.work@gmail.com" class="contact-email">dharmikgohil.work@gmail.com</a></p>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-icon" style="background:rgba(139,92,246,0.12);color:var(--purple)">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <h3>Website</h3>
              <p><a href="https://dharmikgohil.art" target="_blank" rel="noopener noreferrer" class="contact-link">dharmikgohil.art</a></p>
            </div>
          </div>
        </div>

        <div class="contact-form-card">
          <h2>Send us a message</h2>
          <p class="contact-form-sub">Fill out the form to open a draft in your email app. You'll need to press Send there.</p>
          <form class="contact-form" id="contact-form">
            <div class="form-group">
              <label for="contact-name">Full Name</label>
              <input type="text" id="contact-name" placeholder="Your name" required />
            </div>
            <div class="form-group">
              <label for="contact-email">Email Address</label>
              <input type="email" id="contact-email" placeholder="your@email.com" required />
            </div>
            <div class="form-group">
              <label for="contact-subject">Subject</label>
              <select id="contact-subject" required>
                <option value="" disabled selected>Choose a topic</option>
                <option value="general">General Inquiry</option>
                <option value="bug">Bug Report</option>
                <option value="suggestion">Game Suggestion</option>
                <option value="partnership">Partnership</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="contact-message">Message</label>
              <textarea id="contact-message" placeholder="Tell us what's on your mind..." rows="5" required></textarea>
            </div>
            <button type="submit" class="btn-primary contact-submit-btn">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                <path d="M2.5 2.5L18 10L2.5 17.5V11.25L13 10L2.5 8.75V2.5Z"/>
              </svg>
              Open Email Draft
            </button>
          </form>
          <p id="contact-status" role="status" style="display:none">Your email app should open a draft. Press Send there to deliver it. If no app opens, email us at <a href="mailto:dharmikgohil.work@gmail.com">dharmikgohil.work@gmail.com</a>.</p>
        </div>

      </div>
    </div>

    <div class="page-section">
      <div class="contact-note">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p>We typically respond within 24–48 hours on business days. For urgent matters, please include "Urgent" in your subject line.</p>
      </div>
    </div>
  `;

  // Form submission handler
  const form = page.querySelector('#contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    const topic = form.querySelector('#contact-subject');
    const message = form.querySelector('#contact-message').value.trim();
    if (!name || !email || !topic.value || !message) return;

    const subject = `Playzy: ${topic.selectedOptions[0].textContent}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const draftUrl = `mailto:dharmikgohil.work@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    page.querySelector('#contact-status').style.display = 'block';
    trackEvent('contact_email_intent', { contact_topic: topic.value });
    window.location.href = draftUrl;
  });

  return page;
}

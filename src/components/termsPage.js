// ─── Terms of Service Page ───

export function createTermsPage() {
  const page = document.createElement('div');
  page.className = 'page-content';

  page.innerHTML = `
    <div class="page-hero">
      <span class="page-badge">Legal</span>
      <h1 class="page-title">Terms of Service</h1>
      <p class="page-subtitle">Last updated: July 30, 2026</p>
    </div>

    <div class="page-section legal-content">

      <div class="legal-block">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using Playzy ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Platform. These Terms constitute a legally binding agreement between you ("User") and Playzy ("we," "us," or "our").</p>
      </div>

      <div class="legal-block">
        <h2>2. Description of Service</h2>
        <p>Playzy is a free-to-use, browser-based gaming platform that hosts and provides access to over 1,000 instant-play games. Our games run directly in your web browser and require no downloads, installations, or account creation to play.</p>
        <p>We reserve the right to modify, suspend, or discontinue any part of the Platform at any time, with or without notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.</p>
      </div>

      <div class="legal-block">
        <h2>3. User Eligibility</h2>
        <p>The Platform is intended for users of all ages. Some games may contain content more suitable for certain age groups. By using the Platform, you represent that you are at least 13 years of age, or that you are accessing the Platform under the supervision of a parent or legal guardian.</p>
      </div>

      <div class="legal-block">
        <h2>4. Acceptable Use</h2>
        <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms. You agree not to:</p>
        <ul>
          <li>Use the Platform in any way that violates any applicable law or regulation.</li>
          <li>Attempt to gain unauthorized access to any part of the Platform, its servers, or any connected systems.</li>
          <li>Use any automated tools, bots, scrapers, or similar technology to access or interact with the Platform.</li>
          <li>Interfere with or disrupt the Platform's infrastructure, servers, or networks.</li>
          <li>Reproduce, distribute, modify, or create derivative works of any content on the Platform without prior written consent.</li>
          <li>Use the Platform to transmit any harmful, offensive, or inappropriate content.</li>
          <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>5. Intellectual Property Rights</h2>
        <p>All content on the Platform — including but not limited to games, graphics, user interfaces, audio, video, text, code, software, and the Playzy brand — is owned by or licensed to Playzy and is protected by copyright, trademark, and other intellectual property laws.</p>
        <p>You may not copy, reproduce, distribute, transmit, broadcast, display, sell, license, or otherwise exploit any content on the Platform for any commercial purpose without our prior written consent.</p>
      </div>

      <div class="legal-block">
        <h2>6. Third-Party Content</h2>
        <p>Some games on the Platform may be developed by third-party creators. While we review and curate all games for quality and appropriateness, we do not assume responsibility for third-party game content. Third-party games are subject to their own terms and conditions where applicable.</p>
      </div>

      <div class="legal-block">
        <h2>7. Disclaimer of Warranties</h2>
        <p>The Platform is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. We do not guarantee that the Platform will be uninterrupted, error-free, secure, or free of viruses or other harmful components.</p>
        <p>To the fullest extent permitted by applicable law, we disclaim all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
      </div>

      <div class="legal-block">
        <h2>8. Limitation of Liability</h2>
        <p>To the maximum extent permitted by applicable law, Playzy and its affiliates, officers, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of profits, or business interruption, arising out of or in connection with your use of the Platform.</p>
      </div>

      <div class="legal-block">
        <h2>9. Indemnification</h2>
        <p>You agree to indemnify, defend, and hold harmless Playzy, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorney's fees) arising out of your use of the Platform or any violation of these Terms.</p>
      </div>

      <div class="legal-block">
        <h2>10. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts located in Mumbai, India.</p>
      </div>

      <div class="legal-block">
        <h2>11. Changes to Terms</h2>
        <p>We reserve the right to update or modify these Terms at any time. Changes will be effective immediately upon posting to the Platform. Your continued use of the Platform after any changes constitutes acceptance of the revised Terms. We encourage you to review these Terms periodically.</p>
      </div>

      <div class="legal-block">
        <h2>12. Severability</h2>
        <p>If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.</p>
      </div>

      <div class="legal-block">
        <h2>13. Entire Agreement</h2>
        <p>These Terms, together with the Privacy Policy, constitute the entire agreement between you and Playzy regarding your use of the Platform and supersede all prior agreements, representations, and understandings.</p>
      </div>

    </div>
  `;

  return page;
}

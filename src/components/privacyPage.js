// ─── Privacy Policy Page ───

export function createPrivacyPage() {
  const page = document.createElement('div');
  page.className = 'page-content';

  page.innerHTML = `
    <div class="page-hero">
      <span class="page-badge">Legal</span>
      <h1 class="page-title">Privacy Policy</h1>
      <p class="page-subtitle">Last updated: November 24, 2026</p>
    </div>

    <div class="page-section legal-content">

      <div class="legal-block">
        <h2>1. Introduction</h2>
        <p>Playzy ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit and use our gaming platform at playzy.dharmikgohil.art ("the Platform"). Please read this policy carefully.</p>
        <p>By using the Platform, you consent to the practices described in this Privacy Policy. If you do not agree with this policy, please do not use the Platform.</p>
      </div>

      <div class="legal-block">
        <h2>2. Information We Collect</h2>
        <h3>2.1 Information Collected Automatically</h3>
        <p>When you access the Platform, we may automatically collect certain information about your device and usage, including:</p>
        <ul>
          <li><strong>Device Information:</strong> Browser type and version, operating system, screen resolution, and device type.</li>
          <li><strong>Usage Data:</strong> Pages visited, games played, time spent on the Platform, click patterns, and navigation paths.</li>
          <li><strong>Network Information:</strong> IP address, approximate geographic location (country/city level), and internet service provider.</li>
          <li><strong>Cookies and Similar Technologies:</strong> We use cookies and local storage to enhance your experience, remember preferences, and analyze Platform usage.</li>
        </ul>

        <h3>2.2 Information You Provide</h3>
        <p>Playzy is designed to be used without creating an account. The one exception is <a href="/games/infinite-world/">Infinite World</a>, our multiplayer city builder, which has optional accounts — see the <a href="/games/infinite-world/privacy/">Infinite World Privacy Policy</a>. If you contact us or interact with certain features, you may voluntarily provide:</p>
        <ul>
          <li>Name and email address you choose to send through your email app when contacting us.</li>
          <li>Feedback, bug reports, or suggestions.</li>
          <li>Any other information you choose to provide.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect for the following purposes:</p>
        <ul>
          <li><strong>Platform Operation:</strong> To provide, maintain, and improve the Platform and its games.</li>
          <li><strong>Analytics:</strong> To understand how users interact with the Platform, identify popular games, and optimize performance.</li>
          <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and abuse.</li>
          <li><strong>Communication:</strong> To respond to your inquiries and provide customer support when you contact us.</li>
          <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>4. Cookies and Tracking Technologies</h2>
        <p>We use the following types of cookies:</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for the Platform to function properly. These cannot be disabled.</li>
          <li><strong>Performance Cookies:</strong> Help us understand how users interact with the Platform by collecting anonymous usage data.</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences for a better experience.</li>
        </ul>
        <p>You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may impact Platform functionality.</p>
      </div>

      <div class="legal-block" id="advertising">
        <h2>4a. Advertising and Google AdSense</h2>
        <p>Playzy is free to play and is supported by advertising. We use Google AdSense, a service provided by Google LLC, to show ads on parts of the Platform.</p>
        <ul>
          <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.</li>
          <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to Playzy and/or other sites on the Internet.</li>
          <li>Depending on your location, ads may be personalised or non-personalised. Where the law requires it, personalised ads are only shown after you give consent.</li>
          <li>You can opt out of personalised advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. You can also opt out of some third-party vendors' use of cookies for personalised advertising at <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>.</li>
          <li>To learn how Google uses data from sites that use its services, see <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use our services</a>.</li>
        </ul>
        <p>We never ask you to click on ads. We do not control the ads shown by Google or the cookies set by its advertisers.</p>
      </div>

      <div class="legal-block" id="analytics">
        <h2>4b. Analytics</h2>
        <p>We use Google Analytics to measure which pages and games are used, so we can improve the Platform. Google Analytics collects information such as pages viewed, device type and approximate location. You can prevent this by using your browser's privacy controls or the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out add-on</a>.</p>
      </div>

      <div class="legal-block">
        <h2>5. Data Sharing and Disclosure</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following limited circumstances:</p>
        <ul>
          <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating the Platform (e.g., hosting, analytics), bound by confidentiality agreements.</li>
          <li><strong>Advertising Partners:</strong> Google and its advertising partners receive cookie and device information when ads are shown, as described in section 4a.</li>
          <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request.</li>
          <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of Playzy, our users, or the public.</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, where user information may be among the transferred assets.</li>
        </ul>
      </div>

      <div class="legal-block">
        <h2>6. Data Security</h2>
        <p>We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
      </div>

      <div class="legal-block">
        <h2>7. Data Retention</h2>
        <p>We retain your information only for as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law. Automatically collected usage data is typically retained for up to 24 months.</p>
      </div>

      <div class="legal-block">
        <h2>8. Children's Privacy</h2>
        <p>Playzy is intended for users of all ages. We do not knowingly collect personal information from children under 13 years of age. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly. If you believe a child under 13 has provided us with personal information, please contact us.</p>
      </div>

      <div class="legal-block">
        <h2>9. Your Rights</h2>
        <p>Depending on your location, you may have the following rights regarding your personal information:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
          <li><strong>Correction:</strong> Request correction of any inaccurate or incomplete personal information.</li>
          <li><strong>Deletion:</strong> Request deletion of your personal information, subject to certain legal exceptions.</li>
          <li><strong>Opt-Out:</strong> Opt out of certain data collection practices, including cookies and analytics tracking.</li>
          <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format.</li>
        </ul>
        <p>To exercise any of these rights, please reach out to us through our Contact page.</p>
      </div>

      <div class="legal-block">
        <h2>10. Third-Party Links</h2>
        <p>The Platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.</p>
      </div>

      <div class="legal-block">
        <h2>11. International Data Transfers</h2>
        <p>Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using the Platform, you consent to the transfer of your information to India and other countries where we operate.</p>
      </div>

      <div class="legal-block">
        <h2>12. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised "Last updated" date. Your continued use of the Platform after any changes constitutes acceptance of the updated policy. We encourage you to review this page periodically.</p>
      </div>

      <div class="legal-block">
        <h2>13. Governing Law</h2>
        <p>This Privacy Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising from this policy shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.</p>
      </div>

    </div>
  `;

  return page;
}

<script lang="ts">
  const currentYear = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="container">
    <div class="footer-content">
      <div class="footer-section">
        <h3 class="footer-title">Expense Tracker</h3>
        <p class="footer-description">
          Track your expenses, manage trips, and log mileage with our comprehensive expense tracking solution.
        </p>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-title">Quick Links</h3>
        <ul class="footer-links">
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/expenses">Expenses</a></li>
          <li><a href="/trips">Trips</a></li>
          <li><a href="/mileage">Mileage</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3 class="footer-title">Help & Support</h3>
        <ul class="footer-links">
          <li><a href="/help">Help Center</a></li>
          <li><a href="/faq">FAQ</a></li>
          <li><a href="/contact">Contact Us</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p class="copyright">
        &copy; {currentYear} Expense Tracker. All rights reserved.
      </p>
      <div class="footer-legal">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer {
    background-color: var(--surface-color);
    border-top: 1px solid var(--border-color);
    padding: 2rem 0 1rem;
    margin-top: auto;
  }
  
  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .footer-title {
    font-size: 1.125rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  
  .footer-description {
    color: var(--text-muted);
    line-height: 1.5;
  }
  
  .footer-links {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .footer-links li {
    margin-bottom: 0.5rem;
  }
  
  .footer-links a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  
  .footer-links a:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }
  
  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    color: var(--text-muted);
    font-size: 0.875rem;
  }
  
  .copyright {
    margin: 0;
  }
  
  .footer-legal {
    display: flex;
    gap: 1.5rem;
  }
  
  .footer-legal a {
    color: var(--text-muted);
    text-decoration: none;
  }
  
  .footer-legal a:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }
  
  @media (max-width: 768px) {
    .footer-content {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .footer-bottom {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .footer-legal {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
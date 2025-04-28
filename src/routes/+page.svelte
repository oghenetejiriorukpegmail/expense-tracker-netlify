<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="home">
  <section class="hero">
    <h1>Welcome to Expense Tracker</h1>
    <p>Take control of your finances with our easy-to-use expense tracking solution.</p>
  </section>

  <section class="features">
    <h2>Features</h2>
    <div class="feature-grid">
      <Card title="Expense Tracking" padding="p-6">
        <p>Track your daily expenses with ease. Categorize, add notes, and attach receipts.</p>
      </Card>

      <Card title="Visual Analytics" padding="p-6">
        <p>View your spending patterns with interactive charts and detailed breakdowns.</p>
      </Card>

      <Card title="Budget Management" padding="p-6">
        <p>Set budgets for different categories and get alerts when you're close to limits.</p>
      </Card>

      <Card title="Export & Reports" padding="p-6">
        <p>Generate detailed reports and export your data in multiple formats.</p>
      </Card>
    </div>
  </section>

  <section class="cta">
    <Card padding="p-8">
      <h2>Ready to Start?</h2>
      <p>Head to your dashboard to begin tracking expenses.</p>
      <a href="/dashboard" class="cta-button">Go to Dashboard</a>
    </Card>
  </section>
</div>

<style>
  .home {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-6);
  }

  .hero {
    text-align: center;
    margin-bottom: var(--spacing-12);
  }

  .hero h1 {
    font-size: 2.5rem;
    color: var(--text-color);
    margin-bottom: var(--spacing-4);
  }

  .hero p {
    font-size: 1.25rem;
    color: #64748b;
    max-width: 600px;
    margin: 0 auto;
  }

  .features {
    margin-bottom: var(--spacing-12);
  }

  .features h2 {
    text-align: center;
    margin-bottom: var(--spacing-8);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-6);
  }

  .cta {
    text-align: center;
  }

  .cta h2 {
    margin-bottom: var(--spacing-4);
  }

  .cta p {
    margin-bottom: var(--spacing-6);
  }

  .cta-button {
    display: inline-block;
    background-color: var(--primary-color);
    color: white;
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--border-radius-md);
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .cta-button:hover {
    background-color: var(--secondary-color);
    text-decoration: none;
  }

  @media (max-width: 640px) {
    .hero h1 {
      font-size: 2rem;
    }

    .hero p {
      font-size: 1rem;
    }

    .feature-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
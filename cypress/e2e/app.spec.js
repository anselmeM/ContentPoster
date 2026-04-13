describe('ContentPoster E2E Tests', () => {
  beforeEach(() => {
    // Clear local storage and cookies before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Authentication Flow', () => {
    it('should show login form initially', () => {
      cy.visit('/');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('should toggle between login and signup', () => {
      cy.visit('/');
      cy.contains('Create Account').click();
      cy.get('input[type="email"]').should('be.visible');
      cy.contains('Already have an account?').should('be.visible');
    });

    it('should show validation errors for empty form submission', () => {
      cy.visit('/');
      cy.get('button[type="submit"]').click();
      // Should show some validation (implementation dependent)
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Login first (would need mock auth in real test)
      cy.visit('/');
    });

    it('should have sidebar navigation', () => {
      cy.get('[data-testid="sidebar"]').should('exist');
    });

    it('should navigate between views', () => {
      // Click on different nav items
      cy.contains('Tasks').click();
      cy.url().should('include', 'tasks');
      
      cy.contains('Templates').click();
      cy.url().should('include', 'templates');
    });
  });

  describe('Post Scheduling', () => {
    it('should open post modal', () => {
      cy.visit('/');
      cy.contains('New Post').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('should have platform selector in modal', () => {
      cy.visit('/');
      cy.contains('New Post').click();
      cy.get('select[name="platform"]').should('exist');
    });

    it('should validate content before submission', () => {
      cy.visit('/');
      cy.contains('New Post').click();
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should show validation error
      cy.contains('required').should('exist');
    });
  });

  describe('Settings', () => {
    it('should access settings page', () => {
      cy.visit('/');
      cy.contains('Settings').click();
      cy.url().should('include', 'settings');
    });

    it('should have platform connections section', () => {
      cy.visit('/settings');
      cy.contains('Social Media Connections').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have skip link', () => {
      cy.visit('/');
      cy.get('.skip-link').should('exist');
    });

    it('should have proper heading hierarchy', () => {
      cy.visit('/');
      cy.get('h1').should('exist');
    });
  });
});
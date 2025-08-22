// Embeddable sBTC Payment Widget
(function() {
  'use strict';

  // Default configuration
  const DEFAULT_CONFIG = {
    apiBase: 'https://sbtcpay.org',
    checkoutBase: 'https://checkout.sbtcgateway.com',
    styles: {
      button: {
        backgroundColor: '#3B82F6',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      },
      buttonHover: {
        backgroundColor: '#2563EB'
      },
      buttonDisabled: {
        backgroundColor: '#9CA3AF',
        cursor: 'not-allowed'
      }
    }
  };

  class SBTCWidget {
    constructor(config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.apiKey = config.publicKey;
      
      if (!this.apiKey) {
        throw new Error('publicKey is required');
      }
    }

    async createPaymentIntent(params) {
      const response = await fetch(`${this.config.apiBase}/v1/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create payment intent');
      }

      return response.json();
    }

    createButton(element, options = {}) {
      const button = document.createElement('button');
      
      // Apply styles
      Object.assign(button.style, this.config.styles.button);
      
      button.textContent = options.text || 'Pay with sBTC';
      button.disabled = false;

      // Hover effects
      button.addEventListener('mouseenter', () => {
        if (!button.disabled) {
          Object.assign(button.style, this.config.styles.buttonHover);
        }
      });

      button.addEventListener('mouseleave', () => {
        if (!button.disabled) {
          Object.assign(button.style, this.config.styles.button);
        }
      });

      // Click handler
      button.addEventListener('click', async () => {
        if (button.disabled) return;

        button.disabled = true;
        button.textContent = 'Processing...';
        Object.assign(button.style, this.config.styles.buttonDisabled);

        try {
          const paymentIntent = await this.createPaymentIntent({
            amount: options.amount,
            amount_usd: options.amount_usd,
            currency: 'sbtc',
            description: options.description,
            metadata: options.metadata
          });

          // Redirect to checkout
          const checkoutUrl = `${this.config.checkoutBase}/checkout/${paymentIntent.id}`;
          if (options.redirectMode === 'modal') {
            this.openModal(checkoutUrl);
          } else {
            window.location.href = checkoutUrl;
          }

          if (options.onSuccess) {
            options.onSuccess(paymentIntent);
          }
        } catch (error) {
          console.error('Payment error:', error);
          if (options.onError) {
            options.onError(error);
          }
          alert('Payment failed: ' + error.message);
        } finally {
          button.disabled = false;
          button.textContent = options.text || 'Pay with sBTC';
          Object.assign(button.style, this.config.styles.button);
        }
      });

      element.appendChild(button);
      return button;
    }

    openModal(url) {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Create modal content
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        height: 600px;
        position: relative;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      `;

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        z-index: 10001;
      `;

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 8px;
      `;

      // Close modal function
      const closeModal = () => {
        document.body.removeChild(overlay);
      };

      closeButton.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });

      modal.appendChild(closeButton);
      modal.appendChild(iframe);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    }

    mount(selector, options = {}) {
      const element = typeof selector === 'string' 
        ? document.querySelector(selector)
        : selector;
      
      if (!element) {
        throw new Error('Element not found');
      }

      return this.createButton(element, options);
    }
  }

  // Global API
  window.SBTCGateway = {
    create: (config) => new SBTCWidget(config),
    Widget: SBTCWidget
  };

  // Auto-initialization from script tag attributes
  document.addEventListener('DOMContentLoaded', () => {
    const scripts = document.querySelectorAll('script[data-sbtc-key]');
    scripts.forEach(script => {
      const publicKey = script.getAttribute('data-sbtc-key');
      const autoMount = script.getAttribute('data-auto-mount');
      
      if (autoMount && publicKey) {
        const widget = new SBTCWidget({ publicKey });
        const elements = document.querySelectorAll('[data-sbtc-button]');
        
        elements.forEach(el => {
          const amount = parseFloat(el.getAttribute('data-amount'));
          const amountUsd = parseFloat(el.getAttribute('data-amount-usd'));
          const description = el.getAttribute('data-description');
          const text = el.getAttribute('data-text');
          
          widget.mount(el, {
            amount,
            amount_usd: amountUsd,
            description,
            text
          });
        });
      }
    });
  });
})();
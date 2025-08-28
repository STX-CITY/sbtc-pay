/**
 * sBTC Payment Widget v1.0
 * Drop-in payment widgets for sBTC payments
 * 
 * Usage: <script src="/widget.js" data-sbtc-key="pk_..." data-product-id="..."></script>
 */

(function() {
  'use strict';

  // Configuration
  const WIDGET_CONFIG = {
    version: '1.0.0',
    apiBase: window.location.origin,
    embedPath: '/embed/checkout',
    defaultTheme: 'light',
    defaultColor: '#3B82F6',
    defaultText: 'Pay with sBTC',
    defaultSize: 'medium'
  };

  // Utility functions
  const utils = {
    // Generate unique widget ID
    generateId: function() {
      return 'sbtc-widget-' + Math.random().toString(36).substr(2, 9);
    },

    // Get data attribute value with fallback
    getData: function(element, key, fallback) {
      const value = element.getAttribute('data-' + key) || element.getAttribute('data-sbtc-' + key);
      return value || fallback;
    },

    // Create DOM element with attributes
    createElement: function(tag, attributes, children) {
      const element = document.createElement(tag);
      
      if (attributes) {
        Object.keys(attributes).forEach(key => {
          if (key === 'className') {
            element.className = attributes[key];
          } else if (key === 'innerHTML') {
            element.innerHTML = attributes[key];
          } else {
            element.setAttribute(key, attributes[key]);
          }
        });
      }

      if (children) {
        if (typeof children === 'string') {
          element.textContent = children;
        } else if (Array.isArray(children)) {
          children.forEach(child => {
            if (typeof child === 'string') {
              element.appendChild(document.createTextNode(child));
            } else {
              element.appendChild(child);
            }
          });
        } else {
          element.appendChild(children);
        }
      }

      return element;
    },

    // Inject CSS styles
    injectStyles: function() {
      if (document.getElementById('sbtc-widget-styles')) return;

      const styles = `
        .sbtc-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          box-sizing: border-box;
        }
        
        .sbtc-widget *, .sbtc-widget *:before, .sbtc-widget *:after {
          box-sizing: inherit;
        }
        
        .sbtc-widget-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          outline: none;
        }
        
        .sbtc-widget-button:focus {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        
        .sbtc-widget-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Sizes */
        .sbtc-widget-button-small {
          padding: 6px 12px;
          font-size: 14px;
          line-height: 1.25;
        }
        
        .sbtc-widget-button-medium {
          padding: 8px 16px;
          font-size: 16px;
          line-height: 1.5;
        }
        
        .sbtc-widget-button-large {
          padding: 12px 24px;
          font-size: 18px;
          line-height: 1.5;
        }
        
        /* Themes */
        .sbtc-widget-button-light {
          background-color: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }
        
        .sbtc-widget-button-light:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
        
        .sbtc-widget-button-dark {
          background-color: #1f2937;
          border-color: #4b5563;
          color: #ffffff;
        }
        
        .sbtc-widget-button-dark:hover:not(:disabled) {
          background-color: #111827;
          border-color: #6b7280;
        }
        
        .sbtc-widget-button-branded {
          border-color: transparent;
          color: #ffffff;
        }
        
        .sbtc-widget-button-branded:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        /* Link styles */
        .sbtc-widget-link {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 500;
        }
        
        .sbtc-widget-link:hover {
          text-decoration: none;
        }
        
        /* Inline widget */
        .sbtc-widget-inline {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          background: #ffffff;
          max-width: 400px;
        }
        
        .sbtc-widget-inline-dark {
          background: #1f2937;
          border-color: #4b5563;
          color: #ffffff;
        }
        
        .sbtc-widget-product-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .sbtc-widget-product-description {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 16px;
        }
        
        .sbtc-widget-product-price {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        
        /* Modal styles */
        .sbtc-widget-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .sbtc-widget-modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .sbtc-widget-modal iframe {
          width: 100%;
          border: none;
          display: block;
        }
        
        .sbtc-widget-loading {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: sbtc-spin 1s linear infinite;
          margin-right: 8px;
        }
        
        @keyframes sbtc-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 640px) {
          .sbtc-widget-modal {
            padding: 10px;
          }
          
          .sbtc-widget-modal-content {
            max-height: 95vh;
          }
        }
      `;

      const styleSheet = utils.createElement('style', {
        id: 'sbtc-widget-styles',
        type: 'text/css'
      });
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  };

  // Widget class
  class SBTCWidget {
    constructor(config) {
      this.config = {
        apiKey: config.apiKey,
        productId: config.productId,
        theme: config.theme || WIDGET_CONFIG.defaultTheme,
        color: config.color || WIDGET_CONFIG.defaultColor,
        text: config.text || WIDGET_CONFIG.defaultText,
        size: config.size || WIDGET_CONFIG.defaultSize,
        type: config.type || 'button',
        showAmount: config.showAmount !== 'false',
        showDescription: config.showDescription !== 'false',
        customAmount: config.customAmount ? parseFloat(config.customAmount) : null,
        element: config.element
      };
      
      this.id = utils.generateId();
      this.product = null;
      this.modal = null;
      
      this.init();
    }

    async init() {
      try {
        // Load product data if needed
        if (this.config.showAmount || this.config.showDescription || this.config.type === 'inline') {
          await this.loadProduct();
        }
        
        // Create the widget
        this.createWidget();
      } catch (error) {
        console.error('sBTC Widget Error:', error);
        this.showError('Failed to initialize payment widget');
      }
    }

    async loadProduct() {
      if (!this.config.productId) return;

      try {
        const response = await fetch(`${WIDGET_CONFIG.apiBase}/api/v1/products/${this.config.productId}`);
        if (response.ok) {
          this.product = await response.json();
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      }
    }

    createWidget() {
      const container = this.config.element;
      container.className = 'sbtc-widget ' + (container.className || '');

      switch (this.config.type) {
        case 'inline':
          this.createInlineWidget(container);
          break;
        case 'link':
          this.createLinkWidget(container);
          break;
        default:
          this.createButtonWidget(container);
      }
    }

    createButtonWidget(container) {
      const button = utils.createElement('button', {
        className: this.getButtonClasses(),
        style: this.getButtonStyles(),
        'data-sbtc-widget-id': this.id
      });

      const content = [this.config.text];
      
      if (this.config.showAmount && this.product) {
        const amount = this.config.customAmount 
          ? `$${this.config.customAmount.toFixed(2)}`
          : this.product.price_usd 
            ? `$${this.product.price_usd.toFixed(2)}`
            : `${(this.product.price / 100000000).toFixed(8)} sBTC`;
        content.push(` - ${amount}`);
      }

      button.textContent = content.join('');
      button.addEventListener('click', () => this.handleClick());

      container.appendChild(button);
    }

    createLinkWidget(container) {
      const link = utils.createElement('a', {
        href: '#',
        className: 'sbtc-widget-link',
        style: `color: ${this.config.color}`,
        'data-sbtc-widget-id': this.id
      }, this.config.text);

      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleClick();
      });

      container.appendChild(link);
    }

    createInlineWidget(container) {
      const widget = utils.createElement('div', {
        className: `sbtc-widget-inline ${this.config.theme === 'dark' ? 'sbtc-widget-inline-dark' : ''}`,
        'data-sbtc-widget-id': this.id
      });

      if (this.product) {
        // Product info
        if (this.config.showDescription && this.product.name) {
          const name = utils.createElement('div', {
            className: 'sbtc-widget-product-name'
          }, this.product.name);
          widget.appendChild(name);
        }

        if (this.config.showDescription && this.product.description) {
          const description = utils.createElement('div', {
            className: 'sbtc-widget-product-description'
          }, this.product.description);
          widget.appendChild(description);
        }

        if (this.config.showAmount) {
          const amount = this.config.customAmount 
            ? `$${this.config.customAmount.toFixed(2)}`
            : this.product.price_usd 
              ? `$${this.product.price_usd.toFixed(2)}`
              : `${(this.product.price / 100000000).toFixed(8)} sBTC`;
          
          const price = utils.createElement('div', {
            className: 'sbtc-widget-product-price'
          }, amount);
          widget.appendChild(price);
        }
      }

      // Payment button
      const button = utils.createElement('button', {
        className: this.getButtonClasses() + ' ' + (this.config.type === 'inline' ? 'sbtc-widget-button-full' : ''),
        style: this.getButtonStyles() + (this.config.type === 'inline' ? '; width: 100%' : '')
      }, this.config.text);

      button.addEventListener('click', () => this.handleClick());
      widget.appendChild(button);

      container.appendChild(widget);
    }

    getButtonClasses() {
      const classes = ['sbtc-widget-button'];
      classes.push(`sbtc-widget-button-${this.config.size}`);
      classes.push(`sbtc-widget-button-${this.config.theme}`);
      return classes.join(' ');
    }

    getButtonStyles() {
      if (this.config.theme === 'branded') {
        return `background-color: ${this.config.color}; border-color: ${this.config.color}`;
      }
      return '';
    }

    async handleClick() {
      if (!this.config.apiKey) {
        this.showError('API key is required');
        return;
      }

      if (!this.config.productId && !this.config.customAmount) {
        this.showError('Product ID or custom amount is required');
        return;
      }

      this.showLoading();
      
      try {
        // Open checkout modal
        await this.openCheckout();
      } catch (error) {
        console.error('Checkout error:', error);
        this.showError('Failed to open checkout');
      }
    }

    showLoading() {
      const button = document.querySelector(`[data-sbtc-widget-id="${this.id}"]`);
      if (button && button.tagName === 'BUTTON') {
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = `<span class="sbtc-widget-loading"></span>Loading...`;
        
        // Restore after 10 seconds max
        setTimeout(() => {
          if (button.disabled) {
            button.disabled = false;
            button.textContent = originalText;
          }
        }, 10000);
      }
    }

    showError(message) {
      console.error('sBTC Widget:', message);
      alert(`Payment Error: ${message}`);
      
      // Restore button state
      const button = document.querySelector(`[data-sbtc-widget-id="${this.id}"]`);
      if (button && button.tagName === 'BUTTON') {
        button.disabled = false;
        button.innerHTML = this.config.text;
      }
    }

    openCheckout() {
      return new Promise((resolve, reject) => {
        // Build checkout URL
        const params = new URLSearchParams({
          api_key: this.config.apiKey,
          theme: this.config.theme,
          primary_color: this.config.color
        });

        if (this.config.productId) {
          params.append('product_id', this.config.productId);
        }

        if (this.config.customAmount) {
          params.append('amount_usd', this.config.customAmount.toString());
        }

        const checkoutUrl = `${WIDGET_CONFIG.apiBase}${WIDGET_CONFIG.embedPath}?${params.toString()}`;

        // Create modal
        this.createModal(checkoutUrl, resolve, reject);
      });
    }

    createModal(checkoutUrl, resolve, reject) {
      // Remove existing modal
      this.closeModal();

      // Create modal elements
      const modal = utils.createElement('div', {
        className: 'sbtc-widget-modal',
        id: `sbtc-modal-${this.id}`
      });

      const modalContent = utils.createElement('div', {
        className: 'sbtc-widget-modal-content'
      });

      const iframe = utils.createElement('iframe', {
        src: checkoutUrl,
        style: 'width: 100%; height: 600px; border: none;'
      });

      modalContent.appendChild(iframe);
      modal.appendChild(modalContent);

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
          reject(new Error('Payment cancelled'));
        }
      });

      // Close on escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
          document.removeEventListener('keydown', escapeHandler);
          reject(new Error('Payment cancelled'));
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Listen for postMessage events
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) return;

        switch (event.data.type) {
          case 'sbtc_payment_success':
            this.closeModal();
            window.removeEventListener('message', messageHandler);
            document.removeEventListener('keydown', escapeHandler);
            
            // Trigger success callback
            this.triggerCallback('success', event.data);
            resolve(event.data);
            break;

          case 'sbtc_payment_error':
            this.closeModal();
            window.removeEventListener('message', messageHandler);
            document.removeEventListener('keydown', escapeHandler);
            
            // Trigger error callback
            this.triggerCallback('error', event.data);
            reject(new Error(event.data.error || 'Payment failed'));
            break;

          case 'sbtc_payment_cancel':
            this.closeModal();
            window.removeEventListener('message', messageHandler);
            document.removeEventListener('keydown', escapeHandler);
            
            // Trigger cancel callback
            this.triggerCallback('cancel');
            reject(new Error('Payment cancelled'));
            break;
        }
      };

      window.addEventListener('message', messageHandler);

      // Add to DOM
      document.body.appendChild(modal);
      this.modal = modal;

      // Focus management
      iframe.focus();
    }

    closeModal() {
      if (this.modal) {
        document.body.removeChild(this.modal);
        this.modal = null;
      }

      // Restore button state
      const button = document.querySelector(`[data-sbtc-widget-id="${this.id}"]`);
      if (button && button.tagName === 'BUTTON') {
        button.disabled = false;
        button.innerHTML = this.config.text;
      }
    }

    triggerCallback(type, data) {
      // Trigger custom events
      const event = new CustomEvent(`sbtc_payment_${type}`, {
        detail: data || {}
      });
      document.dispatchEvent(event);

      // Check for callback functions in window
      const callbackName = `onSBTCPayment${type.charAt(0).toUpperCase() + type.slice(1)}`;
      if (typeof window[callbackName] === 'function') {
        window[callbackName](data);
      }
    }
  }

  // Initialize widgets
  function initWidgets() {
    // Inject styles first
    utils.injectStyles();

    // Find and initialize script-based widgets
    const scripts = document.querySelectorAll('script[data-sbtc-key], script[src*="widget.js"][data-sbtc-key]');
    scripts.forEach(script => {
      const config = {
        apiKey: utils.getData(script, 'sbtc-key') || utils.getData(script, 'key'),
        productId: utils.getData(script, 'product-id'),
        theme: utils.getData(script, 'theme', WIDGET_CONFIG.defaultTheme),
        color: utils.getData(script, 'color', WIDGET_CONFIG.defaultColor),
        text: utils.getData(script, 'text', WIDGET_CONFIG.defaultText),
        size: utils.getData(script, 'size', WIDGET_CONFIG.defaultSize),
        showAmount: utils.getData(script, 'show-amount', 'true'),
        showDescription: utils.getData(script, 'show-description', 'true'),
        customAmount: utils.getData(script, 'custom-amount')
      };

      if (config.apiKey) {
        // Create container element after script
        const container = utils.createElement('div');
        script.parentNode.insertBefore(container, script.nextSibling);
        config.element = container;
        
        new SBTCWidget(config);
      }
    });

    // Find and initialize element-based widgets
    const elements = document.querySelectorAll('[data-sbtc-widget], [data-sbtc-button], [data-sbtc-link]');
    elements.forEach(element => {
      const config = {
        apiKey: utils.getData(element, 'sbtc-key') || utils.getData(element, 'key'),
        productId: utils.getData(element, 'product-id'),
        theme: utils.getData(element, 'theme', WIDGET_CONFIG.defaultTheme),
        color: utils.getData(element, 'color', WIDGET_CONFIG.defaultColor),
        text: utils.getData(element, 'text', WIDGET_CONFIG.defaultText),
        size: utils.getData(element, 'size', WIDGET_CONFIG.defaultSize),
        type: utils.getData(element, 'type', 'button'),
        showAmount: utils.getData(element, 'show-amount', 'true'),
        showDescription: utils.getData(element, 'show-description', 'true'),
        customAmount: utils.getData(element, 'custom-amount'),
        element: element
      };

      // Determine widget type from element attributes
      if (element.hasAttribute('data-sbtc-link')) {
        config.type = 'link';
      } else if (utils.getData(element, 'type') === 'inline') {
        config.type = 'inline';
      }

      if (config.apiKey) {
        new SBTCWidget(config);
      }
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }

  // Re-initialize when new content is added
  const observer = new MutationObserver(function(mutations) {
    let shouldReinit = false;
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          if (node.hasAttribute && (
            node.hasAttribute('data-sbtc-widget') ||
            node.hasAttribute('data-sbtc-button') ||
            node.hasAttribute('data-sbtc-link') ||
            (node.tagName === 'SCRIPT' && node.hasAttribute('data-sbtc-key'))
          )) {
            shouldReinit = true;
          }
        }
      });
    });
    
    if (shouldReinit) {
      setTimeout(initWidgets, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Expose for manual initialization
  window.SBTCWidget = SBTCWidget;
  window.initSBTCWidgets = initWidgets;

})();
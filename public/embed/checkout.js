(function() {
  'use strict';

  // sBTC Pay Embedded Checkout SDK
  window.SBTCPay = window.SBTCPay || {};

  // Default configuration
  const defaultConfig = {
    apiEndpoint: (function() {
      // Default to current origin, but handle file:// protocol
      if (window.location.protocol === 'file:') {
        return 'http://localhost:3000'; // Default for local development
      }
      return window.location.origin;
    })(),
    style: {
      width: '400px',
      height: '600px',
      borderRadius: '8px',
      primaryColor: '#3B82F6',
      theme: 'light'
    }
  };

  // Create checkout function
  window.SBTCPay.createCheckout = function(config) {
    if (!config.containerId) {
      console.error('SBTCPay: containerId is required');
      return;
    }

    if (!config.productId) {
      console.error('SBTCPay: productId is required');
      return;
    }

    if (!config.apiKey) {
      console.error('SBTCPay: apiKey is required');
      return;
    }

    const container = document.getElementById(config.containerId);
    if (!container) {
      console.error('SBTCPay: Container element not found');
      return;
    }

    // Merge configuration with defaults
    const finalConfig = {
      ...defaultConfig,
      ...config,
      style: {
        ...defaultConfig.style,
        ...config.style
      }
    };

    // Override apiEndpoint if explicitly provided
    if (config.apiEndpoint) {
      finalConfig.apiEndpoint = config.apiEndpoint;
    }

    // Create iframe for embedded checkout
    const iframe = document.createElement('iframe');
    iframe.src = `${finalConfig.apiEndpoint}/embed/checkout?product_id=${encodeURIComponent(finalConfig.productId)}&api_key=${encodeURIComponent(finalConfig.apiKey)}&theme=${encodeURIComponent(finalConfig.style.theme)}&primary_color=${encodeURIComponent(finalConfig.style.primaryColor)}`;
    iframe.style.width = finalConfig.style.width;
    iframe.style.height = finalConfig.style.height;
    iframe.style.borderRadius = finalConfig.style.borderRadius;
    iframe.style.border = '1px solid #e5e7eb';
    iframe.style.backgroundColor = finalConfig.style.theme === 'dark' ? '#1f2937' : '#ffffff';
    iframe.setAttribute('frameBorder', '0');
    iframe.style.border = 'none';
    iframe.allowTransparency = true;

    // Clear container and append iframe
    container.innerHTML = '';
    container.appendChild(iframe);

    // Listen for messages from iframe
    const messageHandler = function(event) {
      if (event.origin !== finalConfig.apiEndpoint) {
        return;
      }

      const data = event.data;
      if (!data || !data.type) {
        return;
      }

      switch (data.type) {
        case 'sbtc_payment_success':
          if (typeof finalConfig.onSuccess === 'function') {
            finalConfig.onSuccess(data.paymentIntent);
          }
          break;
        
        case 'sbtc_payment_error':
          if (typeof finalConfig.onError === 'function') {
            finalConfig.onError(data.error);
          }
          break;
        
        case 'sbtc_payment_cancel':
          if (typeof finalConfig.onCancel === 'function') {
            finalConfig.onCancel();
          }
          break;
        
        case 'sbtc_resize':
          if (data.height && data.height > 0) {
            iframe.style.height = data.height + 'px';
          }
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    // Return object with destroy method
    return {
      destroy: function() {
        window.removeEventListener('message', messageHandler);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }
    };
  };


  // Auto-initialize if data attributes are present
  document.addEventListener('DOMContentLoaded', function() {
    const autoElements = document.querySelectorAll('[data-sbtc-checkout]');
    
    autoElements.forEach(function(element) {
      const productId = element.getAttribute('data-product-id');
      const apiKey = element.getAttribute('data-api-key');
      
      if (productId && apiKey) {
        const config = {
          containerId: element.id,
          productId: productId,
          apiKey: apiKey,
          style: {
            width: element.getAttribute('data-width') || defaultConfig.style.width,
            height: element.getAttribute('data-height') || defaultConfig.style.height,
            borderRadius: element.getAttribute('data-border-radius') || defaultConfig.style.borderRadius,
            primaryColor: element.getAttribute('data-primary-color') || defaultConfig.style.primaryColor,
            theme: element.getAttribute('data-theme') || defaultConfig.style.theme
          }
        };

        // Add event callbacks if specified
        const onSuccess = element.getAttribute('data-on-success');
        if (onSuccess && typeof window[onSuccess] === 'function') {
          config.onSuccess = window[onSuccess];
        }

        const onError = element.getAttribute('data-on-error');
        if (onError && typeof window[onError] === 'function') {
          config.onError = window[onError];
        }

        const onCancel = element.getAttribute('data-on-cancel');
        if (onCancel && typeof window[onCancel] === 'function') {
          config.onCancel = window[onCancel];
        }

        window.SBTCPay.createCheckout(config);
      }
    });
  });

})();
'use client';

import { useState } from 'react';
import { Product } from '@/types/products';
import { getAuthHeaders } from '@/lib/auth/client';

interface PaymentLinkGeneratorProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

interface MetadataField {
  key: string;
  value: string;
}

export function PaymentLinkGenerator({ product, isOpen, onClose }: PaymentLinkGeneratorProps) {
  const [email, setEmail] = useState('');
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([
    { key: '', value: '' }
  ]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateLink = () => {
    const baseUrl = `${window.location.origin}/checkout/product/${product.id}`;
    const params = new URLSearchParams();
    
    if (email) {
      params.append('email', email);
    }
    
    // Add metadata fields to URL
    const validMetadata = metadataFields.filter(field => field.key && field.value);
    if (validMetadata.length > 0) {
      const metadataObj: Record<string, string> = {};
      validMetadata.forEach(field => {
        metadataObj[field.key] = field.value;
      });
      params.append('metadata', JSON.stringify(metadataObj));
    }
    
    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    setGeneratedLink(finalUrl);
  };

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }]);
  };

  const updateMetadataField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...metadataFields];
    updated[index][field] = value;
    setMetadataFields(updated);
  };

  const removeMetadataField = (index: number) => {
    setMetadataFields(metadataFields.filter((_, i) => i !== index));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQRCode = () => {
    // Using a QR code API service
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedLink)}`;
    return qrApiUrl;
  };

  const handleGenerateLink = async () => {
    // Generate the link URL first
    const baseUrl = `${window.location.origin}/checkout/product/${product.id}`;
    const params = new URLSearchParams();
    
    if (email) {
      params.append('email', email);
    }
    
    // Add metadata fields to URL
    const validMetadata = metadataFields.filter(field => field.key && field.value);
    const metadataObj: Record<string, string> = {};
    if (validMetadata.length > 0) {
      validMetadata.forEach(field => {
        metadataObj[field.key] = field.value;
      });
      params.append('metadata', JSON.stringify(metadataObj));
    }
    
    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    
    // Set the generated link
    setGeneratedLink(finalUrl);
    setIsGenerated(true);
    setShowQRCode(true);
    
    // Save the link to the backend with the correct URL
    await savePaymentLink(finalUrl, metadataObj);
  };

  const savePaymentLink = async (linkUrl: string, metadataObj: Record<string, string>) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/payment-links', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          email: email || undefined,
          metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
          generated_url: linkUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save payment link:', errorData);
        alert('Failed to save payment link: ' + (errorData.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving payment link:', error);
      alert('Error saving payment link: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setMetadataFields([{ key: '', value: '' }]);
    setCopied(false);
    setShowQRCode(false);
    setIsGenerated(false);
    setGeneratedLink('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Generate Payment Link</h2>
              <p className="text-sm text-gray-500 mt-1">Create a custom checkout link for "{product.name}"</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {product.price_usd 
                    ? `$${product.price_usd.toFixed(2)}`
                    : `${(product.price / 100_000_000).toFixed(8)} sBTC`
                  }
                </div>
                {product.price_usd && (
                  <div className="text-xs text-gray-500">
                    ≈ {(product.price / 100_000_000).toFixed(8)} sBTC
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email (Optional)
            </label>
            <input
              type="email"
              id="customer-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pre-fill the customer's email address in the checkout form
            </p>
          </div>

          {/* Custom Metadata Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Custom Metadata (Optional)
              </label>
              <button
                onClick={addMetadataField}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Field
              </button>
            </div>
            <div className="space-y-2">
              {metadataFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => updateMetadataField(index, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateMetadataField(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {metadataFields.length > 1 && (
                    <button
                      onClick={() => removeMetadataField(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add custom data that will be stored with the payment
            </p>
          </div>

          {/* Generate Button */}
          {!isGenerated && (
            <div className="flex justify-center">
              <button
                onClick={handleGenerateLink}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Payment Link
              </button>
            </div>
          )}

          {/* Generated Link Preview */}
          {isGenerated && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Payment Link
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <code className="text-sm text-blue-900 break-all flex-1">
                    {generatedLink}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          {isGenerated && showQRCode && (
            <div>
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 border border-gray-200 rounded-lg">
                  <img 
                    src={generateQRCode()} 
                    alt="Payment Link QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Scan this QR code to open the payment page
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Reset Form
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
              {isGenerated && (
                <>
                  <button
                    onClick={() => {
                      copyToClipboard();
                      handleClose();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Copy Link & Close'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
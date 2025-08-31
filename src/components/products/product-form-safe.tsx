'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function ProductFormSafe() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get API key safely
      let apiKey: string | null = null;
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          apiKey = localStorage.getItem('api_key');
        }
      } catch (e) {
        console.error('Failed to get API key:', e);
      }

      if (!apiKey) {
        throw new Error('Please login to continue');
      }

      const response = await fetch('/api/v1/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name,
          description,
          price_usd: parseFloat(priceUsd),
          type: 'one_time',
          images: images.filter(img => img.length > 0),
          active: true
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || `Request failed: ${response.status}`);
      }

      const product = await response.json();
      router.push(`/dashboard/products/${product.id}`);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (imageInput && imageInput.startsWith('http')) {
      setImages([...images, imageInput]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Product Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter product name"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter product description"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price (USD) *
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="price"
            required
            step="0.01"
            min="0.01"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            className="pl-7 pr-3 py-2 block w-full border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
            disabled={loading}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Price will be automatically converted to sBTC based on current exchange rate
        </p>
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-700">
          Product Images
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            id="images"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleAddImage}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {images.length > 0 && (
          <div className="mt-2 space-y-2">
            {images.map((image, index) => (
              <div key={`${index}-${image}`} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{image}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  disabled={loading}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
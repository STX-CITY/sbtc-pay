import { ProductForm } from '@/components/products/product-form';

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <ProductForm />
      </div>
    </div>
  );
}
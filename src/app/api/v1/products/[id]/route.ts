import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, products, paymentIntents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import { getExchangeRate, convertUsdToSbtc } from '@/lib/payments/utils';
import { createWebhookEvent } from '@/lib/webhooks/sender';

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  price_usd: z.number().positive().optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // No authentication required - products are public
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Product not found' } },
        { status: 404 }
      );
    }

    // Only return active products publicly
    if (!product.active) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
      price_usd: product.priceUsd ? parseFloat(product.priceUsd) : undefined,
      currency: product.currency,
      images: product.images,
      metadata: product.metadata,
      active: product.active,
      created: Math.floor(product.createdAt.getTime() / 1000),
      updated: Math.floor(product.updatedAt.getTime() / 1000)
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.price_usd !== undefined) {
      const exchangeRate = await getExchangeRate();
      updateData.price = convertUsdToSbtc(validatedData.price_usd, exchangeRate);
      updateData.priceUsd = validatedData.price_usd.toString();
    } else if (validatedData.price !== undefined) {
      updateData.price = validatedData.price * 100_000_000; // Convert sBTC to microsBTC
    }
    if (validatedData.images !== undefined) {
      updateData.images = validatedData.images;
    }
    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata;
    }
    if (validatedData.active !== undefined) {
      updateData.active = validatedData.active;
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(
        and(
          eq(products.id, id),
          eq(products.merchantId, auth.merchantId)
        )
      )
      .returning();

    if (!updatedProduct) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Product not found' } },
        { status: 404 }
      );
    }

    // Send webhook event for product update
    try {
      const productData = {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        type: updatedProduct.type,
        price: updatedProduct.price,
        price_usd: updatedProduct.priceUsd ? parseFloat(updatedProduct.priceUsd) : undefined,
        currency: updatedProduct.currency,
        images: updatedProduct.images,
        metadata: updatedProduct.metadata,
        active: updatedProduct.active,
        created: Math.floor(updatedProduct.createdAt.getTime() / 1000),
        updated: Math.floor(updatedProduct.updatedAt.getTime() / 1000)
      };
      
      await createWebhookEvent(auth.merchantId, 'product.updated', productData);
    } catch (webhookError) {
      console.error('Failed to send product.updated webhook:', webhookError);
    }

    return NextResponse.json({
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      type: updatedProduct.type,
      price: updatedProduct.price,
      price_usd: updatedProduct.priceUsd ? parseFloat(updatedProduct.priceUsd) : undefined,
      currency: updatedProduct.currency,
      images: updatedProduct.images,
      metadata: updatedProduct.metadata,
      active: updatedProduct.active,
      created: Math.floor(updatedProduct.createdAt.getTime() / 1000),
      updated: Math.floor(updatedProduct.updatedAt.getTime() / 1000)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    // Check if product exists and belongs to merchant
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.merchantId, auth.merchantId)
        )
      )
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Product not found' } },
        { status: 404 }
      );
    }

    // Check if product has any payment intents
    const [paymentIntent] = await db
      .select({ id: paymentIntents.id })
      .from(paymentIntents)
      .where(eq(paymentIntents.productId, id))
      .limit(1);

    if (paymentIntent) {
      return NextResponse.json(
        { 
          error: { 
            type: 'invalid_request_error', 
            message: 'Cannot delete product with existing payment intents. Please archive the product instead by setting it to inactive.' 
          } 
        },
        { status: 400 }
      );
    }

    // Now safe to delete
    const [deletedProduct] = await db
      .delete(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.merchantId, auth.merchantId)
        )
      )
      .returning();

    if (!deletedProduct) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Product not found' } },
        { status: 404 }
      );
    }

    // Send webhook event for product deletion
    try {
      const productData = {
        id: deletedProduct.id,
        name: deletedProduct.name,
        description: deletedProduct.description,
        type: deletedProduct.type,
        price: deletedProduct.price,
        price_usd: deletedProduct.priceUsd ? parseFloat(deletedProduct.priceUsd) : undefined,
        currency: deletedProduct.currency,
        images: deletedProduct.images,
        metadata: deletedProduct.metadata,
        active: deletedProduct.active,
        created: Math.floor(deletedProduct.createdAt.getTime() / 1000),
        updated: Math.floor(deletedProduct.updatedAt.getTime() / 1000),
        deleted: true
      };
      
      await createWebhookEvent(auth.merchantId, 'product.deleted', productData);
    } catch (webhookError) {
      console.error('Failed to send product.deleted webhook:', webhookError);
    }

    return NextResponse.json({
      id: deletedProduct.id,
      deleted: true,
      object: 'product'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
# Database Migrations

## How to Apply Migrations

### Add Public API Keys Migration

To add public API key support to your existing database, run:

```sql
-- Connect to your database and run:
psql $DATABASE_URL < migrations/add-public-api-keys.sql
```

Or manually execute the SQL in `add-public-api-keys.sql` in your database client.

This migration:
1. Adds `public_api_key_live` and `public_api_key_test` columns to the merchants table
2. Generates unique public keys for existing merchants

The application code is designed to work both with and without these columns, so the migration can be applied at any time.

## Migration Files

- `add-public-api-keys.sql` - Adds public API key columns for client-side authentication
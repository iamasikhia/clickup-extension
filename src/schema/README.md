# Smart Invoicing Database Schema

This directory contains the complete database schema for the Smart Invoicing web application, designed for use with Supabase/PostgreSQL.

## Files

- **`database-schema.sql`** - Complete database schema with tables, indexes, RLS policies, and functions
- **`sample-data.sql`** - Sample data for development and testing
- **`README.md`** - This documentation file

## Schema Overview

### Core Tables

#### Authentication & Users
- **`users`** - Extends Supabase auth.users with app-specific fields
- **`freelancer_profiles`** - Complete freelancer/business profile information
- **`user_settings`** - User preferences and app settings

#### Client & Project Management
- **`clients`** - Client contact information and details
- **`tasks`** - Projects/tasks with hourly rates and status tracking
- **`time_logs`** - Time tracking entries linked to tasks

#### Invoicing System
- **`invoices`** - Invoice headers with status, amounts, and approval workflow
- **`invoice_line_items`** - Individual line items within invoices
- **`invoice_time_logs`** - Many-to-many relationship between invoices and time logs

#### Supporting Features
- **`file_attachments`** - File storage references (PDFs, signatures, etc.)
- **`email_notifications`** - Email tracking and delivery status

### Key Features

#### Security
- **Row Level Security (RLS)** enabled on all tables
- User-specific access policies ensure data isolation
- Special public access policy for client invoice approval
- UUID-based primary keys for security

#### Invoice Workflow
- Complete status tracking: draft → sent → pending_approval → approved → paid
- Client approval system with unique tokens
- Digital signature capture
- Payment method and instruction tracking

#### Time Tracking
- Flexible time logging with descriptions
- Billable/non-billable time distinction
- Task-based time organization
- Invoice-time log relationships

#### Automation
- Auto-updating timestamps with triggers
- Automatic invoice number generation
- Default settings creation for new users

## Setup Instructions

### 1. Create the Schema

Run the main schema file in your Supabase SQL editor:

```sql
-- Copy and paste the contents of database-schema.sql
```

### 2. Insert Sample Data (Optional)

For development and testing, you can populate the database with sample data:

```sql
-- First, you'll need to replace 'sample-user-uuid' with an actual user UUID from auth.users
-- Then copy and paste the contents of sample-data.sql
```

### 3. Configure Supabase

#### Storage Buckets
Create the following storage buckets for file attachments:
- `invoices` - For generated PDF invoices
- `signatures` - For client digital signatures
- `attachments` - For general file attachments

#### Environment Variables
Set up the following environment variables in your application:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Service role key (for server-side operations)

## Data Relationships

```
users (auth.users)
├── freelancer_profiles (1:1)
├── user_settings (1:1)
├── clients (1:many)
├── tasks (1:many)
│   └── time_logs (1:many)
├── invoices (1:many)
│   ├── invoice_line_items (1:many)
│   ├── invoice_time_logs (many:many with time_logs)
│   └── file_attachments (1:many)
└── email_notifications (1:many)
```

## Key Functions

### `generate_invoice_number(user_uuid UUID)`
Automatically generates sequential invoice numbers based on user settings:
- Uses configurable prefix (default: "INV")
- Auto-increments number sequence
- Returns formatted invoice number (e.g., "INV-0001")

### `handle_updated_at()`
Trigger function that automatically updates the `updated_at` timestamp on record modifications.

### `handle_new_freelancer_profile()`
Automatically creates default user settings when a new freelancer profile is created.

## Security Policies

All tables implement Row Level Security with the following principles:

1. **User Isolation**: Users can only access their own data
2. **Cascading Access**: Related records (invoices, time logs, etc.) are accessible through user ownership
3. **Public Invoice Approval**: Special policy allows client access to invoices via approval tokens
4. **Secure Updates**: Approval updates are restricted to specific fields and conditions

## Best Practices

### When Adding New Tables
1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Add user ownership policy
3. Include UUID primary key with `uuid_generate_v4()`
4. Add created_at/updated_at timestamps
5. Create appropriate indexes for common queries

### When Modifying Schema
1. Always use migrations for production changes
2. Test RLS policies thoroughly
3. Update related indexes when adding columns
4. Consider impact on existing triggers and functions

## Migration Notes

When deploying schema changes:

1. Run schema changes during low-traffic periods
2. Test all RLS policies with different user scenarios
3. Verify trigger functions work correctly
4. Update application code to handle new fields/relationships
5. Run sample queries to ensure performance is acceptable

## Support

For questions about the schema design or implementation, refer to:
- Supabase documentation: https://supabase.io/docs
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Project-specific requirements in the main application README
-- Sample data for Smart Invoicing Web App
-- This file contains sample data to populate the database for development and testing

-- Sample users (these would typically be created via Supabase Auth)
-- Note: In production, users are created through Supabase Auth, but we're showing the expected structure

-- Sample freelancer profile
INSERT INTO public.freelancer_profiles (
    user_id,
    full_name,
    phone,
    business_name,
    business_type,
    website,
    address,
    city,
    state,
    zip_code,
    country,
    profession,
    default_hourly_rate,
    currency,
    time_zone,
    preferred_payment_terms
) VALUES (
    -- Replace with actual user UUID from auth.users
    'sample-user-uuid',
    'John Doe',
    '+1 (555) 123-4567',
    'John Doe Consulting',
    'freelancer',
    'https://johndoe.dev',
    '123 Business Street',
    'San Francisco',
    'CA',
    '94105',
    'United States',
    'Full Stack Developer',
    75.00,
    'USD',
    'America/Los_Angeles',
    'Net 30'
);

-- Sample clients
INSERT INTO public.clients (
    user_id,
    name,
    email,
    phone,
    company,
    address,
    city,
    state,
    zip_code,
    country,
    notes
) VALUES 
(
    'sample-user-uuid',
    'Acme Corporation',
    'billing@acme.com',
    '+1 (555) 987-6543',
    'Acme Corp',
    '456 Corporate Blvd',
    'New York',
    'NY',
    '10001',
    'United States',
    'Large enterprise client. Prefers monthly invoicing.'
),
(
    'sample-user-uuid',
    'TechStart Inc',
    'finance@techstart.com',
    '+1 (555) 456-7890',
    'TechStart Inc',
    '789 Innovation Way',
    'Austin',
    'TX',
    '78701',
    'United States',
    'Fast-growing startup. Quick payment turnaround.'
);

-- Sample tasks/projects
INSERT INTO public.tasks (
    user_id,
    client_id,
    name,
    description,
    hourly_rate,
    status,
    start_date,
    estimated_hours
) VALUES 
(
    'sample-user-uuid',
    (SELECT id FROM public.clients WHERE name = 'Acme Corporation' LIMIT 1),
    'Website Development',
    'Building a modern React website with full responsive design and CMS integration',
    75.00,
    'active',
    '2024-01-15',
    120.0
),
(
    'sample-user-uuid',
    (SELECT id FROM public.clients WHERE name = 'Acme Corporation' LIMIT 1),
    'UI/UX Design',
    'Creating user interface designs and user experience wireframes',
    65.00,
    'active',
    '2024-01-10',
    40.0
),
(
    'sample-user-uuid',
    (SELECT id FROM public.clients WHERE name = 'TechStart Inc' LIMIT 1),
    'API Development',
    'Building RESTful APIs for mobile application backend',
    85.00,
    'active',
    '2024-02-01',
    60.0
),
(
    'sample-user-uuid',
    (SELECT id FROM public.clients WHERE name = 'TechStart Inc' LIMIT 1),
    'Database Design',
    'Designing and implementing PostgreSQL database schema',
    80.00,
    'completed',
    '2024-01-20',
    25.0
);

-- Sample time logs
INSERT INTO public.time_logs (
    user_id,
    task_id,
    date,
    hours,
    description,
    is_billable
) VALUES 
-- Website Development time logs
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'Website Development' LIMIT 1),
    '2024-01-20',
    4.5,
    'Frontend development - implemented responsive navigation and hero section',
    TRUE
),
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'Website Development' LIMIT 1),
    '2024-01-19',
    6.0,
    'API integration and data fetching implementation',
    TRUE
),
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'Website Development' LIMIT 1),
    '2024-01-18',
    5.5,
    'Component architecture setup and initial styling',
    TRUE
),

-- UI/UX Design time logs
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'UI/UX Design' LIMIT 1),
    '2024-01-20',
    3.0,
    'Created high-fidelity mockups for dashboard interface',
    TRUE
),
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'UI/UX Design' LIMIT 1),
    '2024-01-17',
    4.0,
    'User research and persona development',
    TRUE
),

-- API Development time logs
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'API Development' LIMIT 1),
    '2024-02-05',
    6.0,
    'Authentication endpoints and middleware implementation',
    TRUE
),
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'API Development' LIMIT 1),
    '2024-02-04',
    5.0,
    'Database models and relationships setup',
    TRUE
),

-- Database Design time logs
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'Database Design' LIMIT 1),
    '2024-01-25',
    8.0,
    'Complete schema design and optimization',
    TRUE
),
(
    'sample-user-uuid',
    (SELECT id FROM public.tasks WHERE name = 'Database Design' LIMIT 1),
    '2024-01-24',
    4.0,
    'Requirements analysis and initial schema draft',
    TRUE
);

-- Sample invoice (approved)
INSERT INTO public.invoices (
    user_id,
    client_id,
    invoice_number,
    title,
    description,
    notes,
    subtotal,
    tax_rate,
    tax_amount,
    total_amount,
    currency,
    status,
    issue_date,
    due_date,
    sent_at,
    approved_at,
    approval_token,
    client_signature,
    payment_method,
    payment_instructions
) VALUES (
    'sample-user-uuid',
    (SELECT id FROM public.clients WHERE name = 'Acme Corporation' LIMIT 1),
    'INV-0001',
    'Web Development Services - January 2024',
    'Professional web development services for the new company website including frontend development and UI/UX design work.',
    E'Payment is due within 30 days of invoice date.\nLate payments may incur additional fees.\nThank you for your business!',
    787.50,
    0.0875, -- 8.75% tax rate
    68.91,
    856.41,
    'USD',
    'approved',
    '2024-01-21',
    '2024-02-20',
    '2024-01-21 10:30:00+00',
    '2024-01-22 14:15:00+00',
    'appr_' || generate_random_uuid()::text,
    'John Smith - Acme Corporation',
    'bank_transfer',
    'Wire transfer to Business Account #12345-67890'
);

-- Sample invoice line items for the approved invoice
INSERT INTO public.invoice_line_items (
    invoice_id,
    task_id,
    description,
    quantity,
    unit_price,
    total_amount
) VALUES 
(
    (SELECT id FROM public.invoices WHERE invoice_number = 'INV-0001' LIMIT 1),
    (SELECT id FROM public.tasks WHERE name = 'Website Development' LIMIT 1),
    'Website Development - Frontend implementation and API integration',
    10.5, -- hours
    75.00, -- hourly rate
    787.50
),
(
    (SELECT id FROM public.invoices WHERE invoice_number = 'INV-0001' LIMIT 1),
    (SELECT id FROM public.tasks WHERE name = 'UI/UX Design' LIMIT 1),
    'UI/UX Design - Mockups and user research',
    7.0, -- hours
    65.00, -- hourly rate
    455.00
);

-- Link time logs to the invoice
INSERT INTO public.invoice_time_logs (
    invoice_id,
    time_log_id
) 
SELECT 
    (SELECT id FROM public.invoices WHERE invoice_number = 'INV-0001' LIMIT 1),
    tl.id
FROM public.time_logs tl
JOIN public.tasks t ON tl.task_id = t.id
WHERE t.name IN ('Website Development', 'UI/UX Design')
AND tl.date <= '2024-01-21';

-- Sample draft invoice
INSERT INTO public.invoices (
    user_id,
    client_id,
    invoice_number,
    title,
    description,
    subtotal,
    total_amount,
    currency,
    status,
    issue_date,
    due_date
) VALUES (
    'sample-user-uuid',
    (SELECT id FROM public.clients WHERE name = 'TechStart Inc' LIMIT 1),
    'INV-0002',
    'API Development Services - February 2024',
    'Backend API development and database design services for mobile application.',
    935.00,
    935.00,
    'USD',
    'draft',
    '2024-02-10',
    '2024-03-12'
);

-- Sample invoice line items for the draft invoice
INSERT INTO public.invoice_line_items (
    invoice_id,
    task_id,
    description,
    quantity,
    unit_price,
    total_amount
) VALUES 
(
    (SELECT id FROM public.invoices WHERE invoice_number = 'INV-0002' LIMIT 1),
    (SELECT id FROM public.tasks WHERE name = 'API Development' LIMIT 1),
    'API Development - Authentication and core endpoints',
    11.0, -- hours
    85.00, -- hourly rate
    935.00
),
(
    (SELECT id FROM public.invoices WHERE invoice_number = 'INV-0002' LIMIT 1),
    (SELECT id FROM public.tasks WHERE name = 'Database Design' LIMIT 1),
    'Database Design - Schema design and optimization',
    12.0, -- hours
    80.00, -- hourly rate
    960.00
);

-- Sample user settings
INSERT INTO public.user_settings (
    user_id,
    auto_generate_invoice_numbers,
    invoice_number_prefix,
    next_invoice_number,
    default_payment_terms,
    auto_send_invoices,
    send_payment_reminders,
    reminder_days_before_due,
    theme,
    date_format,
    time_format
) VALUES (
    'sample-user-uuid',
    TRUE,
    'INV',
    3, -- Next invoice will be INV-0003
    'Net 30',
    FALSE,
    TRUE,
    3,
    'light',
    'MM/DD/YYYY',
    '12h'
);

-- Sample email notifications
INSERT INTO public.email_notifications (
    user_id,
    invoice_id,
    to_email,
    subject,
    email_type,
    status,
    sent_at,
    delivered_at
) VALUES 
(
    'sample-user-uuid',
    (SELECT id FROM public.invoices WHERE invoice_number = 'INV-0001' LIMIT 1),
    'billing@acme.com',
    'Invoice INV-0001 - Web Development Services',
    'invoice_sent',
    'delivered',
    '2024-01-21 10:30:00+00',
    '2024-01-21 10:32:15+00'
),
(
    'sample-user-uuid',
    (SELECT id FROM public.invoices WHERE invoice_number = 'INV-0001' LIMIT 1),
    'billing@acme.com',
    'Invoice INV-0001 - Approval Required',
    'approval_request',
    'delivered',
    '2024-01-21 10:35:00+00',
    '2024-01-21 10:37:22+00'
);
-- Smart Invoicing Web App Database Schema
-- Designed for Supabase/PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    auth_method TEXT NOT NULL CHECK (auth_method IN ('email', 'google')),
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Freelancer profiles table
CREATE TABLE public.freelancer_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Personal Info
    full_name TEXT NOT NULL,
    phone TEXT,
    
    -- Business Info
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL CHECK (business_type IN ('freelancer', 'agency', 'consultant', 'other')),
    website TEXT,
    
    -- Address Info
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT NOT NULL,
    
    -- Professional Info
    profession TEXT NOT NULL,
    default_hourly_rate DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Preferences
    time_zone TEXT NOT NULL,
    preferred_payment_terms TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects/Tasks table
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    start_date DATE,
    end_date DATE,
    estimated_hours DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time logs table
CREATE TABLE public.time_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(8,2) NOT NULL CHECK (hours > 0),
    description TEXT,
    is_billable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    
    -- Invoice details
    title TEXT,
    description TEXT,
    notes TEXT,
    
    -- Financial info
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Status and workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'pending_approval', 'approved', 'paid', 'rejected', 'cancelled')),
    
    -- Dates
    issue_date DATE NOT NULL,
    due_date DATE,
    sent_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Client approval
    approval_token TEXT UNIQUE,
    client_signature TEXT,
    client_comments TEXT,
    client_ip_address INET,
    
    -- Payment info
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'check', 'cash', 'other')),
    payment_instructions TEXT,
    payment_reference TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items (for tasks/time included in invoice)
CREATE TABLE public.invoice_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    
    -- Line item details
    description TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice time logs (many-to-many relationship between invoices and time logs)
CREATE TABLE public.invoice_time_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    time_log_id UUID REFERENCES public.time_logs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(invoice_id, time_log_id)
);

-- File attachments (for PDFs, signatures, etc.)
CREATE TABLE public.file_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- File info
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    file_type TEXT CHECK (file_type IN ('pdf', 'signature', 'attachment', 'receipt')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email notifications log
CREATE TABLE public.email_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- Email details
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('invoice_sent', 'approval_request', 'payment_reminder', 'payment_received')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings
CREATE TABLE public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Invoice settings
    auto_generate_invoice_numbers BOOLEAN DEFAULT TRUE,
    invoice_number_prefix TEXT DEFAULT 'INV',
    next_invoice_number INTEGER DEFAULT 1,
    default_payment_terms TEXT DEFAULT 'Net 30',
    
    -- Email settings
    auto_send_invoices BOOLEAN DEFAULT FALSE,
    send_payment_reminders BOOLEAN DEFAULT TRUE,
    reminder_days_before_due INTEGER DEFAULT 3,
    
    -- Theme and preferences
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_freelancer_profiles_user_id ON public.freelancer_profiles(user_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX idx_time_logs_task_id ON public.time_logs(task_id);
CREATE INDEX idx_time_logs_date ON public.time_logs(date);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_time_logs_invoice_id ON public.invoice_time_logs(invoice_id);
CREATE INDEX idx_file_attachments_invoice_id ON public.file_attachments(invoice_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.freelancer_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.time_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.freelancer_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own time logs" ON public.time_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own invoice line items" ON public.invoice_line_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid())
);

CREATE POLICY "Users can manage own invoice time logs" ON public.invoice_time_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_time_logs.invoice_id AND invoices.user_id = auth.uid())
);

CREATE POLICY "Users can manage own files" ON public.file_attachments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON public.email_notifications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Special policy for client invoice approval (public access with approval_token)
CREATE POLICY "Public invoice approval access" ON public.invoices FOR SELECT USING (
    approval_token IS NOT NULL AND approval_token != ''
);

CREATE POLICY "Public invoice approval update" ON public.invoices FOR UPDATE USING (
    approval_token IS NOT NULL AND approval_token != ''
) WITH CHECK (
    -- Only allow updating approval-related fields
    status IN ('approved', 'rejected') AND
    client_signature IS NOT NULL
);

-- Insert default user settings when a new freelancer profile is created
CREATE OR REPLACE FUNCTION public.handle_new_freelancer_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_freelancer_profile_created
    AFTER INSERT ON public.freelancer_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_freelancer_profile();

-- Function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    settings_row public.user_settings%ROWTYPE;
    new_number INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get user settings
    SELECT * INTO settings_row FROM public.user_settings WHERE user_id = user_uuid;
    
    -- If no settings found, create default
    IF NOT FOUND THEN
        INSERT INTO public.user_settings (user_id) VALUES (user_uuid);
        SELECT * INTO settings_row FROM public.user_settings WHERE user_id = user_uuid;
    END IF;
    
    -- Generate new invoice number
    new_number := settings_row.next_invoice_number;
    invoice_number := settings_row.invoice_number_prefix || '-' || LPAD(new_number::TEXT, 4, '0');
    
    -- Update next invoice number
    UPDATE public.user_settings 
    SET next_invoice_number = next_invoice_number + 1 
    WHERE user_id = user_uuid;
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;
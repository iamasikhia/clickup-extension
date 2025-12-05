export interface Task {
    id: string;
    name: string;
    rate: number;
    status: 'active' | 'completed';
    description?: string;
    createdAt: string;
}

export interface TimeLog {
    id: string;
    taskId: string;
    hours: number;
    date: string;
    description?: string;
}

export interface Invoice {
    id: string;
    taskIds: string[];
    totalHours: number;
    totalAmount: number;
    status: 'draft' | 'sent' | 'pending_approval' | 'approved' | 'paid' | 'rejected';
    createdAt: string;
    clientName?: string;
    clientEmail?: string;
    description?: string;
    notes?: string;
    approvalLink?: string;
    approvedAt?: string;
    clientSignature?: string;
    clientComments?: string;
    paymentMethod?: 'bank_transfer' | 'paypal' | 'stripe' | 'check';
    paymentInstructions?: string;
}

export interface FreelancerProfile {
    // Personal Info
    fullName: string;
    email: string;
    logoUrl?: string;
    phone?: string;

    // Business Info
    businessName: string;
    businessType: 'freelancer' | 'agency' | 'consultant' | 'other';
    website?: string;

    // Address Info
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;

    // Professional Info
    profession: string;
    defaultHourlyRate: number;
    currency: string;

    // Preferences
    timeZone: string;
    preferredPaymentTerms: string;
}

export interface User {
    email: string;
    name: string;
    authMethod: 'email' | 'google';
}

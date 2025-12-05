import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Download, Mail, FileText, Eye, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { toast } from 'sonner';

interface Task {
  id: string;
  name: string;
  rate: number;
  status: 'active' | 'completed';
}

interface Invoice {
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

interface FreelancerProfile {
  fullName: string;
  email: string;
  phone?: string;
  businessName: string;
  businessType: 'freelancer' | 'agency' | 'consultant' | 'other';
  website?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  profession: string;
  defaultHourlyRate: number;
  currency: string;
  timeZone: string;
  preferredPaymentTerms: string;
}

interface ExportShareProps {
  tasks: Task[];
  invoices: Invoice[];
  onUpdateInvoice: (id: string, updates: Partial<Invoice>) => void;
  userProfile?: FreelancerProfile | null;
}

export function ExportShare({ tasks, invoices, onUpdateInvoice, userProfile }: ExportShareProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [stripeLink, setStripeLink] = useState('');

  const handleStripeLinkChange = (link: string) => {
    setStripeLink(link);

    // Regex to find "Pay via Stripe: ..." line or append if not found
    const paymentLineRegex = /(Pay via Stripe: )(.*)(\n|$)/;

    setEmailData(prev => {
      let newMessage = prev.message;
      if (paymentLineRegex.test(newMessage)) {
        newMessage = newMessage.replace(paymentLineRegex, `$1${link}$3`);
      } else {
        // Find best place to insert (before "Thank you for your business")
        const insertPosition = newMessage.indexOf('Thank you for your business!');
        if (insertPosition !== -1) {
          newMessage = newMessage.slice(0, insertPosition) + `Pay via Stripe: ${link}\n\n` + newMessage.slice(insertPosition);
        } else {
          newMessage += `\n\nPay via Stripe: ${link}`;
        }
      }
      return { ...prev, message: newMessage };
    });
  };

  const invoice = invoices.find(inv => inv.id === selectedInvoice);

  const generatePDF = (invoice: Invoice) => {
    // Mock PDF generation
    const content = generateInvoiceHTML(invoice);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateInvoiceHTML = (invoice: Invoice) => {
    const taskDetails = invoice.taskIds.map(taskId => {
      const task = tasks.find(t => t.id === taskId);
      return {
        name: task?.name || 'Unknown Task',
        rate: task?.rate || 0,
        // This would normally come from time logs
        hours: (invoice.totalHours / invoice.taskIds.length), // Simple distribution
        amount: ((invoice.totalHours / invoice.taskIds.length) * (task?.rate || 0))
      };
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice #${invoice.id.slice(0, 8)}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f5f5f5; }
        .total { text-align: right; font-size: 1.2em; font-weight: bold; }
        .notes { margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #333; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
        <p>Invoice #INV-${invoice.id.slice(0, 8)}</p>
        <p>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
    </div>

    <div class="invoice-info">
        <div>
            <h3>From:</h3>
            <p><strong>${userProfile?.businessName || 'Your Business Name'}</strong></p>
            <p>${userProfile?.fullName || 'Your Name'}</p>
            <p>${userProfile?.address || 'Your Address'}</p>
            <p>${userProfile ? `${userProfile.city}, ${userProfile.state} ${userProfile.zipCode}` : 'City, State ZIP'}</p>
            <p>${userProfile?.email || 'your-email@example.com'}</p>
            <p>${userProfile?.phone || 'Your Phone'}</p>
        </div>
        <div>
            <h3>To:</h3>
            <p><strong>${invoice.clientName || 'Client Name'}</strong></p>
            <p>${invoice.clientEmail || 'Client Email'}</p>
        </div>
    </div>

    ${invoice.description ? `
    <div style="margin-bottom: 30px;">
        <h3>Description of Services:</h3>
        <p>${invoice.description}</p>
    </div>
    ` : ''}

    <table class="table">
        <thead>
            <tr>
                <th>Task</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${taskDetails.map(task => `
            <tr>
                <td>${task.name}</td>
                <td>${task.hours.toFixed(1)}</td>
                <td>$${task.rate.toFixed(2)}</td>
                <td>$${task.amount.toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="total">
        <p>Total Hours: ${invoice.totalHours.toFixed(1)}</p>
        <p>Total Amount Due: $${invoice.totalAmount.toFixed(2)}</p>
    </div>

    ${invoice.notes ? `
    <div class="notes">
        <h3>Terms & Notes:</h3>
        <p style="white-space: pre-line;">${invoice.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 50px; text-align: center; color: #666; font-size: 0.9em;">
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
    `.trim();
  };

  const handleSendEmail = async () => {
    if (!invoice) return;

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Check if keys are placeholders or missing
    if (!serviceId || !templateId || !publicKey || serviceId === 'your_service_id') {
      toast.error('Email configuration missing. Please check .env file.');

      // Fallback to mailto if keys are missing
      const subject = encodeURIComponent(emailData.subject);
      const body = encodeURIComponent(emailData.message);
      window.location.href = `mailto:${emailData.to}?subject=${subject}&body=${body}`;
      return;
    }

    try {
      setIsSending(true);
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          from_name: userProfile?.businessName || userProfile?.fullName || 'Smart Invoice',
          invoice_id: invoice.id,
          amount: invoice.totalAmount.toFixed(2)
        },
        publicKey
      );

      toast.success(`Email sent successfully to ${emailData.to}`);

      // Update invoice status
      onUpdateInvoice(invoice.id, { status: 'sent' });

      setIsEmailDialogOpen(false);
      setEmailData({ to: '', subject: '', message: '' });
    } catch (error) {
      console.error('Email sending failed:', error);
      toast.error('Failed to send email. Please check your configuration.');
    } finally {
      setIsSending(false);
    }
  };

  const setupEmailData = (invoice: Invoice) => {
    const hasStripeMethod = invoice.paymentMethod === 'stripe';
    const initialStripeLink = ''; // Could pull from profile if available in future
    setStripeLink(initialStripeLink);

    setEmailData({
      to: invoice.clientEmail || '',
      subject: `Invoice #INV-${invoice.id.slice(0, 8)} - ${invoice.totalAmount.toFixed(2)}`,
      message: `Dear ${invoice.clientName || 'Client'},

Please find attached your invoice for the services provided.

Invoice Details:
- Invoice Number: INV-${invoice.id.slice(0, 8)}
- Amount Due: $${invoice.totalAmount.toFixed(2)}
- Hours: ${invoice.totalHours.toFixed(1)}

Payment is due within 30 days of the invoice date.

Thank you for your business!

Best regards,
${userProfile?.businessName || 'Your Business Name'}`
    });
    setIsEmailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Export & Share</h1>
        <p className="text-muted-foreground">
          Download invoices as PDF or send them directly via email
        </p>
      </div>

      {/* Invoice Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Invoice to Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invoice-select">Choose Invoice</Label>
            <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select an invoice to export or share" />
              </SelectTrigger>
              <SelectContent>
                {invoices.map(invoice => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    Invoice #{invoice.id.slice(0, 8)} - ${invoice.totalAmount.toFixed(2)}
                    ({invoice.clientName || 'No client'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {invoice && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Invoice ID:</strong> #{invoice.id.slice(0, 8)}</p>
                  <p><strong>Client:</strong> {invoice.clientName || 'No client name'}</p>
                  <p><strong>Email:</strong> {invoice.clientEmail || 'No email'}</p>
                </div>
                <div>
                  <p><strong>Amount:</strong> ${invoice.totalAmount.toFixed(2)}</p>
                  <p><strong>Hours:</strong> {invoice.totalHours.toFixed(1)}</p>
                  <p><strong>Status:</strong>
                    <Badge
                      variant={
                        invoice.status === 'paid' ? 'default' :
                          invoice.status === 'approved' ? 'default' :
                            invoice.status === 'pending_approval' ? 'secondary' :
                              invoice.status === 'rejected' ? 'destructive' :
                                invoice.status === 'sent' ? 'secondary' : 'outline'
                      }
                      className="ml-2"
                    >
                      {invoice.status.replace('_', ' ')}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Actions */}
      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Export & Share Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => generatePDF(invoice)}
              >
                <Download className="h-6 w-6" />
                Download PDF
                <span className="text-xs text-muted-foreground">
                  Save invoice as HTML file
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setupEmailData(invoice)}
                disabled={!invoice.clientEmail}
              >
                <Mail className="h-6 w-6" />
                Send Email
                <span className="text-xs text-muted-foreground">
                  {invoice.clientEmail ? 'Email to client' : 'No client email'}
                </span>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Eye className="h-6 w-6" />
                    Preview
                    <span className="text-xs text-muted-foreground">
                      View before sending
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Invoice Preview</DialogTitle>
                  </DialogHeader>
                  <div
                    className="bg-white text-black p-6 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(invoice) }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Invoice via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Invoice #INV-123456"
              />
            </div>

            {/* Stripe Link Input */}
            <div>
              <Label htmlFor="stripe-link" className="flex items-center gap-2 text-primary">
                Add Stripe Payment Link
                <Badge variant="outline" className="text-xs font-normal">Optional</Badge>
              </Label>
              <Input
                id="stripe-link"
                value={stripeLink}
                onChange={(e) => handleStripeLinkChange(e.target.value)}
                placeholder="https://buy.stripe.com/..."
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste your Stripe payment link here to automatically add it to the email body.
              </p>
            </div>

            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Email message to client..."
                rows={8}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSendEmail}
                disabled={!emailData.to || !emailData.subject || isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEmailDialogOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* No Invoices Message */}
      {invoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices to export</h3>
            <p className="text-muted-foreground">
              Create some invoices first to export and share them.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Exports Log */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices
              .filter(inv => inv.status === 'sent' || inv.status === 'paid' || inv.status === 'approved' || inv.status === 'pending_approval' || inv.status === 'rejected')
              .slice(0, 5)
              .map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium">Invoice #{invoice.id.slice(0, 8)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {invoice.clientName || 'No client'} • ${invoice.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                    >
                      {invoice.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            {invoices.filter(inv => inv.status === 'sent' || inv.status === 'paid' || inv.status === 'approved' || inv.status === 'pending_approval' || inv.status === 'rejected').length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No exports yet. Send or mark invoices as paid to see them here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
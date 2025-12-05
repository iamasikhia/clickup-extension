import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Eye,
  Settings,
  CreditCard,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ClientApproval } from './ClientApproval';

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

interface InvoiceApprovalProps {
  invoices: Invoice[];
  tasks: Task[];
  userProfile: FreelancerProfile;
  onUpdateInvoice: (id: string, updates: Partial<Invoice>) => void;
}

export function InvoiceApproval({ invoices, tasks, userProfile, onUpdateInvoice }: InvoiceApprovalProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [paymentSetup, setPaymentSetup] = useState({
    method: 'bank_transfer' as 'bank_transfer' | 'paypal' | 'stripe' | 'check',
    instructions: ''
  });

  const invoice = invoices.find(inv => inv.id === selectedInvoice);
  const previewInvoice = invoices.find(inv => inv.id === previewInvoiceId);

  // Filter invoices that can be sent for approval (draft or sent status)
  const approvableInvoices = invoices.filter(inv =>
    inv.status === 'draft' || inv.status === 'sent'
  );

  const generateApprovalLink = (invoiceId: string) => {
    return `${window.location.origin}/approve/${invoiceId}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendForApproval = () => {
    if (!invoice) return;

    const approvalLink = generateApprovalLink(invoice.id);

    onUpdateInvoice(invoice.id, {
      status: 'pending_approval',
      approvalLink: approvalLink
    });

    // Mock email sending
    alert(`Approval request sent to ${invoice.clientEmail}!\n\nApproval Link: ${approvalLink}\n\nIn a real app, this would send an email with the approval link.`);

    setIsApprovalDialogOpen(false);
  };

  const setupPayment = () => {
    if (!invoice) return;

    onUpdateInvoice(invoice.id, {
      paymentMethod: paymentSetup.method,
      paymentInstructions: paymentSetup.instructions
    });

    alert('Payment method configured successfully! Client will receive payment instructions upon approval.');
    setIsPaymentDialogOpen(false);
    setPaymentSetup({ method: 'bank_transfer', instructions: '' });
  };

  const copyApprovalLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Approval link copied to clipboard!');
  };

  const mockClientApproval = (invoiceId: string, signature: string, comments?: string) => {
    onUpdateInvoice(invoiceId, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      clientSignature: signature,
      clientComments: comments
    });
    setPreviewInvoiceId(null);
    alert('Invoice approved successfully! (This is a demo simulation)');
  };

  const mockClientRejection = (invoiceId: string, reason: string) => {
    onUpdateInvoice(invoiceId, {
      status: 'rejected',
      clientComments: reason
    });
    setPreviewInvoiceId(null);
    alert('Invoice rejected. (This is a demo simulation)');
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'outline';
      case 'sent': return 'secondary';
      case 'pending_approval': return 'default';
      case 'approved': return 'default';
      case 'paid': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'pending_approval': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Invoice Approval Management</h1>
          <p className="text-muted-foreground">
            Send invoices for client approval and manage payment setup
          </p>
        </div>
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={approvableInvoices.length === 0}>
              <Send className="mr-2 h-4 w-4" />
              Send for Approval
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invoice for Client Approval</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Invoice</Label>
                <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an invoice to send for approval" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvableInvoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>
                        Invoice #{inv.id.slice(0, 8)} - ${inv.totalAmount.toFixed(2)} ({inv.clientName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {invoice && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Invoice Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Client:</strong> {invoice.clientName} ({invoice.clientEmail})</p>
                    <p><strong>Amount:</strong> ${invoice.totalAmount.toFixed(2)}</p>
                    <p><strong>Hours:</strong> {invoice.totalHours.toFixed(1)}</p>
                    <p><strong>Current Status:</strong>
                      <Badge variant={getStatusColor(invoice.status)} className="ml-2">
                        {invoice.status.replace('_', ' ')}
                      </Badge>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={sendForApproval}
                  disabled={!selectedInvoice || !invoice?.clientEmail}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Approval Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsApprovalDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.status === 'pending_approval').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting client response
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invoices.filter(inv => inv.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter(inv => inv.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need revision
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No invoices found. Create some invoices first.
              </p>
            ) : (
              invoices
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">Invoice #{invoice.id.slice(0, 8)}</h4>
                        <Badge variant={getStatusColor(invoice.status)} className="flex items-center gap-1">
                          {getStatusIcon(invoice.status)}
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <p><strong>Client:</strong> {invoice.clientName || 'No client'}</p>
                        <p><strong>Amount:</strong> ${invoice.totalAmount.toFixed(2)}</p>
                        <p><strong>Hours:</strong> {invoice.totalHours.toFixed(1)}</p>
                        <p><strong>Created:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                      </div>

                      {/* Approval Details */}
                      {invoice.status === 'approved' && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <p className="text-green-800">
                            <strong>Approved by:</strong> {invoice.clientSignature} on{' '}
                            {invoice.approvedAt ? new Date(invoice.approvedAt).toLocaleDateString() : 'N/A'}
                          </p>
                          {invoice.clientComments && (
                            <p className="text-green-700 italic">"{invoice.clientComments}"</p>
                          )}
                        </div>
                      )}

                      {invoice.status === 'rejected' && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                          <p className="text-red-800"><strong>Rejection Reason:</strong></p>
                          <p className="text-red-700 italic">"{invoice.clientComments}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {invoice.approvalLink && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyApprovalLink(invoice.approvalLink!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}

                      {invoice.status === 'pending_approval' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewInvoiceId(invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      )}

                      {invoice.status === 'approved' && !invoice.paymentMethod && (
                        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedInvoice(invoice.id)}
                            >
                              <CreditCard className="h-4 w-4" />
                              Setup Payment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Setup Payment Method</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Payment Method</Label>
                                <Select
                                  value={paymentSetup.method}
                                  onValueChange={(value: any) => setPaymentSetup({ ...paymentSetup, method: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="paypal">PayPal</SelectItem>
                                    <SelectItem value="stripe">Credit Card (Stripe)</SelectItem>
                                    <SelectItem value="check">Check/Cheque</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Payment Instructions</Label>
                                <Textarea
                                  value={paymentSetup.instructions}
                                  onChange={(e) => setPaymentSetup({ ...paymentSetup, instructions: e.target.value })}
                                  placeholder="Provide payment details like account numbers, PayPal email, etc."
                                  rows={4}
                                />
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button onClick={setupPayment}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Setup Payment
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsPaymentDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {invoice.paymentMethod && (
                        <div className="text-sm text-green-600">
                          <Settings className="h-4 w-4 inline mr-1" />
                          Payment Ready
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Preview Dialog */}
      {previewInvoice && (
        <Dialog open={previewInvoiceId !== null} onOpenChange={() => setPreviewInvoiceId(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Approval Preview</DialogTitle>
              <p className="text-muted-foreground">
                This is how the client will see the approval page (Demo Mode)
              </p>
            </DialogHeader>
            <ClientApproval
              invoice={previewInvoice}
              tasks={tasks}
              freelancerProfile={userProfile}
              onApprove={(signature, comments) => mockClientApproval(previewInvoice.id, signature, comments)}
              onReject={(reason) => mockClientRejection(previewInvoice.id, reason)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
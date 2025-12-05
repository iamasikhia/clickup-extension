import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { CheckCircle, XCircle, FileText, Clock, DollarSign, Calendar, User, Building2 } from 'lucide-react';

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

interface ClientApprovalProps {
  invoice: Invoice;
  tasks: Task[];
  freelancerProfile: FreelancerProfile;
  onApprove: (signature: string, comments?: string) => void;
  onReject: (reason: string) => void;
}

export function ClientApproval({ invoice, tasks, freelancerProfile, onApprove, onReject }: ClientApprovalProps) {
  const [approvalForm, setApprovalForm] = useState({
    signature: '',
    comments: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const taskDetails = invoice.taskIds.map(taskId => {
    const task = tasks.find(t => t.id === taskId);
    const hours = invoice.totalHours / invoice.taskIds.length; // Simple distribution
    return {
      name: task?.name || 'Unknown Task',
      hours: hours,
      rate: task?.rate || 0,
      amount: hours * (task?.rate || 0)
    };
  });

  const handleApprove = () => {
    if (!approvalForm.signature.trim()) {
      alert('Please provide your signature to approve the invoice.');
      return;
    }
    onApprove(approvalForm.signature, approvalForm.comments);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    onReject(rejectionReason);
  };

  if (invoice.status === 'approved') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <CardTitle className="text-green-800">Invoice Approved</CardTitle>
              <p className="text-green-700">
                This invoice has been approved on {invoice.approvedAt ? new Date(invoice.approvedAt).toLocaleDateString() : 'N/A'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center text-green-700">
                <p className="mb-2"><strong>Approved by:</strong> {invoice.clientSignature}</p>
                {invoice.clientComments && (
                  <div className="mt-4 p-4 bg-green-100 rounded-lg">
                    <p><strong>Client Comments:</strong></p>
                    <p className="italic">{invoice.clientComments}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (invoice.status === 'rejected') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <XCircle className="mx-auto h-16 w-16 text-red-600 mb-4" />
              <CardTitle className="text-red-800">Invoice Rejected</CardTitle>
              <p className="text-red-700">This invoice has been rejected by the client.</p>
            </CardHeader>
            <CardContent>
              <div className="text-center text-red-700">
                {invoice.clientComments && (
                  <div className="mt-4 p-4 bg-red-100 rounded-lg">
                    <p><strong>Rejection Reason:</strong></p>
                    <p className="italic">{invoice.clientComments}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Invoice Approval Required</CardTitle>
            <p className="text-muted-foreground">
              Please review the invoice details below and approve or reject
            </p>
          </CardHeader>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #{invoice.id.slice(0, 8)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  From
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{freelancerProfile.businessName}</p>
                  <p>{freelancerProfile.fullName}</p>
                  <p>{freelancerProfile.address}</p>
                  <p>{freelancerProfile.city}, {freelancerProfile.state} {freelancerProfile.zipCode}</p>
                  <p>{freelancerProfile.email}</p>
                  <p>{freelancerProfile.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  To
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{invoice.clientName}</p>
                  <p>{invoice.clientEmail}</p>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Total Hours: {invoice.totalHours.toFixed(1)}</span>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {invoice.description && (
              <div>
                <h3 className="font-semibold mb-2">Work Description</h3>
                <p className="text-muted-foreground">{invoice.description}</p>
              </div>
            )}

            {/* Work Breakdown */}
            <div>
              <h3 className="font-semibold mb-4">Work Breakdown</h3>
              <div className="space-y-3">
                {taskDetails.map((task, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.hours.toFixed(1)} hours @ ${task.rate.toFixed(2)}/hour
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${task.amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Amount Due
                </span>
                <span className="text-2xl font-bold text-primary">
                  ${invoice.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Terms & Notes */}
            {invoice.notes && (
              <div>
                <h3 className="font-semibold mb-2">Terms & Notes</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Actions */}
        {!showRejectionForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Review & Approve</CardTitle>
              <p className="text-muted-foreground">
                Please review the invoice details above and provide your approval or rejection
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="signature">Your Name/Signature *</Label>
                <Input
                  id="signature"
                  value={approvalForm.signature}
                  onChange={(e) => setApprovalForm({ ...approvalForm, signature: e.target.value })}
                  placeholder="Enter your full name to approve"
                  required
                />
              </div>
              <div>
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  value={approvalForm.comments}
                  onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                  placeholder="Any additional comments or feedback..."
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleApprove}
                  className="flex-1"
                  disabled={!approvalForm.signature.trim()}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(true)}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Reject Invoice</CardTitle>
              <p className="text-red-700">
                Please provide a reason for rejecting this invoice
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why you're rejecting this invoice..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Card className="bg-muted/50">
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              This invoice approval system is secure and your response will be recorded with timestamp.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
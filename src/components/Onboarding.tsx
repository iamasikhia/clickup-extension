import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle, User, Building, DollarSign, Rocket } from 'lucide-react';

interface FreelancerProfile {
  // Personal Info
  fullName: string;
  email: string;
  logoUrl?: string;

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

type OnboardingProps = {
  onComplete: (profile: FreelancerProfile) => Promise<void>;
  initialData?: {
    email: string;
    fullName: string;
  };
}

export function Onboarding({ onComplete, initialData }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<FreelancerProfile>({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    logoUrl: '',
    businessName: '',
    businessType: 'freelancer',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    profession: '',
    defaultHourlyRate: 0,
    currency: 'USD',
    timeZone: 'America/New_York',
    preferredPaymentTerms: '30'
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const businessTypes = [
    { value: 'freelancer', label: 'Freelancer', description: 'Independent contractor' },
    { value: 'agency', label: 'Agency', description: 'Creative or marketing agency' },
    { value: 'consultant', label: 'Consultant', description: 'Business consultant' },
    { value: 'other', label: 'Other', description: 'Other business type' }
  ];

  const professions = [
    'Web Developer', 'UI/UX Designer', 'Graphic Designer', 'Content Writer',
    'Marketing Consultant', 'Software Developer', 'Data Analyst', 'Project Manager',
    'Photographer', 'Video Editor', 'Social Media Manager', 'SEO Specialist'
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      await onComplete(profile);
    } catch (error) {
      console.error("Onboarding complete failed", error);
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return profile.businessName && profile.businessType;
      case 2:
        return profile.address && profile.city && profile.state && profile.zipCode && profile.country;
      case 3:
        return profile.profession && profile.defaultHourlyRate > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Building className="mx-auto h-12 w-12 text-primary mb-4" />
              <h2 className="text-xl font-semibold">Business Details</h2>
              <p className="text-muted-foreground">
                Tell us about your business or freelance work
              </p>
            </div>

            {/* Logo Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="flex flex-col items-center">
                <Label htmlFor="logo" className="cursor-pointer flex flex-col items-center group">
                  <div className={`rounded-full overflow-hidden border-2 border-dashed flex items-center justify-center transition-all duration-200 ${profile.logoUrl
                      ? 'w-16 h-16 border-primary'
                      : 'w-24 h-24 border-gray-400 hover:border-primary hover:bg-gray-50'
                    }`}>
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} alt="Business Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <User className="h-8 w-8 mb-1" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                      </div>
                    )}
                  </div>

                  {/* Change Text below */}
                  {profile.logoUrl && (
                    <span className="text-xs text-primary font-medium mt-2 group-hover:underline">
                      Change Logo
                    </span>
                  )}
                </Label>
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </div>
              {!profile.logoUrl && (
                <p className="text-sm text-muted-foreground mt-3">
                  Business Logo <span className="text-xs text-gray-400">(Optional)</span>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="businessName">Business/Professional Name *</Label>
              <Input
                id="businessName"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                placeholder="Your Business Name or Professional Name"
                required
              />
            </div>

            <div>
              <Label>Business Type *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {businessTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${profile.businessType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                    onClick={() => setProfile({ ...profile, businessType: type.value as any })}
                  >
                    <h4 className="font-medium">{type.label}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="mx-auto h-12 w-12 text-primary mb-4" />
              <h2 className="text-xl font-semibold">Business Address</h2>
              <p className="text-muted-foreground">
                This will appear on your invoices
              </p>
            </div>

            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="New York"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="NY"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                <Input
                  id="zipCode"
                  value={profile.zipCode}
                  onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                  placeholder="10001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  placeholder="United States"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <DollarSign className="mx-auto h-12 w-12 text-primary mb-4" />
              <h2 className="text-xl font-semibold">Professional Setup</h2>
              <p className="text-muted-foreground">
                Configure your rates and preferences
              </p>
            </div>

            <div>
              <Label htmlFor="profession">Profession/Specialty *</Label>
              <select
                id="profession"
                value={profile.profession}
                onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-background"
                required
              >
                <option value="">Select your profession</option>
                {professions.map((prof) => (
                  <option key={prof} value={prof}>{prof}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultHourlyRate">Default Hourly Rate *</Label>
                <Input
                  id="defaultHourlyRate"
                  type="number"
                  step="0.01"
                  value={profile.defaultHourlyRate}
                  onChange={(e) => setProfile({ ...profile, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                  onBlur={(e) => setProfile({ ...profile, defaultHourlyRate: parseFloat(parseFloat(e.target.value).toFixed(2)) || 0 })}
                  placeholder="75.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentTerms">Default Payment Terms (Days)</Label>
              <select
                id="paymentTerms"
                value={profile.preferredPaymentTerms}
                onChange={(e) => setProfile({ ...profile, preferredPaymentTerms: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="15">15 days</option>
                <option value="30">30 days</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
              </select>
            </div>

            <div>
              <Label htmlFor="timeZone">Time Zone</Label>
              <select
                id="timeZone"
                value={profile.timeZone}
                onChange={(e) => setProfile({ ...profile, timeZone: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Welcome to Smart Invoice</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Let's get you set up in just a few steps
          </p>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <Badge
                key={i}
                variant={i + 1 <= currentStep ? 'default' : 'outline'}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {i + 1 < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!isStepValid() || isSubmitting}
                className="bg-primary"
              >
                {isSubmitting ? (
                  <>
                    <Rocket className="mr-2 h-4 w-4 animate-bounce" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Get Started
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
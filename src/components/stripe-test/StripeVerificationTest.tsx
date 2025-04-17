
import React, { useState } from 'react';
import { verifyStripeKey } from '@/lib/stripe/verification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const StripeVerificationTest = () => {
  const [verificationResult, setVerificationResult] = useState<{
    success?: boolean;
    message?: string;
    data?: any;
    error?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      console.log('Testing Stripe key verification...');
      const result = await verifyStripeKey();
      console.log('Verification result:', result);
      setVerificationResult(result);
    } catch (error) {
      console.error('Error verifying Stripe key:', error);
      setVerificationResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Stripe Verification Test</CardTitle>
        <CardDescription>Test your Stripe secret key configuration</CardDescription>
      </CardHeader>
      <CardContent>
        {verificationResult.success === undefined ? (
          <p>Click the button below to verify your Stripe configuration.</p>
        ) : verificationResult.success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 font-medium">✅ Verification successful!</p>
            <p className="text-sm text-green-600 mt-1">{verificationResult.message}</p>
            {verificationResult.data && (
              <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-auto">
                {JSON.stringify(verificationResult.data, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 font-medium">❌ Verification failed</p>
            <p className="text-sm text-red-600 mt-1">
              {verificationResult.message || verificationResult.error || 'Unknown error'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleVerify} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Verifying...' : 'Verify Stripe Configuration'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StripeVerificationTest;

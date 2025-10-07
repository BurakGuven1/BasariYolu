import { ReactNode } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import Paywall from './Paywall';

interface FeatureGateProps {
  feature: string;
  children?: ReactNode;
  fallback?: ReactNode;
  showPaywall?: boolean;
  onUpgrade?: () => void;
}

export default function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showPaywall = true,
  onUpgrade 
}: FeatureGateProps) {
  const { hasFeature, loading } = useFeatureAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasAccess = hasFeature(feature);

    if (!hasAccess) {
    if (showPaywall && onUpgrade) {
        return <Paywall feature={feature} onUpgrade={onUpgrade} />;
    }
    return <>{fallback || null}</>;
    }

    return <>{children || null}</>;
}
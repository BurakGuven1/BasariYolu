import { ReactNode } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';


interface FeatureGateProps {
  feature: string;
  children?: ReactNode;
  fallback?: ReactNode;
  onUpgrade?: () => void;
}

export default function FeatureGate({ 
  feature, 
  children, 
  fallback, 
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

    return <>{fallback || null}</>;
    }

    return <>{children || null}</>;
}
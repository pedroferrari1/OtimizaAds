import { Card, CardContent } from "@/components/ui/card";
import PaymentMethodDisplay from "@/components/subscription/PaymentMethodDisplay";
import SubscriptionHistory from "./SubscriptionHistory";
import { UserSubscription } from "@/types/subscription";

interface PaymentSectionProps {
  userSubscription: UserSubscription;
  onManage: () => void;
}

const PaymentSection = ({ userSubscription, onManage }: PaymentSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <PaymentMethodDisplay
        brand="visa" // Exemplo - idealmente viria do Stripe
        last4="4242" // Exemplo - idealmente viria do Stripe
        isActive={userSubscription.status === 'active'}
        onManage={onManage}
      />
      
      <SubscriptionHistory />
    </div>
  );
};

export default PaymentSection;
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";

const SubscriptionPricing = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Todos os Planos Disponíveis
      </h2>
      <SubscriptionPlans />
    </div>
  );
};

export default SubscriptionPricing;
import React from "react";

interface PlansHeaderProps {
  compact?: boolean;
}

const PlansHeader = ({ compact = false }: PlansHeaderProps) => {
  if (compact) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Escolha seu plano
        </h3>
      </div>
    );
  }

  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900">
        Escolha o plano <span className="text-blue-600">ideal</span> para você
      </h2>
      <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
        Comece gratuitamente e evolua conforme seu negócio cresce.
      </p>
    </div>
  );
};

export default PlansHeader;
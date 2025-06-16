import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";

interface PaymentMethodDisplayProps {
  brand?: string;
  last4?: string;
  isActive: boolean;
  onManage: () => void;
}

const PaymentMethodDisplay = ({ 
  brand, 
  last4, 
  isActive, 
  onManage 
}: PaymentMethodDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getCardIcon = () => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return "💳 Visa";
      case 'mastercard':
        return "💳 Mastercard";
      case 'amex':
        return "💳 American Express";
      default:
        return "💳 Cartão";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Método de Pagamento
        </CardTitle>
        <CardDescription>
          Informações sobre seu método de pagamento atual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">{getCardIcon()}</span>
              {last4 && (
                <span className="text-sm">
                  {showDetails ? `**** **** **** ${last4}` : "•••• •••• •••• ••••"}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {last4 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              <Badge variant={isActive ? "default" : "destructive"}>
                {isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
            {isActive ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-gray-700">
                {isActive 
                  ? "Seu método de pagamento está ativo e funcionando corretamente." 
                  : "Há um problema com seu método de pagamento. Por favor, atualize-o para evitar interrupções no serviço."}
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600" 
                onClick={onManage}
              >
                {isActive ? "Atualizar cartão" : "Corrigir método de pagamento"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodDisplay;
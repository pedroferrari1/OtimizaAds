import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface FormValidationMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "error" | "success" | "warning";
  message?: string;
  showIcon?: boolean;
}

export const FormValidationMessage = React.forwardRef<
  HTMLDivElement,
  FormValidationMessageProps
>(({ className, type = "error", message, showIcon = true, ...props }, ref) => {
  if (!message) return null;

  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
      case "error":
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
      default:
        return "text-red-600";
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium mt-1.5",
        getStyles(),
        className
      )}
      {...props}
    >
      {getIcon()}
      <span>{message}</span>
    </div>
  );
});

FormValidationMessage.displayName = "FormValidationMessage";

export const FormRequiredIndicator = () => (
  <span className="text-red-500 ml-0.5">*</span>
);

export const FormFieldFeedback = ({
  isValid,
  isSubmitted,
  errorMessage,
  successMessage,
  showSuccessMessage = false,
}: {
  isValid: boolean;
  isSubmitted: boolean;
  errorMessage?: string;
  successMessage?: string;
  showSuccessMessage?: boolean;
}) => {
  if (!isSubmitted) return null;
  
  if (isValid) {
    return showSuccessMessage && successMessage ? (
      <FormValidationMessage type="success" message={successMessage} />
    ) : null;
  }
  
  return <FormValidationMessage type="error" message={errorMessage} />;
};
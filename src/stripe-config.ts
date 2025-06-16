// Stripe product configuration
export const STRIPE_PRODUCTS = {
  basicPlan: {
    id: 'prod_SOXxuGXLhfwrHs',
    priceId: 'price_1RaPvxAK3IULnjbOyRSzqEIO',
    name: 'Plano Básico',
    description: 'Assinatura Plano Básico OtimizaAds',
    mode: 'subscription' as const,
  },
  intermediatePlan: {
    id: 'prod_SOXxvHYMigxsSt',
    priceId: 'price_1RaPwzAK3IULnjbOzTUzqFJP',
    name: 'Plano Intermediário',
    description: 'Assinatura Plano Intermediário OtimizaAds',
    mode: 'subscription' as const,
  },
  premiumPlan: {
    id: 'prod_SOXxwIZNjhytTu',
    priceId: 'price_1RaPxzAK3IULnjbP0UVzrGKQ',
    name: 'Plano Premium',
    description: 'Assinatura Plano Premium OtimizaAds',
    mode: 'subscription' as const,
  },
};

// URLs for checkout success and cancel
export const CHECKOUT_SUCCESS_URL = `${window.location.origin}/app/assinatura?success=true`;
export const CHECKOUT_CANCEL_URL = `${window.location.origin}/app/assinatura?canceled=true`;

// Stripe Elements configuration
export const STRIPE_ELEMENTS_OPTIONS = {
  locale: 'pt-BR',
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0070f3',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  },
};
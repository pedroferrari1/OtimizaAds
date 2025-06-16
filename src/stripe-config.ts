// Stripe product configuration
export const STRIPE_PRODUCTS = {
  basicPlan: {
    id: 'prod_SOXxuGXLhfwrHs',
    priceId: 'price_1RaPvxAK3IULnjbOyRSzqEIO',
    name: 'Plano Básico',
    description: 'Assinatura Plano Básico OtimizaAds',
    mode: 'subscription' as const,
  },
};

// URLs for checkout success and cancel
export const CHECKOUT_SUCCESS_URL = `${window.location.origin}/app/assinatura?success=true`;
export const CHECKOUT_CANCEL_URL = `${window.location.origin}/app/assinatura?canceled=true`;
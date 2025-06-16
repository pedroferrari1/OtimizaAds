/*
  # Create Asaas Webhooks Table

  1. New Table
    - `asaas_webhooks`: Stores webhook events from Asaas
      - `id`: Primary key
      - `event`: Event type from Asaas
      - `payload`: Full JSON payload from webhook
      - `processed`: Flag to track if webhook has been processed
      - `processed_at`: When the webhook was processed
      - `created_at`: When the webhook was received

  2. Security
    - Enables Row Level Security (RLS)
    - Only admins can access the table
*/

CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
CREATE POLICY "Admins can manage asaas_webhooks"
  ON asaas_webhooks
  FOR ALL
  TO public
  USING (is_admin(auth.uid()));

-- Add foreign key relationship between user_subscriptions and profiles
ALTER TABLE user_subscriptions 
ADD CONSTRAINT fk_user_subscriptions_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

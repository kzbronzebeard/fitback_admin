-- Update the feedbacks table to remove points_awarded and add cashback_amount
ALTER TABLE IF EXISTS feedbacks
DROP COLUMN IF EXISTS points_awarded,
ADD COLUMN IF NOT EXISTS cashback_amount DECIMAL(10, 2) DEFAULT 50.00;

-- Update the wallet_transactions table to simplify transaction types
ALTER TABLE IF EXISTS wallet_transactions
DROP COLUMN IF EXISTS source,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create a view to simplify the wallet balance calculation
CREATE OR REPLACE VIEW user_wallet_balance AS
SELECT 
  user_id,
  SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) AS balance
FROM wallet_transactions
GROUP BY user_id;

-- Create a function to add cashback for approved feedback
CREATE OR REPLACE FUNCTION add_cashback_for_approved_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- If feedback status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Add cashback transaction
    INSERT INTO wallet_transactions (
      user_id,
      amount,
      type,
      description,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.cashback_amount,
      'credit',
      'Cashback for approved feedback',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for adding cashback
DROP TRIGGER IF EXISTS add_cashback_trigger ON feedbacks;
CREATE TRIGGER add_cashback_trigger
AFTER UPDATE ON feedbacks
FOR EACH ROW
EXECUTE FUNCTION add_cashback_for_approved_feedback();

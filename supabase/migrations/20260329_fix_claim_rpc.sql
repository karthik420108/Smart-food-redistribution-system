-- Create Function to decrement listing quantity atomically
-- This function is called by the NGO portal when a claim is created.

CREATE OR REPLACE FUNCTION decrement_listing_quantity(
  p_listing_id UUID,
  p_amount DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to bypass RLS for this specific update
AS $$
BEGIN
  -- 1. Update the quantity precisely
  UPDATE food_listings
  SET quantity = quantity - p_amount
  WHERE id = p_listing_id AND quantity >= p_amount;
  
  -- 2. Check if a row was actually updated (if not, it means quantity < p_amount)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient quantity available for listing %', p_listing_id;
  END IF;

  -- 3. Automatically mark as 'claimed' if quantity drops to 0
  UPDATE food_listings
  SET status = 'claimed'
  WHERE id = p_listing_id AND quantity <= 0;
END;
$$;

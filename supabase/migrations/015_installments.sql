-- Add installment support to transactions
-- Approach: N rows per installment (one row per monthly payment)
-- Each row has the monthly amount (total / installments_total)
-- This keeps reporting/dashboard working without any changes
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS installments_total INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installment_number INT NOT NULL DEFAULT 1;

ALTER TABLE public.transactions
  ADD CONSTRAINT chk_installments_total CHECK (installments_total >= 1),
  ADD CONSTRAINT chk_installment_number_positive CHECK (installment_number >= 1),
  ADD CONSTRAINT chk_installment_number_range CHECK (installment_number <= installments_total);

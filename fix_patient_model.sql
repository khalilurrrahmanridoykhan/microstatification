-- Fix Patient model by adding missing is_deleted and deleted_at fields
-- This corresponds to migration 0039_trashbin_patient_is_deleted_patient_deleted_at.py

-- Add is_deleted field with default value False
ALTER TABLE api_patient
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add deleted_at field for soft delete timestamp
ALTER TABLE api_patient
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Update existing records to have is_deleted = false
UPDATE api_patient SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Make is_deleted NOT NULL after setting default values
ALTER TABLE api_patient
ALTER COLUMN is_deleted SET NOT NULL;

-- Add help text comments
COMMENT ON COLUMN api_patient.is_deleted IS 'Soft delete flag';
COMMENT ON COLUMN api_patient.deleted_at IS 'When the patient was soft deleted';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'api_patient'
AND column_name IN ('is_deleted', 'deleted_at');

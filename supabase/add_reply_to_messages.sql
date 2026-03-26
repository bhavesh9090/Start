-- ============================================================
-- ADD REPLY FEATURE TO ADMIN MESSAGES
-- ============================================================

ALTER TABLE admin_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES admin_messages(id) ON DELETE SET NULL;

-- Enable indexing for performance on joins
CREATE INDEX IF NOT EXISTS idx_admin_messages_reply_to ON admin_messages(reply_to_id);

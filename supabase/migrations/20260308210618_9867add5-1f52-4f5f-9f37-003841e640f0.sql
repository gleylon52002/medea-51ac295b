ALTER TABLE email_logs DROP CONSTRAINT email_logs_order_id_fkey;
ALTER TABLE email_logs ADD CONSTRAINT email_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
CREATE TABLE IF NOT EXISTS file_owner (
    id SERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,
    file_id BIGINT NOT NULL,
    CONSTRAINT fk_file_owner_file_id FOREIGN KEY (file_id) REFERENCES user_files(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_owner_file_id ON file_owner(file_id);
CREATE INDEX idx_file_owner_user_id ON file_owner(owner_user_id); 
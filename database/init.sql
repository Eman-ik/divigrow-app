CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notes (title, content) VALUES 
('Welcome to DiviGrow Notes', 'This is your first note. You can create, edit, and delete notes here.'),
('Docker Deployment Complete', 'Your application is successfully running in Docker containers!');
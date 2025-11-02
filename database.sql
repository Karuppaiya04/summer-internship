-- Create database
CREATE DATABASE IF NOT EXISTS birthday_reminder;

-- Use the database
USE birthday_reminder;

-- Create birthdays table
CREATE TABLE IF NOT EXISTS birthdays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO birthdays (name, birth_date, email, phone) VALUES
('John Doe', '1990-05-15', 'john@example.com', '123-456-7890'),
('Jane Smith', '1985-08-22', 'jane@example.com', '098-765-4321'),
('Alice Johnson', '1995-12-10', 'alice@example.com', '555-123-4567');

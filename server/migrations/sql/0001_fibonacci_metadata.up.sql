-- Create table to track Fibonacci request counts
CREATE TABLE IF NOT EXISTS fibonacci_requests_metadata (
  number INT PRIMARY KEY,
  count INT NOT NULL DEFAULT 0
);

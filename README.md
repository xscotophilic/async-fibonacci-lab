# Fibonacci Calculator

A web application that calculates Fibonacci numbers without freezing processes.

## What is this?

This is a **Fibonacci number calculator** that stays responsive even when calculating large numbers. Instead of making you wait and stare at a frozen screen, it gives you instant feedback and works in the background.

## How does it work?

### The Problem

Some Fibonacci numbers take time to calculate. Without smart design, your browser would freeze and show nothing until the calculation finishes.

### Our Solution

We built a system that can say: _"Got your request! We're working on it - check back in a moment."_

Here's what happens when you ask for a Fibonacci number:

1. **You submit a request** -> The app immediately responds "We're calculating this for you!"
2. **Background calculation** -> A worker starts computing the number behind the scenes
3. **On check request** -> The app shows your result or "We're still calculating this for you!"
4. **Smart caching** -> If someone else asks for the same number, we give the answer instantly

### Why this matters

- **No frozen screens** - You always get immediate feedback
- **Shared calculations** - If multiple people ask for the same number, we calculate it once
- **Popular numbers** - See which Fibonacci numbers people request most
- **Fast results** - Previously calculated numbers appear instantly

## Technical Details

For technical users, detailed documentation is available:

- **[Architecture Guide](docs/architecture.md)** - System design and technical decisions
- **[Data Store Guide](docs/providers.md)** - System design and technical decisions
- **[Client Documentation](client/README.md)** - Frontend setup and development
- **[Server Documentation](server/README.md)** - Backend API and database setup
- **[Worker Documentation](worker/README.md)** - Background processing service

## Important Note

**This is a demonstration project** to showcase async processing patterns. While we use Fibonacci numbers as an example, the same architectural approach can be applied to many real-world scenarios:

### Practical Use Cases

- **Image/Video Processing** - Upload a file, get immediate confirmation, process in background
- **Report Generation** - Request a complex report, receive "generating..." status, get notified when ready
- **Email Campaigns** - Queue bulk email sends, show progress, handle bounces asynchronously
- **Machine Learning** - Train models in background while users continue working
- **Backup Operations** - Initiate backups, show status, notify on completion
- **Many more**

The key principle: **Never make users wait for slow operations**. Always provide immediate feedback and handle the work asynchronously.

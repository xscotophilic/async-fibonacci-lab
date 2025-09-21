# Async Fibonacci Worker

Consumes Fibonacci index jobs from Redis, computes values iteratively with caching, and stores results back in Redis. Designed to run alongside the rest of the async-fibonacci-lab stack.

## Getting Started

- Navigate to the worker directory

### Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) (which includes `npm`) installed on your system.
- Redis running and reachable

### Step 1 - Install Dependencies

```bash
npm install
```

### Step 2 - Configure Environment Variables

Copy the example file and fill in all values:

```bash
cp .env.example .env
```

Open the newly created .env file and fill in all of the variables shown below

```ini
# Logging
LOG_LEVEL=info

# Redis
# (no auth): REDIS_URL=redis://localhost:6379
# (with password): REDIS_URL=redis://:redis@redis:6379
REDIS_URL=redis://localhost:6379
```

- **`LOG_LEVEL`** - The logging level for the worker. Valid values are `debug`, `info`, `warn`, `error`, etc.
    - The worker logs to console and to `worker/worker.log` (see `src/config/logger.js`). Control verbosity via `LOG_LEVEL`.
- **`REDIS_URL`** - The URL of the Redis server to connect to.

> **Security:** The `.env` file is excluded by `.gitignore` and should **never** be committed to version control.

### Step 3 - Run the Worker

```bash
# in development mode
npm run dev

# in production mode
npm run start
```

## How It Works

- Startup
  - Seed base cache `{0: 0, 1: 1}` in `fibonacci_values` if empty.
  - Ensure `fib:max_index` reflects the highest computed index.
  - Continuously poll `fib:index_queue` for new jobs.
- For each index `n`
  - Move `n` from `fib:index_queue` to `fib:index_processing` (in-flight).
  - Read `fib:max_index` and the latest cached values from `fibonacci_values`.
  - For each `i` from `fib:max_index + 1` up to `n`:
    - Compute `fib(i)` iteratively using the two previously cached values.
    - Store `fib(i)` in the `fibonacci_values` hash (field=`i`, value=number).
  - Atomically bump `fib:max_index` to the highest newly computed index using a Lua script to avoid races when multiple workers run.
  - Remove `n` from `fib:index_processing` when done.
- Reliability
  - Retries: on error, increment `fib:index_fail_counts[n]` and retry with backoff up to 3 times.
  - Dead-letter: after max retries, push `n` to `fib:index_deadletter`.
  - Recovery: on startup, any indices found in `fib:index_processing` are returned to `fib:index_queue`.

## Queues and Keys

- `fib:index_queue` - main job queue (list). Push indices here.
- `fib:index_processing` - in-flight jobs (list).
- `fib:index_deadletter` - permanently failed indices after retries (list).
- `fibonacci_values` - computed values cache (hash). Fields are indices; values are numbers.
- `fib:max_index` - highest fully computed index (string).
- `fib:index_fail_counts` - per-index retry counters (hash).

## Graceful Shutdown

Press Ctrl+C (SIGINT) or send SIGTERM. The worker enqueues an internal stop token, finishes the current task, and exits cleanly:

- Cleans `fib:index_processing` entry for the current job.
- Closes Redis connections.

## Notes

- The worker is stateless. It can be horizontally scaled, each instance will coordinate via queues and the stop-token mechanism.
- Indices must be non-negative integers. Non-numeric payloads are ignored.

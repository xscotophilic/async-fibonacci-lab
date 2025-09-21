local hashKey = KEYS[1]
local queueKey = KEYS[2]
local processingKey = KEYS[3]
local index = ARGV[1]
local status = ARGV[2]

if redis.call('HEXISTS', hashKey, index) == 1 then
  return 0
end

if redis.call('LPOS', queueKey, index) then
  return 0
end

if redis.call('LPOS', processingKey, index) then
  return 0
end

redis.call('HSET', hashKey, index, status)
redis.call('RPUSH', queueKey, index)
return 1

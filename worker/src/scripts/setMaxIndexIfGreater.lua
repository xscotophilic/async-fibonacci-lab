local maxIndexKey = KEYS[1]
local newMaxIndex = tonumber(ARGV[1])

local currMaxIndex = redis.call('GET', maxIndexKey)
if not currMaxIndex then
  redis.call('SET', maxIndexKey, newMaxIndex)
  return 1
end

currMaxIndex = tonumber(currMaxIndex)
if newMaxIndex > currMaxIndex then
  redis.call('SET', maxIndexKey, newMaxIndex)
  return 1
end

return 0

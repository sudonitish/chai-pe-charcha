// Single shared tag: every mutation busts the whole shared-data cache.
// Simpler and safer than fine-grained tags for an app this size — no risk
// of a write forgetting to invalidate some narrower tag it should have.
export const TEA_DATA_TAG = "tea-data"

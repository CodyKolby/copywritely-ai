
// Generate unique ID for deployment tracking
export function generateDeploymentId(): string {
  return crypto.randomUUID().substring(0, 8);
}

// Create a cache buster value
export function generateCacheBuster(requestId: string, deploymentId: string): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${deploymentId}-${requestId}`;
}

// Get current timestamp in ISO format
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

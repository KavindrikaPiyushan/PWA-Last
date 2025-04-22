import {getSub, saveSub,clearSub } from '../subscriptionDB';

export async function checkSubscription() {
    const sub = await getSub();
    if (!sub) return false; // No subscription data found
  
    const now = new Date();
    const expiry = new Date(sub.expires);
    if (expiry < now) {
      clearSub(); // Clear expired subscription data
      return false;
    }
  
    // Check how long since the last verification (7 days rule)
    const lastChecked = new Date(sub.last_verified || '2000-01-01');
    const days = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60 * 24);
  
    // If it's been 7 days and online, revalidate the subscription
    if (days >= 7 && navigator.onLine) {
      const res = await fetch('http://localhost:5000/api/validate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: sub.license_key })
      });
  
      const result = await res.json();
      if (!result.valid) {
        clearSub(); // Clear invalid subscription
        return false;
      }
  
      // Update subscription data in IndexedDB
      await saveSub({ ...sub, expires: result.expires, last_verified: now.toISOString() });
    }

    console.log("subscription status..",true)
  
    return true; // Subscription is valid
  }
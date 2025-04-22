import {saveSub} from '../subscriptionDB';

export async function activateLicense(licenseKey){
    const res=await fetch('http://localhost:5000/api/validate-license',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({licenseKey})
    });

    const result = await res.json();
    if(!result.valid) throw new Error('License invalid or expired');

    await saveSub({
        license_key: licenseKey,
        plan: result.plan,
        expires: result.expires,
        last_verified: new Date().toISOString()

    })
}
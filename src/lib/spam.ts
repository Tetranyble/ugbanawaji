const disposableDomains = new Set([
  "mailinator.com","guerrillamail.com","10minutemail.com","temp-mail.org","tempmail.com","yopmail.com","sharklasers.com","throwawaymail.com","getnada.com","maildrop.cc"
]);
export function isDisposableEmail(email:string){const domain=email.toLowerCase().split("@")[1]||"";return disposableDomains.has(domain);}
export function formWasFilledTooFast(startedAt:FormDataEntryValue|null,minMs=1800){const ts=Number(startedAt);return !Number.isFinite(ts)||Date.now()-ts<minMs;}

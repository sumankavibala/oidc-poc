import { createRemoteJWKSet, jwtVerify } from "jose";

try {
  const JWKS = createRemoteJWKSet(
      new URL("http://localhost:5000/.well-known/jwks.json")
  );
  
  const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xIn0.eyJzdWIiOiI2YTA3MWVkZDBkM2U4ZjUyMDdiYjFjYjgiLCJyb2xlIjoiYWRtaW4iLCJzY29wZSI6Im9wZW5pZCIsImlhdCI6MTc4MjgzMjY5OCwiZXhwIjoxNzgyODMzNTk4fQ.m3K4LFF2d3Tli5cMSXbIkeMBVY5vFsdp2-NEfNC1g9SnTfWNcDyh99zcdSOOfZLwhR4FLZoyrvpJuQDHAd1XN12QijJ4cUYCVRlSHlTlh2QjNaYzLjRjNMJJxPi9UXdsn9HTKAkt6sm7hOBVPH_wlorCpuNr0JFN9JafF-mZNQ3ag_7mWRsqR8l7EeF_cmlEG0w11aNZg-dkt25MvPdOzWRe_-ty7XaobMQjcshJlGSRkiSH30-deIjBLfQjjnvkfVa-z-ugtKcPpH8TEOURhr9pUKPx-Rscyc39nyGA2N3xdAlrMIeTcUbK_95VEf6WdfQPWndtO7ldniM2O8x1Tg";
  
  const { payload, protectedHeader } = await jwtVerify(
      token,
      JWKS
  );
  
  console.log("Header:");
  console.log(protectedHeader);
  
  console.log("Payload:");
  console.log(payload);
  
} catch (error) {
  console.log('error :>> ', error);
}
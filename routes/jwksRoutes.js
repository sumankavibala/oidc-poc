import express from 'express';
import { importSPKI, exportJWK } from 'jose';
import { publicKey } from '../config/key.js';

const router = express.Router();

router.get('/jwks.json',async(req,res)=>{
    try {
      const cryptoKey = await importSPKI(publicKey,'RS256')
        const jwk = await exportJWK(cryptoKey);
        jwk.use = "sig";
        jwk.alg = "RS256";
        jwk.kid = "key-1";
        res.json({
            keys: [jwk]
        });
    } catch (error) {
        console.error('error inside jwks route -->>',error)
    }
})

export default router;
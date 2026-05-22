import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import oauthRoutes from './routes/authClient.js';
import dbConnection from './config/db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth',authRoutes);
app.use('/api',profileRoutes);
app.use('/oauth',oauthRoutes)
app.get('/', (req, res) => {
    res.send('OIDC server is running');
});

await dbConnection();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

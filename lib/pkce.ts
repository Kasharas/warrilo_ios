import * as Crypto from 'expo-crypto';

/**
 * Generates a random string to be used as code verifier
 */
export const generateCodeVerifier = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

/**
 * Generates a SHA-256 challenge from a code verifier
 */
export const generateCodeChallenge = async (codeVerifier: string) => {
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
    );

    // Convert base64 to base64url (replace +, / and remove =)
    return hash
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

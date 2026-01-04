const fs = require('fs');
const jwt = require('jsonwebtoken');

// Usage: node generate_apple_secret.js <team_id> <key_id> <client_id> <private_key_path>
// Example: node generate_apple_secret.js A1B2C3D4E5 1234567890 com.example.app ./AuthKey_1234567890.p8

const args = process.argv.slice(2);

if (args.length < 4) {
    console.error('Usage: node generate_apple_secret.js <team_id> <key_id> <client_id> <private_key_path>');
    process.exit(1);
}

const [teamId, keyId, clientId, privateKeyPath] = args;

try {
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    const token = jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '180d', // 6 months (max allowed by Apple)
        audience: 'https://appleid.apple.com',
        issuer: teamId,
        subject: clientId,
        keyid: keyId,
    });

    console.log('\n=== Apple Client Secret JWT ===\n');
    console.log(token);
    console.log('\n===============================\n');
    console.log('Copy the token above and paste it into Supabase.');

} catch (error) {
    console.error('Error generating token:', error.message);
}

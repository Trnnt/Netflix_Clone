import fetch from 'node-fetch';

async function test() {
    console.log('--- API SELF-TEST ---');
    
    // 1. Test Registration
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123'
        })
    });
    const regData = await regRes.json();
    console.log('Register Response:', regRes.status, regData.token ? 'Success (Token received)' : 'Failed');

    if (!regData.token) return;

    // 2. Test Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: regData.user.email,
            password: 'password123'
        })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginRes.status, loginData.token ? 'Success' : 'Failed');

    // 3. Test Data Saving (Like)
    const likeRes = await fetch('http://localhost:5000/api/likes', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + loginData.token
        },
        body: JSON.stringify({
            movie_id: '550',
            movie_title: 'Fight Club',
            movie_thumbnail: 'https://image.tmdb.org/t/p/w500/pB8BM79vS7vMDbTVPzX1vYpP2v4.jpg',
            movie_year: '1999',
            movie_genre: 'Drama'
        })
    });
    console.log('Save Data (Like) Response:', likeRes.status);

    // 4. Test Error Handling (Invalid Token)
    const badAuthRes = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': 'Bearer invalid_token' }
    });
    console.log('Error Handling (Invalid Token):', badAuthRes.status, '(Expected 401)');

    // 5. Test Rate Limiting (Spam login attempts)
    console.log('Testing Rate Limiting (making 16 quick login attempts)...');
    for (let i = 0; i < 16; i++) {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'spam@spam.com', password: 'spam' })
        });
        if (res.status === 429) {
            console.log('Rate Limit Triggered at attempt', i+1, '(Expected 429)');
            break;
        }
    }
}

test();

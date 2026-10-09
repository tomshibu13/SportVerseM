fetch('https://sportverse-backend.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'luke@gmail.com', password: 'SV-Station#DDED' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);

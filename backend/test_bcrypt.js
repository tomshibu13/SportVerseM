const bcrypt = require('bcryptjs');
async function test() {
  const match = await bcrypt.compare('SV-Station#DDED', '$2a$10$G1CDcQzpPiPfvXPF4nPzW.6MSv4gnGpO..pQSAvQi.nQ6Tw6mtx/K');
  console.log('Match?', match);
}
test();

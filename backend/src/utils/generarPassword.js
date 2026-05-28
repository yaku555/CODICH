const crypto = require('crypto');

const generarPasswordProvisoria = () => {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = 'Codich-';

  for (let i = 0; i < 8; i++) {
    const indice = crypto.randomInt(0, caracteres.length);
    password += caracteres[indice];
  }

  return password;
};

module.exports = generarPasswordProvisoria;
const JwtUtils = require('../../src/token/jwtUtils.js');

const ID_USUARIO = '507f1f77bcf86cd7994390aa';

// Cookie de sesión lista para .set('Cookie', ...) con un access token válido del rol indicado
const cookieDeSesion = (rol, id = ID_USUARIO) => {
    const token = new JwtUtils().generarAccessToken({ id, username: 'usuario-test', rol });
    return `accessToken=${token}`;
};

module.exports = { cookieDeSesion, ID_USUARIO };

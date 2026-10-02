export const CONFIG = {
  teamId: 8201,
  seasonId: 3,
  apiUrl:
    "https://seriesnacionalesdepadel.snpgalaxy.com/jugador/ajaxGetAllJugadores/s_:YDVuE1b1JFrIZbvc23gmrQobobubiVTC7YwcTA==",
  requestTimeoutMs: 10000,
  courts: 5,
  // Configuración web de Firebase (pública por diseño; la seguridad está en las reglas).
  // Sin esta configuración la app funciona solo en modo local.
  firebase: {
    apiKey: "AIzaSyC61M3xJRlfDeSQM7JM6QcoQWoriWcAqNk",
    authDomain: "snpteambuilder.firebaseapp.com",
    projectId: "snpteambuilder",
    storageBucket: "snpteambuilder.firebasestorage.app",
    messagingSenderId: "973445499674",
    appId: "1:973445499674:web:9810e6db74bdaadcccfaa3",
  },
};

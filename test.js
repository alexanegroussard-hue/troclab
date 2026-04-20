console.log("--- TEST DÉMARRÉ ---");
require('dotenv').config({ path: '../.env' });
console.log("Dotenv chargé");

const supabase = require('./backend/supabaseClient');
console.log("Client Supabase importé");

async function testerConnexion() {
  console.log("Appel de la fonction...");
  const { data, error } = await supabase.from('users').select('*');
  
  if (error) {
    console.error("ERREUR TROUVÉE :", error);
  } else {
    console.log("SUCCÈS :", data);
  }
}

testerConnexion();
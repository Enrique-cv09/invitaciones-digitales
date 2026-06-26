import fs from 'fs';

// 1. Pon el dominio temporal de tu localhost para pruebas o el de Vercel cuando lo subas
const DOMINIO = "http://192.168.0.60:5173/"; 

// 2. La lista de invitados que te pase el cliente (puedes agregar los que quieras aquí)
const listaInvitados = [
  "Familia Pérez Mendoza",
  "Tío Juan y Tía Clara",
  "Primo Carlos y Novia",
  "Familia Gómez Aranda",
  "Amigas de la Escuela",
  "Familia Rodríguez Beltrán"
];

// Función para generar un ID aleatorio corto de 5 caracteres
const generarIdAleatorio = () => Math.random().toString(36).substring(2, 7);

// 3. Estructura del archivo CSV (Excel) para el cliente
let contenidoCSV = "Invitado,Link para enviar por WhatsApp\n";

// 4. Estructura del array para tu base de datos de React
const invitadosProcesados = listaInvitados.map((nombre, indice) => {
  const id = generarIdAleatorio();
  const urlInvitado = `${DOMINIO}?id=${id}`;
  
  // Guardamos en el Excel el nombre y su link limpio
  contenidoCSV += `"${nombre}",${urlInvitado}\n`;
  
  // Retornamos el objeto con todos los campos de las reglas de negocio
  return { 
    id, 
    familia: nombre, 
    pasesTotales: 4, // Valor por defecto, luego lo puedes editar en el JSON
    confirmado: false, 
    mesa: `Mesa ${indice + 1}`, // Asignación automática temporal para la prueba
    ingresado: false 
  };
});

// 5. Escribir los archivos en el disco
fs.writeFileSync('Links_Para_El_Cliente.csv', contenidoCSV, 'utf-8');
fs.writeFileSync('src/data/invitados.json', JSON.stringify(invitadosProcesados, null, 2), 'utf-8');

console.log("=========================================");
console.log("✅ ¡Archivos generados con éxito!");
console.log("1. 'Links_Para_El_Cliente.csv' -> Entrégaselo a los papás para sus envíos.");
console.log("2. 'src/data/invitados.json' -> Creado automáticamente para tu frontend.");
console.log("=========================================");
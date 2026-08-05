# Bóveda Cifrada de Contraseñas y Secretos

Una aplicación web moderna, privada e independiente para la gestión y almacenamiento seguro de contraseñas, notas secretas, tarjetas y documentos de identidad.

Diseñada bajo arquitectura **Zero-Knowledge** (Conocimiento Cero) y cifrado de extremo a extremo en el navegador.

---

## 🔒 Características de Seguridad y Cifrado

- **Cifrado Militar AES-256-GCM**: Todas las credenciales, notas y datos se cifran en el cliente utilizando la API oficial `Web Crypto` del navegador.
- **Derivación PBKDF2**: Derivación de claves segura a partir de la Contraseña Maestra con 100.000 iteraciones y Salt aleatorio de 128 bits.
- **Arquitectura Zero-Knowledge**: La Contraseña Maestra nunca se guarda en texto plano ni se envía a servidores. Si no la recuerdas, nadie puede descifrar tus datos.
- **Auto-Bloqueo por Inactividad**: Temporizador configurable que bloquea la bóveda automáticamente si dejas el dispositivo desatendido.
- **Limpieza Automática de Portapapeles**: Al copiar contraseñas o datos, el portapapeles se limpia automáticamente tras los segundos configurados.
- **Protección contra Capturas / Visualización**: Ocultamiento de campos sensibles y generador de contraseñas criptográficamente seguras (`crypto.getRandomValues`).
- **Simulación y Check de Autenticación Biométrica (WebAuthn)**.

---

## 📱 Funcionalidades de la Aplicación

- **Gestor Multitipo**:
  - 🔑 **Contraseñas y Accesos** (con soporte para URLs, credenciales y notas adicionales).
  - 📝 **Notas Secretas** (con formato enriquecido/bloques de código).
  - 💳 **Tarjetas de Crédito / Débito** (con CVC/CVV cifrado).
  - 🪪 **Documentos de Identidad y Pasaportes**.
  - 🏦 **Cuentas Bancarias y Datos Financieros**.
- **Auditoría de Seguridad**: Análisis en tiempo real de contraseñas débiles, reutilizadas, expuestas o sin actualización reciente.
- **Generador Completo de Contraseñas**: Control de longitud, mayúsculas, minúsculas, números, símbolos e indicador de entropía/fortaleza.
- **Filtros y Búsqueda Inmediata**: Búsqueda por categoría, tipo de elemento, favoritos o término clave.
- **Importación y Exportación de Respaldos**:
  - Exportación en formato cifrado `.vault` (protegido por clave maestra).
  - Exportación en CSV.
  - Importación y combinación rápida de datos.
- **Diseño Ultra Adaptable**: Interfaz optimizada para móviles, tablets y escritorios con tema oscuro y acentos cian/azul.

---

## 💾 ¿Dónde y cómo se guardan los datos?

Los datos se almacenan exclusivamente en el **`localStorage` de tu propio navegador web**.
- **Cifrado previo**: Antes de escribirse en el almacenamiento local, los datos son cifrados en memoria con la clave derivada de tu Contraseña Maestra.
- **Privacidad Total**: Tus datos no se suben a GitHub ni a ningún servidor externo.
- **Persistencia Local**: Aunque cierres la pestaña o apagues la computadora, los datos permanecerán en tu navegador hasta que decidas borrar la bóveda o limpiar los datos del sitio.

---

## 🚀 Cómo ejecutar localmente

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn

### Pasos
1. Clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/NOMBRE_DEL_REPOSITORIO.git
   ```
2. Accede al directorio:
   ```bash
   cd NOMBRE_DEL_REPOSITORIO
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre en tu navegador la dirección indicada (usualmente `http://localhost:3000`).

---

## 🛠️ Tecnologías Utilizadas

- **React 18** + **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS** (Estilos y Diseño Responsivo)
- **Lucide React** (Iconografía)
- **Web Crypto API** (`SubtleCrypto` - AES-GCM, PBKDF2)

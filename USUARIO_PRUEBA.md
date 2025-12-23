# Usuario de Prueba - Vladi App

## Credenciales de Acceso

- **Email:** demo@vladi.app
- **Contraseña:** Demo123!

## Detalles del Usuario

- **ID:** 54140ee4-2596-4fc3-8a43-920b4a941205
- **Username:** demouser
- **Nombre:** Demo User
- **Email Confirmado:** ✅ Sí
- **Estado:** Activo

## Cómo Usar

1. Ve a la pantalla de inicio de la app
2. Haz clic en "Iniciar Sesión"
3. Selecciona método "Email"
4. Introduce: demo@vladi.app
5. Haz clic en la flecha para continuar
6. Introduce la contraseña: Demo123!
7. Haz clic en la flecha para acceder a la app

## Solución del Problema de Confirmación de Email

Para que los nuevos usuarios puedan registrarse sin problemas:

### Opción 1: Desactivar confirmación de email (Recomendado para desarrollo)

1. Ve al Dashboard de Supabase
2. Authentication > Email Templates
3. En "Settings", busca "Confirm email"
4. Desactiva "Enable email confirmations"

### Opción 2: Configurar auto-confirmación

En Supabase, puedes configurar que los emails se confirmen automáticamente:
- Dashboard > Authentication > Providers > Email
- Activa "Confirm email" pero permite auto-login

### Para Producción

Mantén la confirmación de email activada y asegúrate de que:
- El email de confirmación se envía correctamente
- La URL de redirección está configurada: `{SITE_URL}/auth/callback`
- Los usuarios pueden acceder después de confirmar
\`\`\`

\`\`\`tsx file="" isHidden

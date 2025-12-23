# Crear Usuario de Prueba en VLADI

Para crear un usuario de prueba en la aplicación, sigue estos pasos:

## Paso 1: Crear el usuario en Supabase Auth

1. Ve al panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** > **Users**
4. Haz clic en **"Add user"** o **"Invite"**
5. Selecciona **"Create new user"**
6. Completa los datos:
   - **Email**: `demo@vladi.app`
   - **Password**: `Demo123!`
   - **Auto Confirm User**: ✅ Marca esta casilla (importante para saltarse la confirmación por email)

7. Haz clic en **"Create user"**

## Paso 2: El perfil se creará automáticamente

Una vez que inicies sesión con este usuario por primera vez, la aplicación creará automáticamente el perfil con:
- Username: Se generará del email (demo)
- Email: demo@vladi.app
- Display Name: Demo User
- Phone: +34659080825

## Credenciales para iniciar sesión

\`\`\`
Email: demo@vladi.app
Contraseña: Demo123!
\`\`\`

## Notas importantes

- Asegúrate de marcar **"Auto Confirm User"** al crear el usuario para que no necesite confirmación por email
- Si el usuario ya existe y quieres cambiar la contraseña, ve a Authentication > Users, encuentra el usuario y haz clic en los tres puntos > "Reset password"
- El perfil se creará automáticamente en el primer inicio de sesión gracias al código en `app/app/page.tsx`

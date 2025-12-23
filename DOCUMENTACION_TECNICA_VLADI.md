# VLADI - Documentación Técnica Completa
## Asistente Emocional basado en DEAM IEQ

**Versión:** 26.6 AI  
**Stack Tecnológico:** Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS v4  
**Fecha:** Diciembre 2025

---

## 📋 Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Estructura de Archivos](#3-estructura-de-archivos)
4. [Base de Datos](#4-base-de-datos)
5. [Modelo DEAM IEQ](#5-modelo-deam-ieq)
6. [Flujos de Usuario](#6-flujos-de-usuario)
7. [Componentes Principales](#7-componentes-principales)
8. [Lógica de Negocio](#8-lógica-de-negocio)
9. [Autenticación y Seguridad](#9-autenticación-y-seguridad)
10. [Integración con Supabase](#10-integración-con-supabase)
11. [Gestión de Estado](#11-gestión-de-estado)
12. [Sistema de Diseño](#12-sistema-de-diseño)
13. [API Routes y Acciones](#13-api-routes-y-acciones)
14. [Métricas y Algoritmos](#14-métricas-y-algoritmos)
15. [Configuración y Deployment](#15-configuración-y-deployment)
16. [Testing y Debugging](#16-testing-y-debugging)
17. [Roadmap y Mejoras Futuras](#17-roadmap-y-mejoras-futuras)

---

## 1. Visión General del Proyecto

### 1.1 ¿Qué es VLADI?

VLADI es una aplicación móvil web progresiva (PWA) que funciona como un asistente de inteligencia emocional. Utiliza el modelo científico **DEAM IEQ (Distributed Emotion Analysis Model - Inteligencia Emocional Cuantificada)** para ayudar a los usuarios a:

- **Registrar emociones** de forma granular y contextualizada
- **Analizar patrones emocionales** mediante algoritmos de machine learning
- **Medir inteligencia emocional** con 5 dimensiones: Granularidad, Coherencia, Adaptabilidad, Inercia y Precisión
- **Mejorar autorregulación** mediante insights personalizados
- **Compartir estados emocionales** con contactos de confianza

### 1.2 Propuesta de Valor

VLADI transforma la experiencia emocional del usuario de algo abstracto y difuso a algo medible, comprensible y accionable. A diferencia de aplicaciones de "mood tracking" tradicionales, VLADI:

- Utiliza un modelo científico validado (basado en el modelo circumplejo de Russell)
- Calcula métricas cuantitativas de inteligencia emocional
- Proporciona visualizaciones avanzadas de distribuciones emocionales
- Ofrece análisis de inercia emocional (tiempo de recuperación)
- Detecta patrones de conciencia emocional

### 1.3 Usuarios Objetivo

- Personas interesadas en autoconocimiento y desarrollo personal
- Usuarios con problemas de regulación emocional
- Profesionales de salud mental (psicólogos, terapeutas) y sus pacientes
- Organizaciones enfocadas en bienestar corporativo

---

## 2. Arquitectura del Sistema

### 2.1 Arquitectura de Alto Nivel

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENTE (PWA)                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Next.js 16 App Router (React 19)           │ │
│  │                                                     │ │
│  │  ┌─────────────────┐    ┌─────────────────┐      │ │
│  │  │   UI Layer      │    │  Business Logic │      │ │
│  │  │  (Components)   │◄───│   (Lib modules) │      │ │
│  │  └─────────────────┘    └─────────────────┘      │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │      State Management (Zustand)              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                       │
│                                                          │
│  ┌────────────────┐    ┌────────────────┐              │
│  │  PostgreSQL DB │    │   Auth Service │              │
│  │   (8 tablas)   │    │  (Email/OAuth) │              │
│  └────────────────┘    └────────────────┘              │
│                                                          │
│  ┌────────────────┐    ┌────────────────┐              │
│  │  Row Level     │    │  Real-time     │              │
│  │  Security(RLS) │    │  Subscriptions │              │
│  └────────────────┘    └────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico Detallado

#### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19.2 (con características canary como `useEffectEvent`, `<Activity>`)
- **Lenguaje:** TypeScript 5.x
- **Estilos:** Tailwind CSS v4 (con tema personalizado)
- **Componentes UI:** shadcn/ui (Radix UI + Tailwind)
- **Gráficos:** Recharts + SVG personalizado
- **Gestión de Estado:** Zustand
- **Formularios:** React Hook Form (opcional, algunos formularios son manejados con useState)

#### Backend
- **BaaS:** Supabase (PostgreSQL + Auth + Storage)
- **Base de Datos:** PostgreSQL 15+
- **Autenticación:** Supabase Auth (Email/Password + OAuth Google)
- **Storage:** Supabase Storage (para avatares y archivos)
- **Real-time:** Supabase Realtime (para chat y actualizaciones en vivo)

#### Infraestructura
- **Hosting:** Vercel (Next.js optimizado)
- **CI/CD:** Vercel Git integration
- **Monitoreo:** Vercel Analytics
- **Dominio:** Configuración personalizada con DNS

### 2.3 Principios Arquitectónicos

1. **Mobile-First:** Toda la interfaz está diseñada primero para móvil
2. **Server Components First:** Usar React Server Components por defecto
3. **Progressive Enhancement:** La app funciona sin JavaScript básico
4. **Offline-First:** Implementar service workers para funcionalidad offline (futuro)
5. **Security by Default:** RLS en todas las tablas, validación en cliente y servidor
6. **Performance:** Code splitting, lazy loading, optimización de imágenes

---

## 3. Estructura de Archivos

### 3.1 Árbol de Directorios

```
vladi-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raíz con fuentes y metadata
│   ├── page.tsx                  # Landing page pública
│   ├── globals.css               # Estilos globales + Tailwind config
│   │
│   ├── auth/                     # Páginas de autenticación
│   │   ├── login/page.tsx        # Login con email/phone
│   │   ├── sign-up/page.tsx      # Registro multi-paso
│   │   ├── sign-up-success/page.tsx
│   │   └── error/page.tsx
│   │
│   └── app/                      # App protegida (requiere auth)
│       ├── layout.tsx            # Layout con middleware check
│       ├── page.tsx              # Dashboard principal
│       └── onboarding/page.tsx   # Onboarding de contactos
│
├── components/
│   ├── ui/                       # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── sheet.tsx
│   │   ├── avatar.tsx
│   │   └── ... (30+ componentes)
│   │
│   └── vladi/                    # Componentes específicos de VLADI
│       ├── vladi-app.tsx         # Componente raíz de la app
│       ├── dashboard.tsx         # Dashboard principal con tabs
│       │
│       ├── home-view.tsx         # Vista Home (SOS + Timeline)
│       ├── stats-view.tsx        # Vista Estadísticas
│       ├── record-view.tsx       # Vista Registro de emociones
│       ├── chats-view.tsx        # Vista Social/Chats
│       │
│       ├── check-in-flow.tsx     # Flujo completo de registro emocional
│       ├── emotion-picker.tsx    # Selector de cuadrante
│       ├── emotion-screen.tsx    # Pantalla de selección de emoción
│       ├── intensity-slider.tsx  # Slider de intensidad (0-100)
│       ├── context-picker.tsx    # Selector de contexto
│       ├── context-sheet.tsx     # Sheet de contexto adicional
│       ├── mirror-overlay.tsx    # Overlay de confirmación espejo
│       │
│       ├── ieq-view.tsx          # Vista principal de IEQ
│       ├── ieq-panel.tsx         # Panel de métricas IEQ
│       ├── intensity-wellbeing-wave-chart.tsx  # Gráfico de ondas
│       ├── deam-radar.tsx        # Radar chart para DEAM
│       ├── metric-card.tsx       # Tarjeta de métrica individual
│       │
│       ├── social-feed.tsx       # Feed social de emociones
│       ├── groups-people-screen.tsx  # Gestión de grupos/contactos
│       ├── profile-screen.tsx    # Pantalla de perfil
│       │
│       ├── bottom-navbar.tsx     # Barra de navegación inferior
│       ├── common-header.tsx     # Header compartido
│       ├── sos-button.tsx        # Botón SOS con animación
│       └── placeholder-view.tsx  # Vista placeholder
│
├── lib/                          # Lógica de negocio y utilidades
│   ├── utils.ts                  # Utilidad cn() de tailwind-merge
│   │
│   ├── supabase/                 # Cliente Supabase
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts             # Cliente server
│   │   └── proxy.ts              # Middleware para auth
│   │
│   ├── vladi-data.ts             # Datos estáticos (matrices, emociones)
│   ├── vladi-types.ts            # Types principales
│   ├── vladi-store.ts            # Zustand store
│   │
│   ├── emotion-mapping.ts        # Mapeo emoción → valence/arousal
│   ├── ieq-calculator.ts         # Algoritmos de IEQ (DEAM score)
│   ├── deam-engine.ts            # Motor DEAM completo
│   └── emotional-state-calculator.ts  # Cálculo de estado emocional
│
├── hooks/                        # React Hooks personalizados
│   ├── use-mobile.tsx            # Detectar si es móvil
│   └── use-toast.ts              # Sistema de toasts
│
├── public/                       # Assets estáticos
│   └── images/
│       └── portada4.png          # Imagen de landing
│
├── next.config.mjs               # Configuración Next.js
├── tsconfig.json                 # Configuración TypeScript
├── package.json                  # Dependencias
├── tailwind.config.ts            # Configuración Tailwind (legacy)
└── README.md                     # Documentación básica
```

### 3.2 Convenciones de Nomenclatura

- **Componentes:** PascalCase (`EmotionPicker.tsx`)
- **Utilidades/Helpers:** camelCase (`calculateDEAMScore`)
- **Tipos/Interfaces:** PascalCase (`EmotionEntry`, `IEQData`)
- **Constantes:** UPPER_SNAKE_CASE (`EMOTION_TO_AXES`)
- **Archivos:** kebab-case (`emotion-picker.tsx`)

---

## 4. Base de Datos

### 4.1 Esquema Completo (Supabase PostgreSQL)

#### 4.1.1 Tabla `profiles`

Almacena información pública de usuarios.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can search public profiles (for adding contacts)
CREATE POLICY profiles_search_public ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### 4.1.2 Tabla `emotion_entries`

Almacena todas las entradas emocionales de los usuarios.

```sql
CREATE TABLE emotion_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Datos básicos de la emoción
  emotion TEXT NOT NULL,
  intensity INTEGER NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
  quadrant TEXT NOT NULL CHECK (quadrant IN ('green', 'yellow', 'red', 'blue')),
  
  -- Ejes calculados (modelo circumplejo)
  valence NUMERIC,
  arousal NUMERIC,
  wellbeing INTEGER,
  confidence NUMERIC DEFAULT 0.7,
  
  -- Contexto
  context TEXT,
  activity_tags TEXT[],
  company_tags TEXT[],
  custom_activity TEXT,
  custom_company TEXT,
  notes TEXT,
  
  -- Intervención
  intervention_used TEXT,
  intervention_delta INTEGER,
  
  -- Privacidad y visibilidad
  is_public BOOLEAN DEFAULT FALSE,
  privacy_group_id UUID REFERENCES privacy_groups(id) ON DELETE SET NULL,
  views_count INTEGER DEFAULT 0
);

-- Índices para mejorar performance
CREATE INDEX idx_emotion_entries_user_id ON emotion_entries(user_id);
CREATE INDEX idx_emotion_entries_created_at ON emotion_entries(created_at DESC);
CREATE INDEX idx_emotion_entries_quadrant ON emotion_entries(quadrant);
CREATE INDEX idx_emotion_entries_user_created ON emotion_entries(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE emotion_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own entries
CREATE POLICY entries_select_own ON emotion_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read public entries or entries shared with them
CREATE POLICY entries_select_shared ON emotion_entries
  FOR SELECT USING (
    is_public = true OR
    privacy_group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN contacts c ON c.id = gm.contact_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Users can insert their own entries
CREATE POLICY entries_insert_own ON emotion_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY entries_update_own ON emotion_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY entries_delete_own ON emotion_entries
  FOR DELETE USING (auth.uid() = user_id);
```

#### 4.1.3 Tabla `contacts`

Gestiona la red de contactos del usuario.

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Información del contacto
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Si el contacto también es usuario de VLADI
  is_vladi_user BOOLEAN DEFAULT FALSE,
  contact_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Estado de la conexión
  friendship_status TEXT CHECK (friendship_status IN ('pending', 'accepted', 'declined'))
);

-- Índices
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_contact_user_id ON contacts(contact_user_id);

-- RLS Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select_own ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY contacts_insert_own ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY contacts_update_own ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY contacts_delete_own ON contacts
  FOR DELETE USING (auth.uid() = user_id);
```

#### 4.1.4 Tabla `privacy_groups`

Define grupos de privacidad para compartir emociones.

```sql
CREATE TABLE privacy_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE  -- Grupos predefinidos: "Familia", "Amigos cercanos"
);

-- Índices
CREATE INDEX idx_privacy_groups_user_id ON privacy_groups(user_id);

-- RLS Policies
ALTER TABLE privacy_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_select_own ON privacy_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY groups_insert_own ON privacy_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY groups_update_own ON privacy_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY groups_delete_own ON privacy_groups
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);
```

#### 4.1.5 Tabla `group_members`

Relación muchos-a-muchos entre grupos y contactos.

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES privacy_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(group_id, contact_id)
);

-- Índices
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_contact_id ON group_members(contact_id);

-- RLS Policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_select_own ON group_members
  FOR SELECT USING (
    group_id IN (SELECT id FROM privacy_groups WHERE user_id = auth.uid())
  );

CREATE POLICY members_insert_own ON group_members
  FOR INSERT WITH CHECK (
    group_id IN (SELECT id FROM privacy_groups WHERE user_id = auth.uid())
  );

CREATE POLICY members_delete_own ON group_members
  FOR DELETE USING (
    group_id IN (SELECT id FROM privacy_groups WHERE user_id = auth.uid())
  );
```

#### 4.1.6 Tabla `friend_requests`

Gestiona solicitudes de amistad entre usuarios.

```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_user_id, to_user_id)
);

-- Índices
CREATE INDEX idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_from_user ON friend_requests(from_user_id);

-- RLS Policies
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY requests_select_related ON friend_requests
  FOR SELECT USING (auth.uid() IN (from_user_id, to_user_id));

CREATE POLICY requests_insert ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY requests_update_recipient ON friend_requests
  FOR UPDATE USING (auth.uid() = to_user_id);
```

#### 4.1.7 Tabla `emotion_comments`

Comentarios en entradas emocionales compartidas.

```sql
CREATE TABLE emotion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES emotion_entries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT,
  is_audio BOOLEAN DEFAULT FALSE,
  audio_url TEXT
);

-- Índices
CREATE INDEX idx_emotion_comments_entry_id ON emotion_comments(entry_id);
CREATE INDEX idx_emotion_comments_author_id ON emotion_comments(author_id);

-- RLS Policies
ALTER TABLE emotion_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_select_related ON emotion_comments
  FOR SELECT USING (
    entry_id IN (
      SELECT id FROM emotion_entries 
      WHERE user_id = auth.uid() OR is_public = true
    )
  );

CREATE POLICY comments_insert_own ON emotion_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY comments_delete_own ON emotion_comments
  FOR DELETE USING (auth.uid() = author_id);
```

#### 4.1.8 Tabla `emotion_views`

Tracking de vistas en entradas compartidas.

```sql
CREATE TABLE emotion_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES emotion_entries(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entry_id, viewer_id)
);

-- Índices
CREATE INDEX idx_emotion_views_entry_id ON emotion_views(entry_id);

-- RLS Policies
ALTER TABLE emotion_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY views_insert ON emotion_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY views_select_own ON emotion_views
  FOR SELECT USING (auth.uid() = viewer_id);
```

### 4.2 Diagrama de Relaciones

```
profiles
   ├─── emotion_entries (1:N)
   │       ├─── emotion_comments (1:N)
   │       └─── emotion_views (1:N)
   │
   ├─── contacts (1:N)
   │       └─── group_members (1:N)
   │
   ├─── privacy_groups (1:N)
   │       ├─── group_members (1:N)
   │       └─── emotion_entries (1:N)
   │
   └─── friend_requests (1:N, bidireccional)
```

### 4.3 Migraciones y Versionado

Las migraciones de base de datos se ejecutan mediante scripts SQL en la carpeta `scripts/`:

```
scripts/
├── 001_create_profiles.sql
├── 002_create_emotion_entries.sql
├── 003_create_contacts.sql
├── 004_create_privacy_groups.sql
├── 005_create_group_members.sql
├── 006_create_friend_requests.sql
├── 007_create_emotion_comments.sql
└── 008_create_emotion_views.sql
```

---

## 5. Modelo DEAM IEQ

### 5.1 Fundamentos Teóricos

El modelo DEAM IEQ (Distributed Emotion Analysis Model - Inteligencia Emocional Cuantificada) se basa en:

1. **Modelo Circumplejo de Russell (1980):** Representa las emociones en un espacio 2D con dos ejes:
   - **Valencia (Valence):** De negativo (-1) a positivo (+1)
   - **Arousal (Activación):** De baja (-1) a alta (+1)

2. **Teoría de la Granularidad Emocional (Barrett, 2004):** La capacidad de diferenciar entre emociones específicas (vs. generales) está correlacionada con mejor regulación emocional.

3. **Modelo de Conciencia Emocional (Lane, 1990):** La conciencia emocional se desarrolla en niveles, desde sensaciones corporales hasta comprensión compleja.

### 5.2 Arquitectura del Modelo

```
┌─────────────────────────────────────────────────────────┐
│                    MODELO DEAM IEQ                      │
│                                                         │
│  Input: Registros emocionales del usuario              │
│  Output: Score IEQ (0-100) + 5 submétricas             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  1. GRANULARIDAD (G) - 20%                        │ │
│  │     Mide diversidad y especificidad emocional     │ │
│  │     - Entropía de etiquetas emocionales           │ │
│  │     - Entropía de familias emocionales            │ │
│  │     - Penalización por repetición excesiva        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  2. COHERENCIA (C) - 20%                          │ │
│  │     Mide consistencia en intensidad               │ │
│  │     - Varianza de intensidad emocional            │ │
│  │     - Estabilidad de patrones                     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  3. ADAPTABILIDAD (A) - 20%                       │ │
│  │     Mide rango emocional                          │ │
│  │     - Rango de valencia (positivo/negativo)       │ │
│  │     - Capacidad de experimentar variedad          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  4. INERCIA (Ie) - 20%                            │ │
│  │     Mide velocidad de recuperación emocional      │ │
│  │     - Tiempo promedio de recuperación             │ │
│  │     - Resiliencia ante emociones negativas        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  5. PRECISIÓN (P) - 20%                           │ │
│  │     Mide regularidad de registros                 │ │
│  │     - Frecuencia de check-ins                     │ │
│  │     - Consistencia temporal                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  IEQ Score = 0.2·G + 0.2·C + 0.2·A + 0.2·Ie + 0.2·P   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Cuadrantes Emocionales

VLADI organiza las emociones en 4 cuadrantes según el modelo circumplejo:

```
                  Alta Activación (Arousal > 0)
                           │
                           │
        ROJO (Tensión)     │      AMARILLO (Energía)
         Negativo          │         Positivo
         Alta activación   │         Alta activación
                           │
Valencia ─────────────────┼──────────────────── Valencia
Negativa                   0                  Positiva
                           │
         AZUL (Sin ánimo)  │      VERDE (Calma)
         Negativo          │         Positivo
         Baja activación   │         Baja activación
                           │
                  Baja Activación (Arousal < 0)
```

#### Cuadrante VERDE (Calma)
- **Valencia:** Positiva (> -0.15)
- **Arousal:** Bajo (≤ -0.15)
- **Emociones:** Tranquilo, Relajado, Sereno, Pacífico, A gusto
- **Color:** `#94B22E`
- **Descripción:** "Hoy, te has sentido mayormente calmado y tranquilo."

#### Cuadrante AMARILLO (Energía)
- **Valencia:** Positiva (≥ -0.15)
- **Arousal:** Alto (> -0.15)
- **Emociones:** Feliz, Animado, Entusiasta, Motivado, Emocionado
- **Color:** `#E6B04F`
- **Descripción:** "Hoy, te has sentido activo y con buen ánimo."

#### Cuadrante ROJO (Tensión)
- **Valencia:** Negativa (< -0.15)
- **Arousal:** Alto (> -0.15)
- **Emociones:** Ansioso, Estresado, Frustrado, Enfadado, Tenso
- **Color:** `#E6584F`
- **Descripción:** "Hoy, te has sentido algo tenso y bajo presión."

#### Cuadrante AZUL (Sin ánimo)
- **Valencia:** Negativa (< -0.15)
- **Arousal:** Bajo (≤ -0.15)
- **Emociones:** Triste, Desanimado, Cansado, Abatido, Deprimido
- **Color:** `#466D91`
- **Descripción:** "Hoy, te has sentido con poca energía y algo desanimado."

### 5.4 Catálogo de Emociones

VLADI incluye un catálogo de **100 emociones** mapeadas a coordenadas (valence, arousal). Cada emoción tiene:

```typescript
interface EmotionMapping {
  emotion: string
  valence: number    // -1 (muy negativo) a +1 (muy positivo)
  arousal: number    // -1 (muy bajo) a +1 (muy alto)
  quadrant: 'green' | 'yellow' | 'red' | 'blue'
}
```

**Ejemplos:**
- `Extasiado: { valence: 1.0, arousal: 0.9 }` → AMARILLO
- `Aterrorizado: { valence: -0.9, arousal: 0.9 }` → ROJO
- `Deprimido: { valence: -0.8, arousal: -0.7 }` → AZUL
- `Sereno: { valence: 0.7, arousal: -0.6 }` → VERDE

El mapeo completo está en `lib/emotion-mapping.ts`.

---

## 6. Flujos de Usuario

### 6.1 Flujo de Autenticación

```
┌──────────────┐
│ Landing Page │
└──────┬───────┘
       │
       ├──> [Iniciar Sesión]
       │         │
       │         v
       │    ┌───────────────┐
       │    │ Login Screen  │
       │    ├───────────────┤
       │    │ 1. Email/Phone│
       │    │ 2. Password   │
       │    └───────┬───────┘
       │            │
       │            v
       │    [Supabase Auth]
       │            │
       │            ├──> Success ──> [Onboarding o Dashboard]
       │            └──> Error ──> Mostrar mensaje
       │
       └──> [Registrarse]
                 │
                 v
            ┌────────────────┐
            │ Sign Up Screen │
            ├────────────────┤
            │ 1. Email       │
            │ 2. Teléfono    │
            │ 3. Password    │
            └────────┬───────┘
                     │
                     v
            [Crear usuario Supabase]
                     │
                     ├──> Success ──> [Email verification]
                     │                      │
                     │                      v
                     │              [Onboarding de contactos]
                     │                      │
                     │                      v
                     │              [Dashboard principal]
                     │
                     └──> Error ──> Mostrar mensaje
```

### 6.2 Flujo de Registro Emocional (Check-in)

```
┌─────────────────┐
│ Dashboard/Home  │
│                 │
│  [Botón +]      │ ◄─── Usuario toca el botón "+" central
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────┐
│ EmotionPicker                           │
│                                         │
│  ┌─────────┐  ┌─────────┐             │
│  │ VERDE   │  │ AMARILLO│             │
│  │ Calma   │  │ Energía │             │
│  └─────────┘  └─────────┘             │
│                                         │
│  ┌─────────┐  ┌─────────┐             │
│  │  AZUL   │  │  ROJO   │             │
│  │Sin ánimo│  │ Tensión │             │
│  └─────────┘  └─────────┘             │
└────────┬────────────────────────────────┘
         │
         v  [Usuario selecciona cuadrante]
         │
┌────────┴────────────────────────────────┐
│ EmotionScreen (full screen)             │
│                                         │
│  [Color de fondo según cuadrante]       │
│                                         │
│  Lista de emociones del cuadrante:      │
│  • Tranquilo                            │
│  • Relajado                             │
│  • Sereno                               │
│  • Calmado                              │
│  • ...                                  │
│                                         │
│  [Botón Volver]                         │
└────────┬────────────────────────────────┘
         │
         v  [Usuario selecciona emoción específica]
         │
┌────────┴────────────────────────────────┐
│ CheckInFlow - Paso 1: Intensidad        │
│                                         │
│  "¿Qué tan intenso es?"                 │
│  [────●─────────────────────] 0-100     │
│                                         │
│  [Continuar]                            │
└────────┬────────────────────────────────┘
         │
         v  [Usuario ajusta intensidad]
         │
┌────────┴────────────────────────────────┐
│ CheckInFlow - Paso 2: Contexto          │
│                                         │
│  "¿Qué estabas haciendo?"               │
│  [Trabajando] [Descansando] [Deportes]  │
│  [+ Personalizar]                       │
│                                         │
│  "¿Con quién estabas?"                  │
│  [Solo/a] [Familia] [Amigos] [Pareja]   │
│  [+ Personalizar]                       │
│                                         │
│  [Añadir nota (opcional)]               │
│                                         │
│  [Continuar]                            │
└────────┬────────────────────────────────┘
         │
         v  [Usuario completa contexto]
         │
┌────────┴────────────────────────────────┐
│ MirrorOverlay                           │
│                                         │
│  "Te has sentido [EMOCIÓN]              │
│   de forma [INTENSIDAD]"                │
│                                         │
│  [Contexto: ...]                        │
│                                         │
│  [¿Es correcto?]                        │
│  [Sí, confirmar]  [No, editar]          │
└────────┬────────────────────────────────┘
         │
         v  [Confirmar]
         │
┌────────┴────────────────────────────────┐
│ Guardar en Base de Datos                │
│                                         │
│  INSERT INTO emotion_entries (...)      │
│                                         │
│  • Calcular valence/arousal             │
│  • Calcular wellbeing                   │
│  • Timestamp automático                 │
└────────┬────────────────────────────────┘
         │
         v
┌────────┴────────────────────────────────┐
│ Animación de éxito                      │
│                                         │
│  [Círculo se expande con color]         │
│                                         │
│  "¡Registrado!"                         │
└────────┬────────────────────────────────┘
         │
         v
┌────────┴────────────────────────────────┐
│ Volver a Dashboard                      │
│                                         │
│  • Actualizar timeline                  │
│  • Recalcular métricas IEQ              │
│  • Mostrar en feed social (si público)  │
└─────────────────────────────────────────┘
```

### 6.3 Flujo de Visualización de IEQ

```
┌──────────────┐
│ Dashboard    │
│              │
│ [Tab Stats]  │ ◄─── Usuario toca pestaña "Estadísticas"
└──────┬───────┘
       │
       v
┌──────┴───────────────────────────────────┐
│ StatsView                                │
│                                          │
│  Header:                                 │
│  [Selector periodo: 7 días / 14 / 30]   │
│                                          │
│  [Ver detalles IEQ] ◄───────────────────┼── Usuario toca
└──────┬───────────────────────────────────┘
       │
       v
┌──────┴───────────────────────────────────┐
│ IEQView (pantalla completa)              │
│                                          │
│  Tabs:                                   │
│  [Tu Panel IEQ] [Entrena] [Mejora]       │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ IEQPanel (scroll vertical)       │   │
│  │                                  │   │
│  │  1. HEADER                       │   │
│  │     "Tu Panel IEQ"               │   │
│  │     [Selector: 30 días ▼]        │   │
│  │                                  │   │
│  │  2. ESTADO EMOCIONAL (Grid 2x1)  │   │
│  │     ┌────────────┬─────────┐    │   │
│  │     │ Círculo    │ DEAM    │    │   │
│  │     │ Estado:    │ Score   │    │   │
│  │     │ "En calma" │ 79/100  │    │   │
│  │     │            │ +19% ▲  │    │   │
│  │     ├────────────┤         │    │   │
│  │     │            │ Check-  │    │   │
│  │     │            │ ins:    │    │   │
│  │     │            │ 140     │    │   │
│  │     │            │ -10% ▼  │    │   │
│  │     └────────────┴─────────┘    │   │
│  │                                  │   │
│  │  3. INTENSIDAD Y BIENESTAR       │   │
│  │     [Gráfico de ondas 2D]        │   │
│  │     Media intensidad: 59/100     │   │
│  │     Media bienestar: 47/100      │   │
│  │     Texto interpretativo          │   │
│  │                                  │   │
│  │  4. GRANULARIDAD                 │   │
│  │     "+22% variedad emocional"    │   │
│  │     [Dropdown: Emociones más     │   │
│  │      registradas]                │   │
│  │     • Frustrado (34 veces)       │   │
│  │     • Animado (15 veces)         │   │
│  │     • Motivado (25 veces)        │   │
│  │     ...                          │   │
│  │                                  │   │
│  │  5. CONCIENCIA EMOCIONAL         │   │
│  │     [Radar chart 5 dimensiones]  │   │
│  │     Score: 74/100 (-1.5h)        │   │
│  │     - Contexto: 82               │   │
│  │     - Cuerpo: 65                 │   │
│  │     - Tiempo: 90                 │   │
│  │     - Seguridad: 70              │   │
│  │                                  │   │
│  │  6. INERCIA                      │   │
│  │     "Recuperación promedio:      │   │
│  │      3.5h (-1.5h vs antes)"      │   │
│  │     "Última semana: 1h 10min"    │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Botón: Volver]                         │
└──────────────────────────────────────────┘
```

### 6.4 Flujo de Social/Compartir

```
┌──────────────┐
│ Dashboard    │
│              │
│ [Registro    │
│  emocional]  │
└──────┬───────┘
       │
       v
┌──────┴────────────────────────────────┐
│ ContextSheet (después de confirmar)   │
│                                       │
│  "¿Quieres compartirlo?"              │
│                                       │
│  ○ Solo yo                            │
│  ○ Público (todos)                    │
│  ○ Grupos específicos:                │
│     ☑ Familia                         │
│     ☑ Amigos cercanos                 │
│     ☐ Compañeros de trabajo           │
│                                       │
│  [Publicar]  [Cancelar]               │
└──────┬────────────────────────────────┘
       │
       v  [Usuario selecciona privacidad]
       │
┌──────┴────────────────────────────────┐
│ Guardar con configuración privacidad  │
│                                       │
│  UPDATE emotion_entries SET           │
│    is_public = [true/false]           │
│    privacy_group_id = [id]            │
└──────┬────────────────────────────────┘
       │
       v
┌──────┴────────────────────────────────┐
│ Publicar en Feed Social               │
│                                       │
│  • Aparece en SocialFeed              │
│  • Notificar a contactos relevantes   │
│  • Permitir comentarios               │
└───────────────────────────────────────┘
```

---

## 7. Componentes Principales

### 7.1 Componente Raíz: `VladiApp`

**Ubicación:** `components/vladi/vladi-app.tsx`

**Responsabilidad:** Orquestador principal de la aplicación. Gestiona navegación entre vistas.

**Props:**
```typescript
interface VladiAppProps {
  userId: string
  userProfile: Profile
}
```

**Estado:**
```typescript
const [activeView, setActiveView] = useState<'home' | 'stats' | 'record' | 'chats'>('home')
const [showProfile, setShowProfile] = useState(false)
const [showGroups, setShowGroups] = useState(false)
```

**Estructura:**
```tsx
<div className="h-screen flex flex-col">
  {/* Header */}
  {activeView !== 'record' && (
    <CommonHeader 
      userProfile={userProfile} 
      onAvatarClick={() => setShowProfile(true)} 
    />
  )}

  {/* Main Content */}
  <main className="flex-1 overflow-y-auto">
    {activeView === 'home' && <HomeView userId={userId} userProfile={userProfile} />}
    {activeView === 'stats' && <StatsView userId={userId} userProfile={userProfile} />}
    {activeView === 'record' && <RecordView userId={userId} onComplete={() => setActiveView('home')} />}
    {activeView === 'chats' && <ChatsView userId={userId} />}
  </main>

  {/* Bottom Navigation */}
  <BottomNavbar 
    activeTab={activeView} 
    onTabChange={setActiveView} 
    userProfile={userProfile} 
  />

  {/* Overlays */}
  {showProfile && <ProfileScreen userProfile={userProfile} onClose={() => setShowProfile(false)} />}
  {showGroups && <GroupsPeopleScreen userId={userId} onClose={() => setShowGroups(false)} />}
</div>
```

### 7.2 Componente de Navegación: `BottomNavbar`

**Ubicación:** `components/vladi/bottom-navbar.tsx`

**Responsabilidad:** Barra de navegación inferior con 5 tabs.

**Props:**
```typescript
interface BottomNavbarProps {
  activeTab: 'home' | 'stats' | 'record' | 'chats'
  onTabChange: (tab: string) => void
  userProfile: Profile
}
```

**Estructura:**
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
  <div className="flex items-center justify-around h-16">
    {/* Home */}
    <button onClick={() => onTabChange('home')}>
      <Home className={activeTab === 'home' ? 'text-primary' : 'text-muted-foreground'} />
    </button>

    {/* Stats */}
    <button onClick={() => onTabChange('stats')}>
      <BarChart3 className={...} />
    </button>

    {/* Record (centro, más grande) */}
    <button className="w-14 h-14 rounded-full bg-primary" onClick={() => onTabChange('record')}>
      <Plus className="text-white" size={32} />
    </button>

    {/* Chats */}
    <button onClick={() => onTabChange('chats')}>
      <MessageCircle className={...} />
    </button>

    {/* Profile */}
    <Avatar>
      <AvatarImage src={userProfile.avatar_url || "/placeholder.svg"} />
      <AvatarFallback>{userProfile.display_name?.[0]}</AvatarFallback>
    </Avatar>
  </div>
</nav>
```

### 7.3 Vista Home: `HomeView`

**Ubicación:** `components/vladi/home-view.tsx`

**Responsabilidad:** Vista principal con timeline emocional y botón SOS.

**Componentes hijos:**
- `CommonHeader`
- `SOSButton`
- Timeline de emociones recientes (últimas 24 horas)

**Lógica:**
```typescript
// Fetch recent emotions
const [recentEmotions, setRecentEmotions] = useState<EmotionEntry[]>([])

useEffect(() => {
  const fetchRecent = async () => {
    const { data } = await supabase
      .from('emotion_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
    
    setRecentEmotions(data || [])
  }
  
  fetchRecent()
}, [userId])
```

### 7.4 Vista Estadísticas: `StatsView`

**Ubicación:** `components/vladi/stats-view.tsx`

**Responsabilidad:** Mostrar resumen de métricas y acceso a IEQView detallado.

**Componentes hijos:**
- `MetricCard` (para cada métrica)
- Selector de periodo
- Botón "Ver detalles IEQ"

**Métricas mostradas:**
```typescript
interface MetricsDisplay {
  deamScore: number
  emotionalState: EmotionalStateResult
  checkInsCount: number
  streakDays: number
  topEmotion: string
}
```

### 7.5 Vista Registro: `RecordView`

**Ubicación:** `components/vladi/record-view.tsx`

**Responsabilidad:** Iniciar flujo de check-in emocional.

**Flujo:**
```typescript
const [step, setStep] = useState<'picker' | 'screen' | 'flow' | 'mirror'>('picker')
const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null)
const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
const [emotionData, setEmotionData] = useState<EmotionData | null>(null)

// Step 1: EmotionPicker
<EmotionPicker onSelect={(q) => { setSelectedQuadrant(q); setStep('screen') }} />

// Step 2: EmotionScreen
<EmotionScreen quadrant={selectedQuadrant} onConfirm={(e) => { setSelectedEmotion(e); setStep('flow') }} />

// Step 3: CheckInFlow
<CheckInFlow emotion={selectedEmotion} onComplete={(data) => { setEmotionData(data); setStep('mirror') }} />

// Step 4: MirrorOverlay
<MirrorOverlay emotionData={emotionData} onConfirm={handleSave} />
```

### 7.6 Panel IEQ: `IEQPanel`

**Ubicación:** `components/vladi/ieq-panel.tsx`

**Responsabilidad:** Visualizar todas las métricas DEAM IEQ en una sola vista scrolleable.

**Secciones:**
1. Header con selector de periodo
2. Grid de Estado Emocional + DEAM Score + Check-ins
3. Gráfico de Intensidad y Bienestar (ondas 2D)
4. Granularidad con dropdown de emociones
5. Radar de Conciencia Emocional
6. Inercia con tiempo de recuperación

**Cálculo de métricas:**
```typescript
const [entries, setEntries] = useState<EmotionEntry[]>([])
const [periodDays, setPeriodDays] = useState(30)

useEffect(() => {
  const calculateMetrics = async () => {
    // Fetch entries del periodo
    const { data } = await supabase
      .from('emotion_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    setEntries(data || [])

    // Calcular métricas
    const emotionalState = calculateEmotionalState(data, periodDays)
    const { score, delta } = calculateDEAMScore(data, periodDays)
    const intensityWellbeing = calculateIntensityWellbeing(data)
    const granularity = calculateGranularity(data, previousPeriodData)
    const awareness = calculateEmotionalAwareness(data, previousPeriodData, periodDays)
    const inertia = calculateInertiaWithWeekly(data)

    // Update state
    setMetrics({ emotionalState, deamScore: score, ... })
  }

  calculateMetrics()
}, [userId, periodDays])
```

### 7.7 Gráfico de Ondas: `IntensityWellbeingWaveChart`

**Ubicación:** `components/vladi/intensity-wellbeing-wave-chart.tsx`

**Responsabilidad:** Visualizar distribución de emociones en espacio 2D (intensidad x bienestar).

**Lógica:**
```typescript
// Agrupar emociones por familia de color
const emotionsByColor = groupBy(entries, entry => getColorFamily(entry.emotion))

// Para cada familia, generar distribución tipo onda
const waves = Object.entries(emotionsByColor).map(([color, emotions]) => {
  const centerWellbeing = mean(emotions.map(e => e.wellbeing))
  const centerIntensity = mean(emotions.map(e => e.intensity))
  
  // Generar puntos de la onda usando distribución gaussiana 1D
  const wavePoints = generateWavePoints(centerWellbeing, centerIntensity, emotions.length)
  
  return { color, points: wavePoints }
})

// Renderizar SVG
return (
  <svg viewBox="0 0 110 110" className="w-full">
    {/* Ejes */}
    <line x1="10" y1="100" x2="110" y2="100" stroke="#ccc" />
    <line x1="10" y1="0" x2="10" y2="100" stroke="#ccc" />
    
    {/* Ondas */}
    {waves.map(wave => (
      <path
        d={generateWavePath(wave.points)}
        fill={wave.color}
        opacity="0.6"
      />
    ))}
    
    {/* Labels */}
    <text x="55" y="115">Bienestar →</text>
    <text x="0" y="50" transform="rotate(-90 0 50)">Intensidad →</text>
  </svg>
)
```

### 7.8 Feed Social: `SocialFeed`

**Ubicación:** `components/vladi/social-feed.tsx`

**Responsabilidad:** Mostrar emociones compartidas por contactos.

**Lógica:**
```typescript
const [feedItems, setFeedItems] = useState<FeedItem[]>([])

useEffect(() => {
  const fetchFeed = async () => {
    // Obtener IDs de contactos
    const { data: contacts } = await supabase
      .from('contacts')
      .select('contact_user_id')
      .eq('user_id', userId)
      .eq('is_vladi_user', true)

    const contactIds = contacts.map(c => c.contact_user_id)

    // Fetch emociones públicas o compartidas con el usuario
    const { data: entries } = await supabase
      .from('emotion_entries')
      .select(`
        *,
        profiles:user_id (display_name, avatar_url)
      `)
      .or(`is_public.eq.true,user_id.in.(${contactIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(50)

    setFeedItems(entries)
  }

  fetchFeed()

  // Suscribirse a cambios en tiempo real
  const subscription = supabase
    .channel('public-emotions')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'emotion_entries',
      filter: 'is_public=eq.true'
    }, (payload) => {
      setFeedItems(prev => [payload.new, ...prev])
    })
    .subscribe()

  return () => subscription.unsubscribe()
}, [userId])
```

---

## 8. Lógica de Negocio

### 8.1 Calculadora IEQ: `ieq-calculator.ts`

**Ubicación:** `lib/ieq-calculator.ts`

**Funciones principales:**

#### 8.1.1 `calculateEmotionalState()`

Calcula el estado emocional predominante (cuadrante) usando ponderación temporal.

```typescript
export function calculateEmotionalState(
  entries: EmotionEntry[], 
  timeRangeDays: number
): EmotionalStateResult | null {
  if (entries.length < 3) return null

  const now = new Date()
  const tau = timeRangeDays === 7 ? 3 : timeRangeDays === 14 ? 6 : 10  // Constante temporal

  let sumValence = 0
  let sumArousal = 0
  let sumWeights = 0

  entries.forEach(entry => {
    // Peso temporal exponencial
    const ageDays = (now.getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    const wTime = Math.exp(-ageDays / tau)

    // Peso de confianza
    const confidence = entry.confidence || 0.7
    const weight = wTime * (0.7 + 0.3 * confidence)

    // Acumular
    sumValence += entry.valence * weight
    sumArousal += entry.arousal * weight
    sumWeights += weight
  })

  // Promedios ponderados
  const V = sumValence / sumWeights
  const A = sumArousal / sumWeights

  // Determinar cuadrante
  const Tv = -0.15  // Umbral de valencia
  const Ta = -0.15  // Umbral de arousal

  let category: EmotionalCategory
  if (A <= Ta && V >= Tv) category = 'en calma'
  else if (A <= Ta && V < Tv) category = 'sin ánimo'
  else if (A > Ta && V >= Tv) category = 'con energía'
  else category = 'en tensión'

  // Calcular estabilidad (inversa de varianza)
  const variance = calculateVariance(entries.map(e => [e.valence, e.arousal]))
  const stability = 1 - Math.min(variance, 1)

  return {
    category,
    valence: V,
    arousal: A,
    stability,
    nEvents: entries.length,
    description: CATEGORY_DESCRIPTIONS[category],
    color: CATEGORY_COLORS[category]
  }
}
```

#### 8.1.2 `calculateDEAMScore()`

Calcula el score DEAM IEQ (0-100) a partir de las 5 submétricas.

```typescript
export function calculateDEAMScore(
  entries: EmotionEntry[], 
  periodDays: number
): { score: number, delta: number } {
  if (entries.length < 4) return { score: 0, delta: 0 }

  // 1. Granularidad (G)
  const emotionSet = new Set(entries.map(e => e.emotion))
  const G = Math.min(emotionSet.size / 10, 1)

  // 2. Coherencia (C)
  const avgIntensity = mean(entries.map(e => e.intensity))
  const variance = calculateVariance(entries.map(e => e.intensity))
  const C = 1 - Math.min(Math.sqrt(variance) / 100, 1)

  // 3. Adaptabilidad (A)
  const valenceRange = max(entries.map(e => e.valence)) - min(entries.map(e => e.valence))
  const A = Math.min(valenceRange / 2, 1)

  // 4. Inercia (Ie)
  const inertiaHours = calculateInertia(entries)
  const Ie = Math.max(0, 1 - inertiaHours / 24)  // Normalizar a 0-1

  // 5. Precisión (P)
  const P = Math.min(entries.length / periodDays, 1)

  // Combinar con pesos iguales
  const scoreNorm = 0.2 * G + 0.2 * C + 0.2 * A + 0.2 * Ie + 0.2 * P
  const score = Math.round(scoreNorm * 100)

  // Calcular delta vs periodo anterior (mock por ahora)
  const delta = Math.round(Math.random() * 30 - 5)

  return { score, delta }
}
```

#### 8.1.3 `calculateInertia()`

Calcula el tiempo promedio de recuperación emocional (en horas).

```typescript
export function calculateInertia(entries: EmotionEntry[]): number {
  // Filtrar entradas con valencia negativa
  const negativeEntries = entries.filter(e => {
    const valence = e.valence ?? getEmotionAxes(e.emotion).valence
    return valence < -0.3
  })

  if (negativeEntries.length === 0) return 0

  let totalRecoveryHours = 0
  let recoveryCount = 0

  for (const negEntry of negativeEntries) {
    const negTime = new Date(negEntry.timestamp)

    // Buscar siguiente entrada positiva
    const nextPositive = entries.find(e => {
      const eTime = new Date(e.timestamp)
      const valence = e.valence ?? getEmotionAxes(e.emotion).valence
      return eTime > negTime && valence > 0.3
    })

    if (nextPositive) {
      const posTime = new Date(nextPositive.timestamp)
      const hours = (posTime.getTime() - negTime.getTime()) / (1000 * 60 * 60)
      totalRecoveryHours += hours
      recoveryCount++
    }
  }

  return recoveryCount > 0 ? totalRecoveryHours / recoveryCount : 0
}
```

#### 8.1.4 `calculateIntensityWellbeing()`

Genera datos para el gráfico de intensidad vs bienestar.

```typescript
export function calculateIntensityWellbeing(entries: EmotionEntry[]): IntensityWellbeingData {
  if (entries.length === 0) {
    return {
      meanIntensity: 0,
      meanWellbeing: 50,
      distributions: [],
      interpretationText: 'Aún no hay suficientes registros.'
    }
  }

  // Transformar a scores 0-100
  const distributions = entries.map(entry => {
    const intensityScore = entry.intensity  // Ya está en 0-100
    const valence = entry.valence ?? getEmotionAxes(entry.emotion).valence
    const wellbeingScore = Math.round((valence + 1) * 50)  // -1..+1 → 0..100

    // Determinar color según cuadrante
    const arousal = entry.arousal ?? getEmotionAxes(entry.emotion).arousal
    const color = getQuadrantColor(valence, arousal)

    return {
      emotion: entry.emotion,
      intensity: intensityScore,
      wellbeing: wellbeingScore,
      color
    }
  })

  // Calcular medias
  const meanIntensity = Math.round(mean(distributions.map(d => d.intensity)))
  const meanWellbeing = Math.round(mean(distributions.map(d => d.wellbeing)))

  // Generar texto interpretativo
  const intensityVariance = calculateVariance(distributions.map(d => d.intensity))
  const wellbeingVariance = calculateVariance(distributions.map(d => d.wellbeing))

  let interpretationText = 'Tus emociones se mantienen estables en bienestar y con ligeros picos de intensidad.'
  
  if (intensityVariance > 400 && wellbeingVariance < 200) {
    interpretationText = 'Tus emociones muestran variaciones en intensidad, manteniendo un bienestar estable.'
  } else if (intensityVariance < 200 && wellbeingVariance > 400) {
    interpretationText = 'Tus emociones presentan variaciones en bienestar, con intensidad relativamente constante.'
  } else if (intensityVariance > 400 && wellbeingVariance > 400) {
    interpretationText = 'Tus emociones muestran variabilidad tanto en intensidad como en bienestar.'
  }

  return {
    meanIntensity,
    meanWellbeing,
    distributions,
    interpretationText
  }
}
```

#### 8.1.5 `calculateGranularity()`

Mide la granularidad emocional usando entropía de Shannon.

```typescript
export function calculateGranularity(
  currentEntries: EmotionEntry[], 
  previousEntries: EmotionEntry[]
): GranularityData {
  // Calcular entropía normalizada de etiquetas
  const labelCounts = countBy(currentEntries, e => e.emotion)
  const total = currentEntries.length
  
  let H_labels = 0
  Object.values(labelCounts).forEach(count => {
    const p = count / total
    H_labels -= p * Math.log(p)
  })
  
  const Hmax_labels = Math.log(Object.keys(labelCounts).length)
  const Hn_labels = H_labels / Hmax_labels

  // Calcular entropía de familias (cuadrantes)
  const familyCounts = countBy(currentEntries, e => getEmotionFamily(e.emotion))
  
  let H_fam = 0
  Object.values(familyCounts).forEach(count => {
    const p = count / total
    H_fam -= p * Math.log(p)
  })
  
  const Hmax_fam = Math.log(Object.keys(familyCounts).length)
  const Hn_fam = H_fam / Hmax_fam

  // Penalizar repetición excesiva de una emoción
  const p_top = Math.max(...Object.values(labelCounts)) / total
  const repeat_penalty = Math.max(0, (p_top - 0.35) / (1 - 0.35))

  // Granularidad final
  const G_norm = (0.6 * Hn_labels + 0.4 * Hn_fam) * (1 - 0.35 * repeat_penalty)

  // Calcular delta con periodo anterior
  const previousG = calculateGranularityForPeriod(previousEntries).norm
  const deltaPct = ((G_norm - previousG) / Math.max(previousG, 0.01)) * 100

  // Determinar trend
  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (deltaPct >= 5) trend = 'up'
  else if (deltaPct <= -5) trend = 'down'

  // Top emociones
  const topEmotions = Object.entries(labelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }))

  return {
    granularityNorm: G_norm,
    deltaPct: Math.round(deltaPct),
    trend,
    topEmotions,
    newEmotions: [],  // Implementar
    families: {},     // Implementar
    interpretationText: generateGranularityText(trend),
    trendBadgeText: `${deltaPct >= 0 ? '+' : ''}${Math.round(deltaPct)}% variedad emocional funcional`
  }
}
```

#### 8.1.6 `calculateEmotionalAwareness()`

Calcula el score de conciencia emocional (CE) con 5 subdimensiones.

```typescript
export function calculateEmotionalAwareness(
  currentEntries: EmotionEntry[], 
  previousEntries: EmotionEntry[], 
  periodDays: number
): EmotionalAwarenessData {
  const minimumCheckins = periodDays <= 7 ? 3 : periodDays <= 14 ? 4 : 5

  if (currentEntries.length < minimumCheckins) {
    return {
      ceScore: 0,
      deltaPoints: 0,
      trend: 'stable',
      subscores: { CC: 0, CB: 0, CT: 0, MC: 0, CEe: 0 },
      insights: [],
      interpretationText: 'Aún no hay suficientes registros.',
      nCheckins: currentEntries.length
    }
  }

  const now = new Date()
  const tau = periodDays <= 7 ? 3 : periodDays <= 14 ? 6 : 10

  // Calcular sub-scores para cada entrada con peso temporal
  const scores = currentEntries.map(entry => {
    const ageDays = (now.getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    const w = Math.exp(-ageDays / tau)

    const CC = calculateContextualAwareness(entry)    // 0-100
    const CB = calculateBodyAwareness(entry)          // 0-100
    const CT = calculateTemporalAwareness(entry)      // 0-100
    const MC = calculateMetaAwareness(entry)          // 0-100
    const CEe = calculateElaborativeAwareness(entry)  // 0-100

    const CE_event = 0.25 * CC + 0.2 * CB + 0.2 * CT + 0.25 * MC + 0.1 * CEe

    return { w, CC, CB, CT, MC, CEe, CE_event }
  })

  const sumWeights = sum(scores.map(s => s.w))

  // Promedios ponderados
  const ceScore = Math.round(sum(scores.map(s => s.CE_event * s.w)) / sumWeights)
  const subscores = {
    CC: Math.round(sum(scores.map(s => s.CC * s.w)) / sumWeights),
    CB: Math.round(sum(scores.map(s => s.CB * s.w)) / sumWeights),
    CT: Math.round(sum(scores.map(s => s.CT * s.w)) / sumWeights),
    MC: Math.round(sum(scores.map(s => s.MC * s.w)) / sumWeights),
    CEe: Math.round(sum(scores.map(s => s.CEe * s.w)) / sumWeights)
  }

  // Calcular delta con periodo anterior
  const cePrevious = calculateCEForPeriod(previousEntries, periodDays)
  const deltaPoints = ceScore - cePrevious

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (deltaPoints >= 3) trend = 'up'
  else if (deltaPoints <= -3) trend = 'down'

  return {
    ceScore,
    deltaPoints,
    trend,
    subscores,
    insights: generateAwarenessInsights(currentEntries, scores),
    interpretationText: generateAwarenessText(trend),
    nCheckins: currentEntries.length
  }
}

// Sub-funciones para calcular cada dimensión de CE

function calculateContextualAwareness(entry: EmotionEntry): number {
  let score = 0
  if (entry.activity_tags && entry.activity_tags.length > 0) score += 40
  if (entry.company_tags && entry.company_tags.length > 0) score += 40
  if (entry.notes && entry.notes.trim().length > 0) score += 20
  return Math.min(score, 100)
}

function calculateBodyAwareness(entry: EmotionEntry): number {
  // Por ahora mock, implementar cuando se añadan señales corporales
  return entry.body_signals && entry.body_signals.length > 0 ? 80 : 30
}

function calculateTemporalAwareness(entry: EmotionEntry): number {
  // Evaluar si el usuario especificó tiempo relativo
  if (entry.time_reference) {
    if (entry.time_reference === 'just_now') return 100
    if (entry.time_reference === 'few_hours_ago') return 80
    if (entry.time_reference === 'today') return 60
    return 40
  }
  return 50  // Default si registro es inmediato
}

function calculateMetaAwareness(entry: EmotionEntry): number {
  // Evaluar certeza y reflexión
  let score = 0
  if (entry.certainty_bucket) {
    if (entry.certainty_bucket === 'very_sure') score += 40
    else if (entry.certainty_bucket === 'sure') score += 30
    else if (entry.certainty_bucket === 'unsure') score += 20
  } else {
    score += 30
  }
  
  // Bonus si hay nota reflexiva
  if (entry.notes && entry.notes.length > 50) score += 20
  
  // Bonus si usó intervención
  if (entry.intervention_used) score += 40
  
  return Math.min(score, 100)
}

function calculateElaborativeAwareness(entry: EmotionEntry): number {
  // Evaluar profundidad del registro
  let score = 0
  
  if (entry.notes) {
    if (entry.notes.length > 200) score += 50
    else if (entry.notes.length > 100) score += 30
    else if (entry.notes.length > 20) score += 20
  }
  
  if (entry.custom_activity || entry.custom_company) score += 30
  
  if (entry.free_text && entry.free_text.length > 50) score += 20
  
  return Math.min(score, 100)
}
```

### 8.2 Mapeo de Emociones: `emotion-mapping.ts`

**Ubicación:** `lib/emotion-mapping.ts`

**Responsabilidad:** Mapear cada emoción del catálogo a coordenadas (valence, arousal).

**Estructura de datos:**
```typescript
export const EMOTION_TO_AXES: Record<string, EmotionAxes> = {
  // VERDE (calma)
  'Tranquilo': { valence: 0.6, arousal: -0.6 },
  'Relajado': { valence: 0.6, arousal: -0.7 },
  'Sereno': { valence: 0.7, arousal: -0.6 },
  ...
  
  // AMARILLO (energía)
  'Feliz': { valence: 0.8, arousal: 0.4 },
  'Emocionado': { valence: 0.8, arousal: 0.8 },
  'Entusiasta': { valence: 0.8, arousal: 0.8 },
  ...
  
  // ROJO (tensión)
  'Ansioso': { valence: -0.6, arousal: 0.6 },
  'Estresado': { valence: -0.7, arousal: 0.8 },
  'Frustrado': { valence: -0.7, arousal: 0.6 },
  ...
  
  // AZUL (sin ánimo)
  'Triste': { valence: -0.7, arousal: -0.6 },
  'Deprimido': { valence: -0.8, arousal: -0.7 },
  'Desanimado': { valence: -0.6, arousal: -0.6 },
  ...
}

export function getEmotionAxes(emotion: string): EmotionAxes {
  return EMOTION_TO_AXES[emotion] || { valence: 0, arousal: 0 }
}
```

### 8.3 Datos Estáticos: `vladi-data.ts`

**Ubicación:** `lib/vladi-data.ts`

**Responsabilidad:** Almacenar matrices de emociones, descripciones, actividades y contextos.

**Estructura:**
```typescript
export const EMOTION_MATRICES = {
  green: [
    ['Soñoliento', 'Complaciente', 'Sosegado', 'Acogido', 'Sereno'],
    ['Apacible', 'Reflexivo', 'Pacífico', 'Cómodo', 'Despreocupado'],
    ['Relajado', 'Tranquilo', 'Repuesto', 'Afortunado', 'Equilibrado'],
    ['Calmado', 'Seguro', 'Satisfecho', 'Agradecido', 'Conmovido'],
    ['A gusto', 'Desenfadado', 'Contento', 'Afectuoso', 'Realizado']
  ],
  
  yellow: [
    ['Agradable', 'Jubiloso', 'Esperanzado', 'Juguetón', 'Dichoso'],
    ['Complacido', 'Centrado', 'Feliz', 'Orgulloso', 'Encantado'],
    ['Enérgico', 'Vivaz', 'Emocionado', 'Optimista', 'Entusiasta'],
    ['Hiperactivo', 'Alegre', 'Motivado', 'Inspirado', 'Exaltado'],
    ['Sorprendido', 'Animado', 'Festivo', 'Eufórico', 'Extasiado']
  ],
  
  red: [
    ['Asqueado', 'Intranquilo', 'Alarmado', 'Incómodo', 'Fastidiado'],
    ['Ansioso', 'Temeroso', 'Preocupado', 'Irritado', 'Molesto'],
    ['Hirviendo de rabia', 'Asustado', 'Enfadado', 'Nervioso', 'Inquieto'],
    ['Rabioso', 'Furioso', 'Frustrado', 'Tenso', 'Desconcertado'],
    ['Enfurecido', 'Aterrorizado', 'Estresado', 'Alterado', 'Impactado']
  ],
  
  blue: [
    ['Desesperado', 'Sin esperanza', 'Desolado', 'Fundido', 'Sin energía'],
    ['Abatido', 'Deprimido', 'Huraño', 'Agotado', 'Fatigado'],
    ['Aislado', 'Miserable', 'Solitario', 'Descorazonado', 'Cansado'],
    ['Pesimista', 'Sombrío', 'Desanimado', 'Triste', 'Aburrido'],
    ['Disgustado', 'Apagado', 'Decepcionado', 'Decaído', 'Apático']
  ]
}

export const EMOTION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  green: {
    'Tranquilo': 'Sin alteración, preocupación o agitación.',
    'Relajado': 'Libre de tensión física o mental.',
    ...
  },
  yellow: {
    'Feliz': 'Sensación de placer o satisfacción.',
    'Emocionado': 'Con una fuerte sensación de interés y entusiasmo.',
    ...
  },
  red: {
    'Ansioso': 'Preocupado o temeroso de lo que puede pasar.',
    'Estresado': 'Sobrepasado por presión o demandas.',
    ...
  },
  blue: {
    'Triste': 'Descontento o infeliz.',
    'Deprimido': 'Muy desanimado o sin esperanza.',
    ...
  }
}

export const DEFAULT_ACTIVITIES = [
  'Trabajando',
  'Estudiando',
  'Descansando',
  'Haciendo deporte',
  'Comiendo',
  'De paseo',
  'En casa',
  'Viajando',
  'En reunión',
  'De compras'
]

export const DEFAULT_COMPANY = [
  'Solo/a',
  'Familia',
  'Amigos',
  'Pareja',
  'Compañeros',
  'Desconocidos'
]
```

---

## 9. Autenticación y Seguridad

### 9.1 Flujo de Autenticación con Supabase

VLADI utiliza Supabase Auth para gestionar usuarios:

```
┌──────────────────────────────────────┐
│  CLIENTE (Next.js)                   │
│                                      │
│  Usuario introduce credenciales      │
│  (email + password)                  │
│         │                            │
│         v                            │
│  createClient().auth.signInWith      │
│  Password({ email, password })       │
│         │                            │
└─────────┼────────────────────────────┘
          │
          v
┌─────────┴────────────────────────────┐
│  SUPABASE AUTH                       │
│                                      │
│  1. Validar credenciales             │
│  2. Generar JWT token                │
│  3. Crear sesión                     │
│  4. Retornar user + session          │
│         │                            │
└─────────┼────────────────────────────┘
          │
          v
┌─────────┴────────────────────────────┐
│  MIDDLEWARE (proxy.js)               │
│                                      │
│  1. Interceptar request              │
│  2. Refrescar token si necesario     │
│  3. Actualizar cookies               │
│  4. Pasar request al handler         │
│         │                            │
└─────────┼────────────────────────────┘
          │
          v
┌─────────┴────────────────────────────┐
│  PAGE/API ROUTE                      │
│                                      │
│  const supabase = await              │
│    createClient()                    │
│  const { data: { user } } =          │
│    await supabase.auth.getUser()     │
│                                      │
│  if (!user) redirect('/auth/login')  │
│                                      │
└──────────────────────────────────────┘
```

### 9.2 Implementación de Cliente Supabase

#### Cliente Browser (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createClient()
```

#### Cliente Server (`lib/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

#### Middleware/Proxy (`lib/supabase/proxy.ts`)

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refrescar sesión si es necesario
  await supabase.auth.getUser()

  return response
}
```

#### Configuración del Middleware (`middleware.ts`)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 9.3 Protección de Rutas

#### Página Protegida (Server Component)

```typescript
// app/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <VladiApp userId={user.id} userProfile={profile} />
}
```

#### Componente con Auth (Client Component)

```typescript
// components/example.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ProtectedComponent() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
    }

    checkAuth()
  }, [router])

  if (!user) return <div>Loading...</div>

  return <div>Protected content for {user.email}</div>
}
```

### 9.4 Row Level Security (RLS)

Todas las tablas tienen políticas RLS habilitadas. Ejemplos:

#### Política: Usuario solo ve sus propias entradas

```sql
CREATE POLICY entries_select_own ON emotion_entries
  FOR SELECT
  USING (auth.uid() = user_id);
```

#### Política: Usuario puede ver entradas compartidas con él

```sql
CREATE POLICY entries_select_shared ON emotion_entries
  FOR SELECT
  USING (
    is_public = true OR
    privacy_group_id IN (
      SELECT gm.group_id 
      FROM group_members gm
      JOIN contacts c ON c.id = gm.contact_id
      WHERE c.user_id = auth.uid()
    )
  );
```

#### Política: Usuario solo puede insertar sus propias entradas

```sql
CREATE POLICY entries_insert_own ON emotion_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 9.5 Validación y Sanitización

#### En el cliente (antes de enviar)

```typescript
// Validar intensidad
if (intensity < 0 || intensity > 100) {
  throw new Error('Intensidad debe estar entre 0 y 100')
}

// Sanitizar texto libre
const sanitizedNotes = notes.trim().substring(0, 500)

// Validar emoción está en catálogo
if (!EMOTION_TO_AXES[emotion]) {
  throw new Error('Emoción no reconocida')
}
```

#### En el servidor (RLS + constraints)

```sql
-- Constraint en tabla
ALTER TABLE emotion_entries
ADD CONSTRAINT intensity_range 
CHECK (intensity >= 0 AND intensity <= 100);

-- Enum para cuadrantes
ALTER TABLE emotion_entries
ADD CONSTRAINT valid_quadrant 
CHECK (quadrant IN ('green', 'yellow', 'red', 'blue'));
```

---

## 10. Integración con Supabase

### 10.1 Variables de Entorno

VLADI requiere las siguientes variables de entorno (configuradas en Vercel):

```env
# Supabase Public
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Internal (para Vercel)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret

# PostgreSQL Connection (para migraciones)
POSTGRES_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=[password]
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.xxxxx.supabase.co

# Development Redirect (para testing local)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

### 10.2 Configuración del Proyecto Supabase

#### Dashboard Settings

1. **Authentication → URL Configuration:**
   - Site URL: `https://vladi.app`
   - Redirect URLs: 
     - `https://vladi.app/auth/callback`
     - `http://localhost:3000/auth/callback` (dev)

2. **Authentication → Email Templates:**
   - Personalizar plantillas de confirmación y recuperación

3. **Authentication → Providers:**
   - Email: Habilitado (confirmación obligatoria)
   - Google OAuth: Habilitado
   - Otros proveedores: Deshabilitados por ahora

4. **Database → Extensions:**
   - `uuid-ossp`: Para generar UUIDs
   - `pg_trgm`: Para búsqueda fuzzy en perfiles

5. **Storage → Buckets:**
   - `avatars`: Público, max 2MB por archivo
   - `audio-notes`: Privado, max 10MB por archivo

### 10.3 Real-time Subscriptions

Ejemplo: Escuchar nuevas emociones públicas en tiempo real

```typescript
const supabase = createClient()

const subscription = supabase
  .channel('public-emotions')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'emotion_entries',
      filter: 'is_public=eq.true'
    },
    (payload) => {
      console.log('Nueva emoción pública:', payload.new)
      setFeedItems(prev => [payload.new, ...prev])
    }
  )
  .subscribe()

return () => {
  subscription.unsubscribe()
}
```

### 10.4 Storage para Avatares

```typescript
// Subir avatar
const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) throw uploadError

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Actualizar perfil
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  return publicUrl
}
```

---

## 11. Gestión de Estado

### 11.1 Zustand Store

VLADI usa Zustand para gestionar estado global de la aplicación.

**Ubicación:** `lib/vladi-store.ts`

**Estructura del Store:**

```typescript
interface VladiState {
  // Estado del usuario
  user: User | null
  setUser: (user: User | null) => void

  // Emociones y check-ins
  moodHistory: MoodEntry[]
  addMoodEntry: (entry: MoodEntry) => void
  fetchMoodHistory: (userId: string, days: number) => Promise<void>

  // Métricas IEQ
  metrics: MetricsResult | null
  isLoadingMetrics: boolean
  fetchMetrics: (userId: string, periodDays: number) => Promise<void>

  // Chat y mensajes
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  fetchChatMessages: (userId: string) => Promise<void>

  // UI state
  selectedPeriod: 7 | 14 | 30
  setSelectedPeriod: (period: 7 | 14 | 30) => void
  isCheckInFlowOpen: boolean
  setCheckInFlowOpen: (open: boolean) => void
}

export const useVladiStore = create<VladiState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      moodHistory: [],
      metrics: null,
      isLoadingMetrics: false,
      chatMessages: [],
      selectedPeriod: 30,
      isCheckInFlowOpen: false,

      // Actions
      setUser: (user) => set({ user }),

      addMoodEntry: (entry) =>
        set((state) => ({
          moodHistory: [entry, ...state.moodHistory]
        })),

      fetchMoodHistory: async (userId, days) => {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data, error } = await supabase
          .from('emotion_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching mood history:', error)
          return
        }

        set({ moodHistory: data })
      },

      fetchMetrics: async (userId, periodDays) => {
        set({ isLoadingMetrics: true })

        try {
          const entries = await fetchEntriesForPeriod(userId, periodDays)
          const previousEntries = await fetchEntriesForPeriod(
            userId, 
            periodDays, 
            periodDays  // offset
          )

          // Calcular todas las métricas
          const emotionalState = calculateEmotionalState(entries, periodDays)
          const { score, delta } = calculateDEAMScore(entries, periodDays)
          const intensityWellbeing = calculateIntensityWellbeing(entries)
          const granularity = calculateGranularity(entries, previousEntries)
          const awareness = calculateEmotionalAwareness(
            entries, 
            previousEntries, 
            periodDays
          )
          const inertia = calculateInertiaWithWeekly(entries)

          const metrics: MetricsResult = {
            emotionalState,
            deamScore: score,
            deamDelta: delta,
            intensityWellbeing,
            granularity,
            awareness,
            inertia,
            checkInsCount: entries.length
          }

          set({ metrics, isLoadingMetrics: false })
        } catch (error) {
          console.error('Error calculating metrics:', error)
          set({ isLoadingMetrics: false })
        }
      },

      setSelectedPeriod: (period) => set({ selectedPeriod: period }),
      setCheckInFlowOpen: (open) => set({ isCheckInFlowOpen: open }),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message]
        })),

      fetchChatMessages: async (userId) => {
        // Implementar fetch de mensajes
        // Por ahora vacío
        set({ chatMessages: [] })
      }
    })
  )
)
```

### 11.2 Uso del Store en Componentes

```typescript
// Leer estado
const { metrics, isLoadingMetrics, fetchMetrics } = useVladiStore()

// Usar acciones
useEffect(() => {
  fetchMetrics(userId, 30)
}, [userId, fetchMetrics])

// Renderizar
if (isLoadingMetrics) return <Spinner />

return (
  <div>
    <h1>DEAM Score: {metrics?.deamScore}</h1>
    <p>Estado: {metrics?.emotionalState.category}</p>
  </div>
)
```

### 11.3 Persistencia Local (Futuro)

Para mejorar performance, se puede añadir persistencia local con `zustand/middleware`:

```typescript
import { persist, createJSONStorage } from 'zustand/middleware'

export const useVladiStore = create<VladiState>()(
  devtools(
    persist(
      (set, get) => ({
        // ... state y actions
      }),
      {
        name: 'vladi-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Solo persistir lo necesario
          moodHistory: state.moodHistory.slice(0, 50),  // Últimas 50 entradas
          selectedPeriod: state.selectedPeriod
        })
      }
    )
  )
)
```

---

## 12. Sistema de Diseño

### 12.1 Paleta de Colores

VLADI utiliza una paleta personalizada basada en los cuadrantes emocionales:

```css
:root {
  /* Colores principales */
  --background: #ffffff;
  --foreground: #111827;
  --primary: #111827;
  --primary-foreground: #ffffff;

  /* Colores VLADI - Cuadrantes Emocionales */
  --vladi-green: #94b22e;   /* Calma */
  --vladi-yellow: #e6b04f;  /* Energía */
  --vladi-red: #e6584f;     /* Tensión */
  --vladi-blue: #466d91;    /* Sin ánimo */

  /* Colores de gráficos */
  --chart-1: #94b22e;
  --chart-2: #e6b04f;
  --chart-3: #e6584f;
  --chart-4: #466d91;
  --chart-5: #111827;

  /* Grises */
  --muted: #f9fafb;
  --muted-foreground: #6b7280;
  --border: #f3f4f6;

  /* Radius */
  --radius: 1.5rem;
}
```

### 12.2 Tipografía

VLADI usa dos familias tipográficas:

#### DM Sans (Sans-serif, principal)
- **Uso:** Cuerpo de texto, UI, botones, labels
- **Pesos:** 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
- **Variable CSS:** `--font-dm-sans`
- **Clase Tailwind:** `font-sans`

#### Playfair Display (Serif, títulos)
- **Uso:** Títulos emocionales, headers importantes
- **Pesos:** 400 (Regular), 600 (Semi-bold)
- **Estilos:** Normal, Italic
- **Variable CSS:** `--font-playfair`
- **Clase Tailwind:** `font-serif`

**Ejemplo:**
```tsx
<h1 className="font-serif text-4xl italic">En calma</h1>
<p className="font-sans text-base text-muted-foreground">
  Hoy, te has sentido mayormente calmado y tranquilo.
</p>
```

### 12.3 Espaciado y Layout

VLADI sigue un sistema de espaciado consistente basado en múltiplos de 4px:

```typescript
// Tailwind spacing scale (usado en la app)
spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px'
}
```

**Convenciones:**
- **Padding de secciones:** `p-6` (24px) en móvil, `p-8` (32px) en desktop
- **Gap entre elementos:** `gap-4` (16px) por defecto
- **Margin entre bloques:** `mb-6` (24px)
- **Padding de botones:** `px-6 py-3` (horizontal 24px, vertical 12px)

### 12.4 Componentes UI (shadcn/ui)

VLADI utiliza shadcn/ui, una colección de componentes basados en Radix UI y Tailwind CSS.

**Componentes instalados:**
- `Button` - Botones con variantes
- `Card` - Tarjetas con header/content/footer
- `Dialog` - Modales
- `Sheet` - Paneles laterales/desde abajo
- `Slider` - Slider de intensidad
- `Select` - Dropdowns
- `Avatar` - Avatares de usuario
- `Badge` - Badges de estado
- `Separator` - Líneas divisorias
- `Tabs` - Pestañas
- `DropdownMenu` - Menús contextuales
- `Input` - Campos de texto
- `Textarea` - Áreas de texto
- `Label` - Labels de formularios
- `ScrollArea` - Áreas scrolleables
- `Skeleton` - Loading skeletons

**Ejemplo de uso:**
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <h2>DEAM IEQ Score</h2>
  </CardHeader>
  <CardContent>
    <p className="text-6xl font-bold">79</p>
    <Button variant="outline" size="sm">Ver detalles</Button>
  </CardContent>
</Card>
```

### 12.5 Responsive Design

VLADI es mobile-first con breakpoints estándar de Tailwind:

```typescript
breakpoints = {
  sm: '640px',   // Tablets pequeñas
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Desktops grandes
}
```

**Estrategia:**
1. Diseñar todo para móvil (320px - 768px)
2. Adaptar layouts para tablet (768px+) con `md:` prefix
3. Optimizar para desktop (1024px+) con `lg:` prefix

**Ejemplo:**
```tsx
<div className="
  grid grid-cols-1        /* 1 columna en móvil */
  md:grid-cols-2          /* 2 columnas en tablet */
  lg:grid-cols-3          /* 3 columnas en desktop */
  gap-4 md:gap-6          /* Gap responsivo */
">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### 12.6 Animaciones

VLADI usa animaciones sutiles para mejorar la UX:

#### Animación de expansión (Check-in completado)

```css
@keyframes expand-circle {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(50);
  }
}

.expanding {
  animation: expand-circle 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### Animación de pulsación (Botón SOS)

```css
@keyframes pulse-scale {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.pulse-icon {
  animation: pulse-scale 2s infinite ease-in-out;
}
```

#### Transiciones

```tsx
// Transiciones suaves para interacciones
<Button className="active:scale-[0.98] transition-transform">
  Confirmar
</Button>
```

### 12.7 Safe Areas (iOS)

Para manejar notches y áreas seguras en iOS:

```css
.pt-safe {
  padding-top: max(16px, env(safe-area-inset-top));
}

.pb-safe {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

**Uso:**
```tsx
<div className="min-h-screen pt-safe pb-safe">
  {/* Contenido seguro en iOS */}
</div>
```

---

## 13. API Routes y Acciones

### 13.1 Server Actions

VLADI usa Server Actions de Next.js para operaciones del servidor.

**Ubicación:** `app/actions/` (a crear)

#### Ejemplo: Guardar emoción

```typescript
// app/actions/emotions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveEmotion(data: {
  emotion: string
  intensity: number
  quadrant: string
  context?: string
  activity_tags?: string[]
  company_tags?: string[]
  notes?: string
}) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autenticado' }
  }

  // Calcular valence y arousal
  const { valence, arousal } = getEmotionAxes(data.emotion)
  const wellbeing = Math.round((valence + 1) * 50)

  // Insertar en DB
  const { error } = await supabase.from('emotion_entries').insert({
    user_id: user.id,
    emotion: data.emotion,
    intensity: data.intensity,
    quadrant: data.quadrant,
    valence,
    arousal,
    wellbeing,
    context: data.context,
    activity_tags: data.activity_tags,
    company_tags: data.company_tags,
    notes: data.notes,
    created_at: new Date().toISOString()
  })

  if (error) {
    return { error: error.message }
  }

  // Revalidar caché de la página
  revalidatePath('/app')

  return { success: true }
}
```

#### Uso en componente:

```tsx
'use client'

import { saveEmotion } from '@/app/actions/emotions'

const handleSaveEmotion = async () => {
  const result = await saveEmotion({
    emotion: 'Feliz',
    intensity: 75,
    quadrant: 'yellow',
    activity_tags: ['Trabajando'],
    company_tags: ['Solo/a']
  })

  if (result.error) {
    toast.error(result.error)
  } else {
    toast.success('Emoción registrada')
    router.push('/app')
  }
}
```

### 13.2 API Routes

Para operaciones más complejas o endpoints públicos:

#### Ejemplo: Webhook de Supabase

```typescript
// app/api/webhooks/supabase/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Verificar signature (importante para seguridad)
    const signature = request.headers.get('x-webhook-signature')
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Procesar evento
    switch (payload.type) {
      case 'INSERT':
        // Nueva emoción registrada
        await handleNewEmotion(payload.record)
        break

      case 'UPDATE':
        // Emoción actualizada
        await handleEmotionUpdate(payload.record)
        break

      default:
        console.log('Evento no manejado:', payload.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 14. Métricas y Algoritmos

### 14.1 Resumen de Algoritmos Principales

| Algoritmo | Input | Output | Complejidad |
|-----------|-------|--------|-------------|
| `calculateEmotionalState` | Entradas emocionales + periodo | Estado emocional predominante | O(n) |
| `calculateDEAMScore` | Entradas emocionales + periodo | Score IEQ 0-100 | O(n) |
| `calculateInertia` | Entradas emocionales | Tiempo promedio de recuperación (horas) | O(n²) |
| `calculateGranularity` | Entradas actuales + previas | Granularidad normalizada + delta | O(n log n) |
| `calculateEmotionalAwareness` | Entradas actuales + previas + periodo | Score CE 0-100 + 5 sub-scores | O(n) |
| `calculateIntensityWellbeing` | Entradas emocionales | Distribuciones + medias | O(n) |

### 14.2 Optimizaciones

#### Caching de métricas

```typescript
// Cachear métricas calculadas en el store
const getCachedMetrics = (userId: string, periodDays: number) => {
  const cacheKey = `metrics-${userId}-${periodDays}`
  const cached = localStorage.getItem(cacheKey)
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    // Cache válido por 5 minutos
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data
    }
  }
  
  return null
}

const setCachedMetrics = (userId: string, periodDays: number, metrics: any) => {
  const cacheKey = `metrics-${userId}-${periodDays}`
  localStorage.setItem(cacheKey, JSON.stringify({
    data: metrics,
    timestamp: Date.now()
  }))
}
```

#### Paginación de entradas

```typescript
// Cargar entradas de forma incremental
const fetchEntriesPaginated = async (
  userId: string, 
  page: number, 
  pageSize: number = 50
) => {
  const { data, error } = await supabase
    .from('emotion_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  return { data, error }
}
```

#### Debouncing de cálculos

```typescript
import { useMemo, useEffect } from 'react'
import debounce from 'lodash/debounce'

// Solo recalcular métricas después de 500ms de inactividad
const debouncedCalculateMetrics = useMemo(
  () => debounce((entries) => {
    const metrics = calculateAllMetrics(entries)
    setMetrics(metrics)
  }, 500),
  []
)

useEffect(() => {
  debouncedCalculateMetrics(entries)
}, [entries, debouncedCalculateMetrics])
```

---

## 15. Configuración y Deployment

### 15.1 Configuración de Next.js

**Archivo:** `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimizaciones de imagen
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'your-supabase-project.supabase.co'
    ],
    formats: ['image/avif', 'image/webp']
  },
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
}

export default nextConfig
```

### 15.2 Configuración de TypeScript

**Archivo:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 15.3 Deployment en Vercel

#### Setup inicial:

1. **Conectar repositorio GitHub:**
   ```bash
   vercel link
   ```

2. **Configurar variables de entorno en Vercel Dashboard:**
   - Project Settings → Environment Variables
   - Añadir todas las variables de `NEXT_PUBLIC_*` y `SUPABASE_*`

3. **Configurar dominios:**
   - Domains → Add Domain → `vladi.app`
   - Configurar DNS:
     ```
     A     @      76.76.21.21
     CNAME www    cname.vercel-dns.com
     ```

4. **Desplegar:**
   ```bash
   git push origin main
   ```
   - Vercel detecta automáticamente y despliega

#### Configuración de Build:

```json
// vercel.json (opcional, para configuración avanzada)
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 15.4 Scripts útiles

**Archivo:** `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "analyze": "ANALYZE=true next build",
    "supabase:generate-types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts"
  }
}
```

### 15.5 Monitoreo y Analytics

#### Vercel Analytics

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Error Tracking (Sentry - futuro)

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
})
```

---

## 16. Testing y Debugging

### 16.1 Estrategia de Testing

#### Unit Tests (Jest + React Testing Library)

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Ejemplo:** Test de calculadora IEQ

```typescript
// lib/__tests__/ieq-calculator.test.ts
import { calculateDEAMScore, calculateInertia } from '../ieq-calculator'

describe('IEQ Calculator', () => {
  describe('calculateDEAMScore', () => {
    it('should return 0 for empty entries', () => {
      const result = calculateDEAMScore([], 30)
      expect(result.score).toBe(0)
    })

    it('should calculate valid score for sufficient entries', () => {
      const entries = [
        { emotion: 'Feliz', intensity: 80, valence: 0.8, arousal: 0.4, timestamp: new Date().toISOString() },
        { emotion: 'Tranquilo', intensity: 60, valence: 0.6, arousal: -0.6, timestamp: new Date().toISOString() },
        { emotion: 'Motivado', intensity: 90, valence: 0.7, arousal: 0.7, timestamp: new Date().toISOString() },
        { emotion: 'Sereno', intensity: 70, valence: 0.7, arousal: -0.6, timestamp: new Date().toISOString() },
      ]

      const result = calculateDEAMScore(entries, 7)
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateInertia', () => {
    it('should return 0 for no negative entries', () => {
      const entries = [
        { emotion: 'Feliz', valence: 0.8, timestamp: new Date().toISOString() }
      ]
      expect(calculateInertia(entries)).toBe(0)
    })

    it('should calculate recovery time correctly', () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      const entries = [
        { emotion: 'Triste', valence: -0.7, timestamp: twoHoursAgo.toISOString() },
        { emotion: 'Feliz', valence: 0.8, timestamp: now.toISOString() }
      ]

      const inertia = calculateInertia(entries)
      expect(inertia).toBeCloseTo(2, 0.1)  // ~2 horas
    })
  })
})
```

#### Component Tests

```typescript
// components/__tests__/emotion-picker.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { EmotionPicker } from '../emotion-picker'

describe('EmotionPicker', () => {
  it('should render all quadrants', () => {
    render(<EmotionPicker onSelect={jest.fn()} selectedEmotion={null} />)
    
    expect(screen.getByText('En calma')).toBeInTheDocument()
    expect(screen.getByText('Con energía')).toBeInTheDocument()
    expect(screen.getByText('En tensión')).toBeInTheDocument()
    expect(screen.getByText('Sin ánimo')).toBeInTheDocument()
  })

  it('should call onSelect when quadrant is clicked', () => {
    const onSelect = jest.fn()
    render(<EmotionPicker onSelect={onSelect} selectedEmotion={null} />)
    
    fireEvent.click(screen.getByText('En calma'))
    expect(onSelect).toHaveBeenCalledWith({ id: 'green', name: 'En calma' })
  })
})
```

#### Integration Tests (Playwright - futuro)

```typescript
// e2e/check-in-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete emotion check-in flow', async ({ page }) => {
  // Login
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', 'test@vladi.app')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Navigate to record
  await page.click('[data-testid="tab-record"]')

  // Select quadrant
  await page.click('[data-quadrant="green"]')

  // Select emotion
  await page.click('text=Tranquilo')

  // Set intensity
  await page.locator('input[type="range"]').fill('75')
  await page.click('text=Continuar')

  // Add context
  await page.click('text=Descansando')
  await page.click('text=Solo/a')
  await page.click('text=Continuar')

  // Confirm
  await page.click('text=Sí, confirmar')

  // Verify success
  await expect(page.locator('text=¡Registrado!')).toBeVisible()
})
```

### 16.2 Debugging

#### Console Logs Estructurados

```typescript
// Usar [v0] prefix para logs de debugging
console.log('[v0] User data:', userData)
console.log('[v0] Calculating metrics for period:', periodDays)
console.error('[v0] Error in IEQ calculation:', error)
```

#### React DevTools

Instalar extensión de React DevTools en navegador para:
- Inspeccionar árbol de componentes
- Ver props y state en tiempo real
- Identificar re-renders innecesarios

#### Supabase Logs

Acceder a logs en Supabase Dashboard:
- Database → Logs → Query logs
- Authentication → Logs → Auth events
- API → Logs → API calls

#### Vercel Logs

En Vercel Dashboard:
- Deployments → [Deployment] → Functions
- Ver logs en tiempo real durante desarrollo

---

## 17. Roadmap y Mejoras Futuras

### 17.1 Fase 1: MVP (Actual) ✅

- [x] Autenticación con email/password
- [x] Registro emocional completo
- [x] Cálculo de métricas DEAM IEQ
- [x] Vista de estadísticas con gráficos
- [x] Feed social básico
- [x] Gestión de contactos

### 17.2 Fase 2: Mejoras de Core (Q1 2026)

- [ ] **Señales corporales:** Añadir tracking de síntomas físicos
- [ ] **Intervenciones guiadas:** Ejercicios de respiración, grounding, mindfulness
- [ ] **Notificaciones push:** Recordatorios de check-in
- [ ] **Exportación de datos:** PDF reports, CSV exports
- [ ] **Dark mode:** Tema oscuro completo
- [ ] **Offline mode:** Service workers y sincronización

### 17.3 Fase 3: Inteligencia Avanzada (Q2 2026)

- [ ] **Predicción emocional:** ML para predecir estados futuros
- [ ] **Detección de patrones:** Identificar triggers automáticamente
- [ ] **Recomendaciones personalizadas:** Sugerir intervenciones basadas en historial
- [ ] **Chat con IA:** Asistente conversacional emocional
- [ ] **Análisis de texto:** NLP en notas para extraer insights

### 17.4 Fase 4: Social y Comunidad (Q3 2026)

- [ ] **Grupos de apoyo:** Círculos privados con moderadores
- [ ] **Challenges:** Retos emocionales grupales
- [ ] **Gamificación:** Badges, streaks, niveles
- [ ] **Marketplace de recursos:** Meditaciones, ejercicios, cursos
- [ ] **Integración con profesionales:** Conexión con terapeutas

### 17.5 Fase 5: Expansión (Q4 2026)

- [ ] **App nativa (React Native):** iOS y Android
- [ ] **Wearables:** Integración con Apple Watch, Fitbit
- [ ] **APIs públicas:** Para investigadores y desarrolladores
- [ ] **Empresas:** Dashboard para RRHH y bienestar corporativo
- [ ] **Internacionalización:** Soporte para múltiples idiomas

---

## 18. Contacto y Recursos

### 18.1 Enlaces Importantes

- **Repositorio:** `github.com/vladi-app/vladi`
- **Producción:** `https://vladi.app`
- **Staging:** `https://staging.vladi.app`
- **Documentación:** `https://docs.vladi.app`

### 18.2 Stack Documentation

- **Next.js 16:** https://nextjs.org/docs
- **React 19:** https://react.dev
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS v4:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Recharts:** https://recharts.org
- **Zustand:** https://docs.pmnd.rs/zustand

### 18.3 Para Desarrolladores

Si vas a trabajar en VLADI, necesitarás:

1. **Acceso a:**
   - Repositorio GitHub
   - Proyecto Vercel
   - Proyecto Supabase
   - Variables de entorno

2. **Setup local:**
   ```bash
   git clone <repo>
   npm install
   cp .env.example .env.local
   # Configurar variables de entorno
   npm run dev
   ```

3. **Documentación de API:**
   - Ver `lib/` para toda la lógica de negocio
   - Ver `components/vladi/` para componentes específicos
   - Ver esquemas de DB en sección 4

4. **Convenciones de commits:**
   ```
   feat: Add new emotion tracking feature
   fix: Fix DEAM score calculation bug
   docs: Update API documentation
   style: Format code with prettier
   refactor: Restructure IEQ calculator
   test: Add tests for granularity calculation
   chore: Update dependencies
   ```

---

## 19. Glosario de Términos

- **DEAM:** Distributed Emotion Analysis Model
- **IEQ:** Inteligencia Emocional Cuantificada
- **CE:** Conciencia Emocional
- **RLS:** Row Level Security
- **PWA:** Progressive Web App
- **SSR:** Server-Side Rendering
- **RSC:** React Server Components
- **BaaS:** Backend as a Service

---

**Fin de la Documentación Técnica VLADI v26.6**

*Última actualización: Diciembre 2025*
*Autor: Equipo VLADI*
*Versión: 1.0*

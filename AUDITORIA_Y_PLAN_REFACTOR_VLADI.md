# AUDITORÍA COMPLETA Y PLAN DE REFACTORIZACIÓN - VLADI v26

**Fecha**: 23 Diciembre 2025  
**Objetivo**: Depurar, estabilizar y preparar VLADI para escalar a millones de usuarios sin tocar el diseño UI/UX.

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual
- **Código funcional**: ✅ La app funciona visualmente
- **Arquitectura**: ⚠️ Necesita refactorización profunda
- **Escalabilidad**: ❌ No preparada para millones de usuarios
- **Mantenibilidad**: ⚠️ Difícil de mantener y extender

### Problemas Críticos Detectados
1. ❌ **Lógica de negocio mezclada con UI** en casi todos los componentes
2. ⚠️ **Duplicación de cálculos DEAM** en múltiples lugares
3. ⚠️ **Estado global fragmentado** (Zustand + múltiples useState)
4. ❌ **Sin separación de responsabilidades** (UI/Domain/Data)
5. ⚠️ **Archivos monolíticos** (ieq-calculator.ts con 701 líneas)
6. ⚠️ **Console.logs** sin eliminar (48 ocurrencias)
7. ⚠️ **Re-renders excesivos** por dependencias mal gestionadas
8. ❌ **Sin versionado del modelo DEAM EQ**

---

## 🔍 AUDITORÍA DETALLADA

### 1. PROBLEMAS DE ARQUITECTURA

#### 1.1 Componentes Hacen Cálculos de Negocio

**Archivos problemáticos**:
- `components/vladi/ieq-panel.tsx` (736 líneas)
  - Calcula métricas DEAM directamente en `useEffect`
  - Múltiples `useState` para datos derivados
  - Lógica compleja de transformación de datos en UI

- `components/vladi/vladi-app.tsx` (271 líneas)
  - Maneja creación de entradas con lógica embebida
  - Transforma datos antes de guardar en Supabase
  - No delega en servicios

- `components/vladi/social-feed.tsx` (571 líneas)
  - Carga, transforma y renderiza en el mismo componente
  - Lógica de negocio de comentarios mezclada con UI

**Impacto**:
- Imposible testear lógica sin renderizar UI
- Difícil reutilizar cálculos
- Componentes lentos y complejos

#### 1.2 Duplicación de Lógica

**Cálculos duplicados**:
1. **Estado Emocional** calculado en:
   - `lib/ieq-calculator.ts::calculateEmotionalState()` 
   - `lib/emotional-state-calculator.ts::calculateEmotionalState()`
   - `lib/vladi-store.ts::calculateMetrics()` (versión simplificada)

2. **Granularidad** calculada en:
   - `lib/ieq-calculator.ts::calculateGranularity()`
   - `lib/vladi-store.ts::calculateMetrics()` (conteo simple)

3. **Inercia** calculada en:
   - `lib/ieq-calculator.ts::calculateInertia()`
   - `lib/ieq-calculator.ts::calculateInertiaWithWeekly()`
   - `lib/vladi-store.ts::calculateMetrics()` (algoritmo diferente)

**Consecuencia**:
- Resultados inconsistentes según dónde se calcule
- Mantenimiento multiplicado por 3
- Bugs difíciles de rastrear

#### 1.3 Estado Global Fragmentado

**Problemas detectados**:
```typescript
// Estado en Zustand
lib/vladi-store.ts: entries, activities, company, groups

// Estados locales duplicados
components/vladi/ieq-panel.tsx: currentEntries, previousEntries, loading
components/vladi/social-feed.tsx: entries, isLoading
components/vladi/home-view.tsx: notificationCount
components/vladi/vladi-app.tsx: notificationCount (duplicado)
```

**Impacto**:
- Mismos datos en múltiples lugares
- Sincronización manual propensa a errores
- Re-renders innecesarios

#### 1.4 Archivos Monolíticos

| Archivo | Líneas | Responsabilidades |
|---------|--------|-------------------|
| `lib/ieq-calculator.ts` | 701 | 8 funciones complejas diferentes |
| `components/vladi/ieq-panel.tsx` | 736 | UI + cálculos + estado + lógica |
| `components/vladi/social-feed.tsx` | 571 | Feed + comentarios + amigos + delete |
| `components/vladi/check-in-flow.tsx` | 520 | 4 pasos + validación + guardado |

**Problema**:
- Difícil navegar y entender
- Múltiples responsabilidades por archivo
- Cambios pequeños requieren tocar mucho código

### 2. PROBLEMAS DE RENDIMIENTO

#### 2.1 useEffect Sin Optimizar

**Ejemplos críticos**:

```typescript
// components/vladi/ieq-panel.tsx (línea 157)
useEffect(() => {
  loadIEQData() // Función asíncrona no memoizada
}, [period, userId]) // Re-ejecuta cada cambio de periodo

// Problem: loadIEQData crea nuevas funciones cada render
```

```typescript
// components/vladi/vladi-app.tsx (línea 43)
useEffect(() => {
  if (!userId) return
  
  let mounted = true
  
  const loadNotifications = async () => {
    // Consulta Supabase en cada render si userId existe
  }
  
  loadNotifications()
  
  return () => { mounted = false }
}, [userId]) // Se ejecuta cada vez que userId cambia
```

#### 2.2 Cálculos Pesados en Render

**Detectados en**:
- `lib/ieq-calculator.ts::calculateGranularity()` (200+ líneas, entropía, familias)
- `lib/ieq-calculator.ts::calculateEmotionalAwareness()` (150+ líneas, múltiples sub-scores)
- Llamados desde `ieq-panel.tsx` en `useEffect` sin Web Workers

**Consecuencia**:
- UI bloqueada durante cálculos
- Experiencia lenta en dispositivos móviles de gama baja
- Imposible escalar a miles de check-ins

#### 2.3 Sin Cacheo de Queries

**Problema**:
- Cada componente hace sus propias queries a Supabase
- No hay caché de resultados (React Query / SWR)
- Mismos datos solicitados múltiples veces

**Ejemplo**:
```typescript
// components/vladi/ieq-panel.tsx
const { data: entries } = await supabase.from('emotion_entries')...

// components/vladi/social-feed.tsx  
const { data: entries } = await supabase.from('emotion_entries')... // Duplicado

// components/vladi/home-view.tsx
const { count } = await supabase.from('friend_requests')... // Siempre fresh
```

### 3. PROBLEMAS DE MANTENIBILIDAD

#### 3.1 Sin Versionado del Modelo DEAM

**Estado actual**:
- Cálculos directos sin versión
- Imposible comparar métricas de diferentes versiones del algoritmo
- Cambios en fórmulas invalidan históricos

**Debería ser**:
```typescript
interface MetricSnapshot {
  computed_at: string
  model_version: 'DEAM_EQ_v1.0' | 'DEAM_EQ_v1.1'
  values: Record<string, number>
}
```

#### 3.2 Console.logs Sin Eliminar

**Detectados**: 48 ocurrencias

**Ejemplos**:
```typescript
// app/auth/sign-up/page.tsx
console.log("[v0] Starting user registration with email:", email)
console.log("[v0] User created successfully, profile created automatically by trigger")

// app/app/page.tsx
console.error("[v0] Auth error:", e)
console.error("[v0] Profile error:", profileError)

// components/vladi/vladi-app.tsx
console.error("Error saving emotion:", error)
console.error("Error loading notifications:", error)
```

**Problema**:
- Logs de debugging en producción
- Información sensible expuesta
- Ruido en consola

#### 3.3 Naming Inconsistente

**Detectado**:
```typescript
// Mezcla de camelCase y snake_case
emotion_entries  // snake_case (DB)
emotionData      // camelCase (código)
user_id          // snake_case
userId           // camelCase

// Nombres genéricos
calculateMetrics()     // ¿Qué métricas?
loadData()             // ¿Qué datos?
handleSubmit()         // ¿Qué submit?
```

#### 3.4 Tipos Duplicados

**Detectados**:
```typescript
// lib/vladi-types.ts
export interface EmotionEntry { ... }

// lib/ieq-calculator.ts
export interface EmotionEntry { ... } // Diferente definición

// lib/vladi-store.ts
export interface MoodEntry { ... } // Mismo concepto, nombre diferente
```

### 4. PROBLEMAS DE SEGURIDAD Y DATOS

#### 4.1 Validación Inconsistente

**Problema**:
- Datos guardados sin validación de esquema
- Campos opcionales tratados como requeridos
- No hay schemas Zod/Yup

**Ejemplo**:
```typescript
// components/vladi/vladi-app.tsx
await supabase.from("emotion_entries").insert({
  emotion: emotionData.emotion, // ¿Validado?
  intensity: emotionData.intensity, // ¿0-100?
  // ... sin validación previa
})
```

#### 4.2 Manejo de Errores Básico

**Detectado**:
```typescript
try {
  await supabase.from(...).insert(...)
} catch (error) {
  console.error("Error saving emotion:", error) // Solo log
  // No hay retry, no hay UI feedback, no hay tracking
}
```

### 5. ESTRUCTURA ACTUAL vs IDEAL

#### Estructura Actual

```
app/
├── auth/           # Auth pages (OK)
├── app/            # Protected routes (confuso)
│
components/vladi/   # ⚠️ TODO mezclado
├── vladi-app.tsx   # 271 líneas, lógica + UI
├── ieq-panel.tsx   # 736 líneas, cálculos + UI
├── social-feed.tsx # 571 líneas, todo en uno
├── check-in-flow.tsx
└── ... (30+ componentes sin organizar)

lib/
├── ieq-calculator.ts        # 701 líneas
├── emotional-state-calculator.ts  # Duplicado
├── vladi-store.ts           # Store + lógica
├── vladi-types.ts           # Tipos mezclados
└── supabase/                # OK
```

#### Estructura Ideal (Propuesta)

```
src/
├── app/                     # Next.js routes
│   ├── (auth)/             # Auth routes group
│   │   ├── login/
│   │   └── sign-up/
│   └── (protected)/        # Protected routes
│       ├── home/
│       ├── stats/
│       ├── learn/
│       └── profile/
│
├── features/               # Dominios (NO pantallas)
│   ├── auth/
│   │   ├── hooks/          # useAuth, useSession
│   │   ├── components/     # LoginForm, SignUpForm
│   │   └── services/       # authService.ts
│   │
│   ├── checkin/
│   │   ├── domain/         # CheckIn, validations
│   │   ├── components/     # UI puro
│   │   ├── hooks/          # useCheckIn
│   │   └── services/       # createCheckIn, getCheckIns
│   │
│   ├── deam-eq/           # Motor de métricas
│   │   ├── domain/
│   │   │   ├── metrics/
│   │   │   │   ├── granularity.ts
│   │   │   │   ├── emotional-state.ts
│   │   │   │   ├── inertia.ts
│   │   │   │   └── awareness.ts
│   │   │   └── types.ts
│   │   ├── calculator.ts   # Orquestador
│   │   └── version.ts      # DEAM_EQ_v1.0
│   │
│   ├── stats/
│   │   ├── components/     # Charts, panels
│   │   ├── hooks/          # useIEQData
│   │   └── services/       # statsService
│   │
│   └── social/
│       ├── components/     # Feed, Comments
│       ├── hooks/          # useFeed, useFriends
│       └── services/       # feedService, friendsService
│
├── core/
│   ├── ui/                 # Componentes puros (shadcn)
│   ├── domain/             # Tipos compartidos, validaciones
│   ├── data/               # Repositories, DB access
│   │   ├── repositories/
│   │   │   ├── checkin.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   └── metric.repository.ts
│   │   └── supabase/       # Cliente Supabase
│   └── lib/                # Utilidades
│       ├── dates.ts
│       ├── i18n.ts
│       └── logger.ts
│
├── services/              # Servicios externos
│   ├── metrics-engine/
│   └── insights-ia/
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🎯 PLAN DE REFACTORIZACIÓN

### NIVEL 1: Quick Wins (Seguro, Sin Riesgo) - 2-3 días

#### 1.1 Limpieza de Código

**Tareas**:
- [ ] Eliminar todos los `console.log` y `console.error` (48 ocurrencias)
- [ ] Implementar logger centralizado con niveles (dev/prod)
- [ ] Eliminar código comentado
- [ ] Unificar naming: todo camelCase en código, snake_case solo en DB

**Archivos a modificar**:
- Todos los archivos con console.log
- Crear `core/lib/logger.ts`

**Verificación**:
- ✅ No console.log en build de producción
- ✅ UI idéntica

#### 1.2 Consolidar Tipos

**Tareas**:
- [ ] Unificar `EmotionEntry` (3 definiciones → 1)
- [ ] Renombrar `MoodEntry` → `CheckInEntry`
- [ ] Crear barrel exports en `core/domain/types/index.ts`

**Archivos**:
- `core/domain/types/checkin.ts` (nuevo)
- `core/domain/types/user.ts` (nuevo)
- `core/domain/types/metric.ts` (nuevo)
- Borrar duplicados en `lib/vladi-types.ts`, `lib/ieq-calculator.ts`

**Verificación**:
- ✅ TypeScript compila sin errores
- ✅ Imports actualizados

#### 1.3 Memoizar Funciones Costosas

**Tareas**:
- [ ] Envolver cálculos DEAM en `useMemo`
- [ ] Memoizar callbacks con `useCallback`
- [ ] Implementar `React.memo` en componentes puros

**Ejemplo**:
```typescript
// Antes
const metrics = calculateDEAMMetrics(entries)

// Después
const metrics = useMemo(() => 
  calculateDEAMMetrics(entries), 
  [entries]
)
```

**Archivos**:
- `components/vladi/ieq-panel.tsx`
- `components/vladi/stats-view.tsx`

**Verificación**:
- ✅ Menos re-renders (React DevTools)
- ✅ UI idéntica

---

### NIVEL 2: Unificación (Componentes + Servicios + Hooks) - 1 semana

#### 2.1 Separar Lógica de UI

**Fase A: Extraer Hooks**

Crear hooks personalizados que encapsulen lógica:

```typescript
// features/stats/hooks/use-ieq-data.ts
export function useIEQData(userId: string, period: TimePeriod) {
  const [data, setData] = useState<IEQData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await statsService.getIEQData(userId, period)
      setData(result)
      setLoading(false)
    }
    load()
  }, [userId, period])
  
  return { data, loading }
}
```

**Hooks a crear**:
- [ ] `features/checkin/hooks/use-checkin.ts`
- [ ] `features/stats/hooks/use-ieq-data.ts`
- [ ] `features/social/hooks/use-feed.ts`
- [ ] `features/social/hooks/use-friends.ts`
- [ ] `features/auth/hooks/use-auth.ts`

**Fase B: Extraer Services**

Servicios que encapsulan acceso a datos:

```typescript
// features/stats/services/stats.service.ts
export const statsService = {
  async getIEQData(userId: string, period: TimePeriod): Promise<IEQData> {
    // 1. Obtener entradas del repositorio
    const entries = await checkinRepository.getByUserAndPeriod(userId, period)
    
    // 2. Calcular métricas con el engine
    const metrics = deamEngine.calculate(entries)
    
    // 3. Retornar datos formateados
    return formatIEQData(metrics)
  }
}
```

**Services a crear**:
- [ ] `features/checkin/services/checkin.service.ts`
- [ ] `features/stats/services/stats.service.ts`
- [ ] `features/social/services/feed.service.ts`
- [ ] `features/social/services/friends.service.ts`

**Fase C: Crear Repositories**

Capa que abstrae acceso a Supabase:

```typescript
// core/data/repositories/checkin.repository.ts
export const checkinRepository = {
  async getByUserAndPeriod(
    userId: string, 
    periodDays: number
  ): Promise<CheckInEntry[]> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - periodDays)
    
    const { data, error } = await supabase
      .from('emotion_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) throw new RepositoryError('Failed to load check-ins', error)
    
    return data.map(mapToCheckInEntry)
  },
  
  async create(entry: CreateCheckInDTO): Promise<CheckInEntry> {
    // Validar con Zod
    const validated = createCheckInSchema.parse(entry)
    
    // Insertar
    const { data, error } = await supabase
      .from('emotion_entries')
      .insert(validated)
      .select()
      .single()
    
    if (error) throw new RepositoryError('Failed to create check-in', error)
    
    return mapToCheckInEntry(data)
  }
}
```

**Repositories a crear**:
- [ ] `core/data/repositories/checkin.repository.ts`
- [ ] `core/data/repositories/user.repository.ts`
- [ ] `core/data/repositories/metric.repository.ts`
- [ ] `core/data/repositories/friend.repository.ts`

#### 2.2 Unificar Cálculos DEAM

**Objetivo**: 1 solo motor de cálculo, eliminar duplicados

**Paso 1**: Refactorizar `lib/ieq-calculator.ts`

Dividir en módulos pequeños:

```
features/deam-eq/
├── domain/
│   ├── metrics/
│   │   ├── granularity.ts        # calculateGranularity()
│   │   ├── emotional-state.ts    # calculateEmotionalState()
│   │   ├── inertia.ts            # calculateInertia()
│   │   ├── awareness.ts          # calculateEmotionalAwareness()
│   │   └── deam-score.ts         # calculateDEAMScore()
│   ├── types.ts
│   └── version.ts                # DEAM_EQ_VERSION = '1.0'
├── calculator.ts                 # Orquestador principal
└── index.ts                      # Public API
```

**Paso 2**: Implementar versionado

```typescript
// features/deam-eq/domain/version.ts
export const DEAM_EQ_VERSION = '1.0' as const

export interface MetricSnapshot {
  computed_at: string
  model_version: typeof DEAM_EQ_VERSION
  user_id: string
  period_days: number
  metrics: {
    emotional_state: EmotionalStateResult
    deam_score: number
    granularity: number
    inertia: number
    awareness: number
  }
}
```

**Paso 3**: Eliminar cálculos duplicados

- [ ] Borrar `lib/emotional-state-calculator.ts` (usar el de `ieq-calculator`)
- [ ] Eliminar `calculateMetrics()` de `vladi-store.ts`
- [ ] Consolidar funciones de inercia (2 versiones → 1)

**Verificación**:
- ✅ Todos los cálculos usan el mismo código
- ✅ Resultados idénticos a versión anterior
- ✅ Tests unitarios para cada métrica

#### 2.3 Implementar React Query

**Objetivo**: Cacheo inteligente, re-fetches automáticos

```bash
pnpm add @tanstack/react-query
```

**Configurar**:
```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      cacheTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Migrar queries**:
```typescript
// Antes
const [entries, setEntries] = useState([])
useEffect(() => {
  loadEntries()
}, [userId])

// Después
import { useQuery } from '@tanstack/react-query'

const { data: entries, isLoading } = useQuery({
  queryKey: ['checkins', userId, period],
  queryFn: () => checkinRepository.getByUserAndPeriod(userId, period),
  enabled: !!userId,
})
```

**Queries a migrar**:
- [ ] Check-ins
- [ ] IEQ data
- [ ] Social feed
- [ ] Friend requests
- [ ] Notificaciones

**Beneficios**:
- ✅ Caché automático
- ✅ Re-fetch inteligente
- ✅ Loading/Error states consistentes
- ✅ Menos código

---

### NIVEL 3: Arquitectura Escalable (Capas + Boundaries) - 2 semanas

#### 3.1 Implementar Arquitectura por Dominios

**Migración por feature**:

1. **Feature: Auth** (1 día)
   - Mover `app/auth/*` → `features/auth/`
   - Crear `authService`, `useAuth`
   - Implementar `AuthProvider` con Context

2. **Feature: Check-in** (2 días)
   - Extraer flujo completo de `check-in-flow.tsx`
   - Crear domain models: `CheckIn`, `Emotion`, `Context`
   - Implementar validaciones con Zod
   - Crear `checkinService`, `useCheckIn`

3. **Feature: DEAM EQ** (3 días)
   - Refactorizar motor de cálculo
   - Dividir en módulos pequeños (granularity, state, inertia, awareness)
   - Implementar versionado
   - Tests unitarios completos

4. **Feature: Stats** (2 días)
   - Separar `ieq-panel.tsx` en componentes pequeños
   - Crear `statsService`, `useIEQData`
   - Implementar lazy loading de charts

5. **Feature: Social** (2 días)
   - Dividir `social-feed.tsx` en Feed + Comments + FriendRequests
   - Crear `feedService`, `friendsService`
   - Implementar infinite scroll

#### 3.2 Implementar Validaciones con Zod

**Schemas a crear**:

```typescript
// features/checkin/domain/schemas.ts
import { z } from 'zod'

export const checkInSchema = z.object({
  emotion: z.string().min(1, 'Emoción requerida'),
  intensity: z.number().min(0).max(100),
  quadrant: z.enum(['green', 'yellow', 'red', 'blue']),
  valence: z.number().min(-1).max(1),
  arousal: z.number().min(-1).max(1),
  context: z.object({
    activity: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    bodySignals: z.array(z.string()).optional(),
    timeReference: z.string().optional(),
    certainty: z.enum(['sure', 'unsure', 'confused']).optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
})

export type CreateCheckInDTO = z.infer<typeof checkInSchema>
```

**Usar en repositories**:
```typescript
async create(data: unknown): Promise<CheckInEntry> {
  // Validar entrada
  const validated = checkInSchema.parse(data)
  
  // Insertar en DB
  const { data: result, error } = await supabase
    .from('emotion_entries')
    .insert(validated)
    .select()
    .single()
  
  if (error) throw new RepositoryError('Failed to create', error)
  
  return mapToCheckInEntry(result)
}
```

#### 3.3 Implementar Error Boundaries

**Crear componentes de error**:

```typescript
// core/ui/error-boundary.tsx
import { Component, ReactNode } from 'react'
import { logger } from '@/core/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('ErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
            <p className="text-muted-foreground mb-4">
              Estamos trabajando para solucionar el problema.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Envolver features críticos**:
```typescript
// app/layout.tsx
<ErrorBoundary>
  <Providers>
    {children}
  </Providers>
</ErrorBoundary>
```

#### 3.4 Implementar Logger Profesional

```typescript
// core/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  sessionId?: string
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'
  
  debug(message: string, data?: any) {
    if (this.isDev) {
      this.log('debug', message, data)
    }
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data)
  }
  
  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }
  
  error(message: string, data?: any) {
    this.log('error', message, data)
    // En producción, enviar a servicio de tracking (Sentry, LogRocket)
    if (!this.isDev) {
      this.sendToTracking({ level: 'error', message, data })
    }
  }
  
  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }
    
    const method = level === 'error' ? console.error : 
                   level === 'warn' ? console.warn : 
                   console.log
    
    method(`[${level.toUpperCase()}] ${message}`, data)
  }
  
  private sendToTracking(entry: LogEntry) {
    // Implementar integración con Sentry/LogRocket/etc
  }
}

export const logger = new Logger()
```

**Reemplazar console.log**:
```typescript
// Antes
console.log("[v0] User data:", userData)
console.error("Error loading data:", error)

// Después
logger.debug("User data loaded", { userData })
logger.error("Failed to load data", { error: error.message })
```

#### 3.5 Code Splitting y Lazy Loading

**Implementar lazy loading**:
```typescript
// app/(protected)/stats/page.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/core/ui/skeleton'

const IEQPanel = lazy(() => import('@/features/stats/components/ieq-panel'))

export default function StatsPage() {
  return (
    <Suspense fallback={<IEQPanelSkeleton />}>
      <IEQPanel userId={userId} />
    </Suspense>
  )
}
```

**Features a lazy-load**:
- [ ] IEQ Panel (736 líneas)
- [ ] Social Feed (571 líneas)
- [ ] Check-in Flow (520 líneas)
- [ ] Charts/Visualizaciones

#### 3.6 Testing

**Configurar Jest + Testing Library**:
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

**Tests prioritarios**:

1. **Domain Logic** (crítico):
   - `features/deam-eq/domain/metrics/*.test.ts`
   - Granularity, Emotional State, Inertia, Awareness
   - Validar fórmulas y casos edge

2. **Repositories** (importante):
   - `core/data/repositories/*.test.ts`
   - Mocks de Supabase
   - Validar transformaciones

3. **Hooks** (importante):
   - `features/*/hooks/*.test.tsx`
   - Validar estados y side effects

4. **E2E** (humo):
   - Login → Check-in → Ver Stats
   - Registro → Onboarding
   - Social: Publicar → Ver feed

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Después de Nivel 1 (Quick Wins)

- [ ] ✅ Build sin errores
- [ ] ✅ TypeScript sin warnings
- [ ] ✅ No console.log en producción
- [ ] ✅ UI idéntica en todas las pantallas
- [ ] ✅ Flujos críticos funcionan:
  - [ ] Login / Registro
  - [ ] Check-in completo
  - [ ] Ver estadísticas
  - [ ] Social feed
  - [ ] Perfil

### Después de Nivel 2 (Unificación)

- [ ] ✅ Todos los cálculos DEAM usando mismo código
- [ ] ✅ React Query implementado
- [ ] ✅ Hooks extraídos de componentes
- [ ] ✅ Services creados y funcionando
- [ ] ✅ Repositories implementados
- [ ] ✅ Tipos consolidados
- [ ] ✅ Performance mejorado (medir con React DevTools)
- [ ] ✅ No duplicación de queries

### Después de Nivel 3 (Arquitectura)

- [ ] ✅ Estructura por dominios implementada
- [ ] ✅ Validaciones Zod en toda la app
- [ ] ✅ Error boundaries funcionando
- [ ] ✅ Logger profesional implementado
- [ ] ✅ Code splitting aplicado
- [ ] ✅ Tests críticos pasando (>70% coverage en domain)
- [ ] ✅ Build optimizado (<3MB main bundle)
- [ ] ✅ Lighthouse score >90 en mobile

---

## 🚀 PRÓXIMOS PASOS

### Después del Refactor

1. **Implementar caché de métricas**
   - Guardar snapshots en DB
   - No recalcular en cada request
   - Invalidación inteligente

2. **Web Workers para cálculos**
   - Mover DEAM engine a worker
   - No bloquear UI

3. **Optimistic Updates**
   - Check-ins sin esperar DB
   - Mejor UX

4. **Infinite Scroll**
   - Feed y stats con paginación
   - Cursor-based pagination

5. **Realtime Updates**
   - Supabase Realtime para feed
   - Notificaciones en tiempo real

6. **Internacionalización**
   - i18n con next-intl
   - Timezone handling robusto

7. **Feature Flags**
   - Despliegue gradual
   - A/B testing

8. **Monitoring**
   - Sentry para errors
   - LogRocket para sesiones
   - Mixpanel/Amplitude para analytics

---

## 💰 ESTIMACIÓN DE ESFUERZO

| Nivel | Tareas | Tiempo | Riesgo | Impacto |
|-------|--------|--------|--------|---------|
| **Nivel 1** | Quick Wins | 2-3 días | Bajo | Alto |
| **Nivel 2** | Unificación | 1 semana | Medio | Muy Alto |
| **Nivel 3** | Arquitectura | 2 semanas | Alto | Crítico |
| **Testing** | Coverage >70% | 3-4 días | Bajo | Alto |
| **Documentación** | Docs + Onboarding | 2 días | Bajo | Medio |

**Total**: ~4 semanas (1 desarrollador senior full-time)

---

## 🎓 CONCLUSIONES

### Estado Actual
VLADI funciona correctamente desde el punto de vista del usuario, pero tiene **deuda técnica significativa** que impide escalar.

### Cambios Necesarios
La refactorización propuesta **no cambia ningún pixel de la UI**, solo reorganiza el código internamente para:
- Hacerlo mantenible
- Hacerlo testeable
- Hacerlo escalable
- Hacerlo profesional

### Beneficios Post-Refactor
1. **Velocidad**: Componentes más ligeros, menos re-renders
2. **Estabilidad**: Menos bugs, error handling robusto
3. **Escalabilidad**: Preparado para millones de usuarios
4. **Mantenibilidad**: Fácil añadir features sin romper nada
5. **Onboarding**: Nuevos devs entienden el código rápido

### Riesgo de NO Hacerlo
- Bugs cada vez más frecuentes
- Imposible añadir features complejas
- Performance degradándose
- Código cada vez más difícil de entender
- Eventual rewrite completo necesario

---

**Firma**: Arquitecto VLADI  
**Fecha**: 23 Diciembre 2025  
**Versión**: 1.0

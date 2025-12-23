// Centralized error handling utility
"use client"

type ErrorSeverity = "info" | "warning" | "error" | "critical"

interface ErrorContext {
  userId?: string
  action?: string
  component?: string
  metadata?: Record<string, any>
}

class ErrorHandler {
  private isDevelopment = process.env.NODE_ENV === "development"

  log(message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`[VLADI] ${message}`, data)
    }
  }

  handleError(error: Error | unknown, severity: ErrorSeverity = "error", context?: ErrorContext) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    // Log to console in development
    if (this.isDevelopment) {
      console.error(`[VLADI ${severity.toUpperCase()}]`, {
        message: errorMessage,
        stack: errorStack,
        context,
      })
    }

    // In production, you would send to error tracking service
    if (!this.isDevelopment && severity === "critical") {
      this.sendToErrorTracking({
        message: errorMessage,
        stack: errorStack,
        severity,
        context,
        timestamp: new Date().toISOString(),
      })
    }

    // Return user-friendly message
    return this.getUserFriendlyMessage(errorMessage, severity)
  }

  private sendToErrorTracking(errorData: any) {
    // Placeholder for error tracking service integration
    // Example: Sentry, LogRocket, etc.
  }

  private getUserFriendlyMessage(errorMessage: string, severity: ErrorSeverity): string {
    if (severity === "info" || severity === "warning") {
      return errorMessage
    }

    // Map technical errors to user-friendly messages
    if (errorMessage.includes("auth") || errorMessage.includes("unauthorized")) {
      return "Error de autenticación. Por favor, inicia sesión nuevamente."
    }

    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return "Error de conexión. Por favor, verifica tu conexión a internet."
    }

    if (errorMessage.includes("database") || errorMessage.includes("supabase")) {
      return "Error al guardar los datos. Por favor, intenta nuevamente."
    }

    return "Ha ocurrido un error inesperado. Por favor, intenta nuevamente."
  }

  async withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: ErrorContext,
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const data = await fn()
      return { data, error: null }
    } catch (error) {
      const errorMessage = this.handleError(error, "error", context)
      return { data: null, error: errorMessage }
    }
  }
}

export const errorHandler = new ErrorHandler()

export function logDev(message: string, data?: any) {
  errorHandler.log(message, data)
}

export function handleError(error: Error | unknown, severity: ErrorSeverity = "error", context?: ErrorContext) {
  return errorHandler.handleError(error, severity, context)
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: ErrorContext,
): Promise<{ data: T | null; error: string | null }> {
  return errorHandler.withErrorHandling(fn, context)
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-serif text-2xl font-medium mb-2">¡Registro completado!</h1>
        <p className="text-gray-500 mb-8">
          Hemos enviado un correo de confirmación a tu email. Por favor, verifica tu cuenta para continuar.
        </p>

        <Button asChild className="w-full h-12 rounded-xl bg-black hover:bg-gray-800">
          <Link href="/auth/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="font-serif text-2xl font-medium mb-2">Algo salió mal</h1>
        <p className="text-gray-500 mb-2">Ha ocurrido un error durante la autenticación.</p>
        {params?.error && <p className="text-sm text-red-500 mb-8">Código: {params.error}</p>}

        <Button asChild className="w-full h-12 rounded-xl bg-black hover:bg-gray-800">
          <Link href="/auth/login">Volver a intentar</Link>
        </Button>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-foreground">Football Scouting App</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Professional player analysis and market evaluation platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-input rounded-lg font-semibold hover:bg-accent"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

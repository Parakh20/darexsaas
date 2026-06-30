export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
        <p className="text-gray-400 mb-6">Something went wrong during sign in. Please try again.</p>
        <a href="/auth/signin" className="text-blue-400 hover:text-blue-300">Back to sign in</a>
      </div>
    </div>
  );
}

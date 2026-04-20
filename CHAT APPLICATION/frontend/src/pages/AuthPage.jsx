function AuthPage({
  mode,
  setMode,
  username,
  setUsername,
  password,
  setPassword,
  status,
  onSubmit,
}) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-10">
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <h1 className="text-2xl font-bold">Interactive Chat App</h1>
        <p className="mt-2 text-sm text-slate-300">Signup or login to start private real-time chat.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className={`rounded-lg px-3 py-2 ${mode === "signup" ? "bg-blue-600" : "bg-slate-700"}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Signup
          </button>
          <button
            className={`rounded-lg px-3 py-2 ${mode === "login" ? "bg-blue-600" : "bg-slate-700"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="w-full rounded-lg bg-blue-600 py-2 font-semibold" type="submit">
            {mode === "signup" ? "Create Account" : "Login"}
          </button>
        </form>
        <p className="mt-3 min-h-5 text-sm text-rose-300">{status}</p>
      </section>
    </main>
  );
}

export default AuthPage;

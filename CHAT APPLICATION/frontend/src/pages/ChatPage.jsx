function ChatPage({
  user,
  members,
  selected,
  setSelected,
  activeMessages,
  text,
  setText,
  onSend,
  onLogout,
}) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-6">
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Welcome, {user.username}</h2>
            <p className="text-sm text-slate-300">Chat with any member in real-time.</p>
          </div>
          <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold" onClick={onLogout}>
            Logout
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <aside className="rounded-xl bg-slate-900 p-3">
            <h3 className="mb-2 font-semibold">Members</h3>
            <div className="space-y-2">
              {members
                .filter((item) => item.username !== user.username)
                .map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelected(member.username)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${
                      selected === member.username ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  >
                    <span>{member.username}</span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${member.online ? "bg-emerald-400" : "bg-slate-500"}`}
                    />
                  </button>
                ))}
            </div>
          </aside>

          <section className="rounded-xl bg-slate-900 p-3">
            <h3 className="font-semibold">{selected ? `Chat with ${selected}` : "Select a member to chat"}</h3>
            <div className="mt-3 h-[420px] overflow-y-auto rounded-lg border border-slate-700 p-3">
              {activeMessages.map((msg, index) => {
                const self = msg.from === user.username;
                return (
                  <div key={`${msg.timestamp}-${index}`} className={`mb-3 flex ${self ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${self ? "bg-blue-600" : "bg-slate-700"}`}>
                      <p>{msg.message}</p>
                      <p className="mt-1 text-[11px] text-slate-200">
                        {msg.from} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={onSend}>
              <input
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
                placeholder={selected ? "Type a message..." : "Choose a member first"}
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={!selected}
              />
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={!selected}
              >
                Send
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

export default ChatPage;

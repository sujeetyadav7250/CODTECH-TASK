import { useState } from "react";
import { useNavigate } from "react-router-dom";

function randomRoomId() {
  return Math.random().toString(36).slice(2, 10);
}

/* Updated Logo */
function AppLogo() {
  return (
    <svg
      className="h-10 w-10 text-emerald-400"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 12h8M12 8v8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function JoinPage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    const rid = roomId.trim();
    const name = username.trim();

    if (!rid || !name) return;

    navigate(`/editor/${encodeURIComponent(rid)}`, {
      state: { username: name },
    });
  };

  const handleNewRoom = () => {
    setRoomId(randomRoomId());
  };

  return (
    <div className="flex min-h-screen items-center justify-center 
    bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] px-4">

      {/* Glass Card */}
      <div className="w-full max-w-md rounded-2xl 
      bg-white/5 backdrop-blur-lg 
      border border-white/10 
      p-8 shadow-2xl">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4">

          <div className="flex items-center gap-3">
            <AppLogo />

            {/* 🔁 Changed Name */}
            <span className="text-lg font-bold tracking-widest text-white">
              CODEMEET
            </span>
          </div>

          <h1 className="text-center text-lg text-gray-300">
            Join or Create a Room 🚀
          </h1>

        </div>

        {/* Form */}
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4"
        >

          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="rounded-lg border border-gray-600 
            bg-white px-4 py-3 text-sm 
            focus:outline-none 
            focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Username"
            className="rounded-lg border border-gray-600 
            bg-white px-4 py-3 text-sm 
            focus:outline-none 
            focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="submit"
            className="rounded-lg 
            bg-emerald-600 
            py-3 font-semibold text-white
            transition duration-200
            hover:bg-emerald-500
            active:scale-95"
          >
            Join Room
          </button>

        </form>

        {/* Create Room */}
        <p className="mt-6 text-center text-sm text-gray-400">

          Don't have a Room ID?{" "}

          <button
            type="button"
            onClick={handleNewRoom}
            className="font-semibold text-emerald-400 
            hover:underline"
          >
            Create New Room ✨
          </button>

        </p>

      </div>

    </div>
  );
}
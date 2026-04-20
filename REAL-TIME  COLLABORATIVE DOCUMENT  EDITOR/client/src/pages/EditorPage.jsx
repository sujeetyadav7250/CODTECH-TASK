// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import { io } from "socket.io-client";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// function TeleLogoSm() {
//   return (
//     <svg
//       className="h-7 w-7 shrink-0 text-emerald-400"
//       viewBox="0 0 24 24"
//       fill="none"
//       xmlns="http://www.w3.org/2000/svg"
//       aria-hidden
//     >
//       <path
//         d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
//         stroke="currentColor"
//         strokeWidth="1.5"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }

// function initials(name) {
//   const p = name.trim().split(/\s+/).filter(Boolean);
//   if (p.length >= 2) return (p[0][0] + p[1][0]).slice(0, 3).toUpperCase();
//   return name.trim().slice(0, 2).toUpperCase() || "?";
// }

// export default function EditorPage() {
//   const { roomId: roomParam } = useParams();
//   const roomId = roomParam ? decodeURIComponent(roomParam) : "";
//   const navigate = useNavigate();
//   const location = useLocation();
//   const usernameFromState = location.state?.username;

//   const [username] = useState(() => {
//     if (usernameFromState && String(usernameFromState).trim()) {
//       return String(usernameFromState).trim().slice(0, 40);
//     }
//     return `User-${Math.random().toString(36).slice(2, 6)}`;
//   });

//   const [editorText, setEditorText] = useState("");
//   const [status, setStatus] = useState("Connecting...");
//   const [lastSaved, setLastSaved] = useState("");
//   const [members, setMembers] = useState([]);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const isRemoteUpdate = useRef(false);
//   const gutterRef = useRef(null);

//   const socket = useMemo(
//     () =>
//       io(API_URL, {
//         // Polling first avoids failures when websocket-only handshake is blocked
//         transports: ["polling", "websocket"],
//         reconnection: true,
//         reconnectionAttempts: 10,
//       }),
//     []
//   );

//   useEffect(() => {
//     // After cleanup disconnect() (e.g. React Strict Mode remount), explicitly reconnect.
//     socket.connect();

//     const emitJoin = () => {
//       if (!roomId.trim()) return;
//       socket.emit("join-document", {
//         roomId: roomId.trim(),
//         username,
//       });
//     };

//     const onConnect = () => {
//       setStatus("Connected");
//       emitJoin();
//     };

//     socket.on("connect", onConnect);
//     socket.on("disconnect", () => setStatus("Disconnected"));
//     socket.on("connect_error", (err) => {
//       setStatus(`Error: ${err.message || "cannot reach server"}`);
//     });
//     socket.on("load-document", (content) => {
//       setEditorText(content || "");
//       setStatus("Ready");
//     });
//     socket.on("receive-changes", (delta) => {
//       isRemoteUpdate.current = true;
//       setEditorText(delta);
//     });
//     socket.on("document-saved", (timestamp) => {
//       setLastSaved(new Date(timestamp).toLocaleTimeString());
//     });
//     socket.on("room-members", (list) => {
//       setMembers(Array.isArray(list) ? list : []);
//     });

//     if (socket.connected) {
//       setStatus("Connected");
//       emitJoin();
//     }

//     return () => {
//       socket.removeAllListeners();
//       socket.disconnect();
//     };
//   }, [socket, roomId, username]);

//   useEffect(() => {
//     if (!roomId.trim()) return;
//     const interval = setInterval(() => {
//       socket.emit("save-document", {
//         roomId: roomId.trim(),
//         content: editorText,
//       });
//     }, 2000);
//     return () => clearInterval(interval);
//   }, [editorText, roomId, socket]);

//   const handleEditorChange = (event) => {
//     const nextValue = event.target.value;
//     setEditorText(nextValue);
//     if (isRemoteUpdate.current) {
//       isRemoteUpdate.current = false;
//       return;
//     }
//     socket.emit("send-changes", { roomId: roomId.trim(), content: nextValue });
//   };

//   const lineCount = Math.max(1, editorText.split("\n").length);
//   const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

//   const copyRoomId = useCallback(async () => {
//     try {
//       await navigator.clipboard.writeText(roomId);
//     } catch {
//       window.prompt("Copy room ID:", roomId);
//     }
//   }, [roomId]);

//   const downloadFile = useCallback(() => {
//     const blob = new Blob([editorText], { type: "text/plain;charset=utf-8" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `telepresence-${roomId.slice(0, 20)}.txt`;
//     a.click();
//     URL.revokeObjectURL(url);
//   }, [editorText, roomId]);

//   const leaveRoom = () => {
//     navigate("/");
//   };

//   const handleTextScroll = (e) => {
//     const top = e.target.scrollTop;
//     if (gutterRef.current) gutterRef.current.scrollTop = top;
//   };

//   return (
//     <div className="flex min-h-[100dvh] flex-col bg-[#0b1220] md:h-screen md:min-h-0 md:flex-row">
//       {/* Mobile top bar */}
//       <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-2 md:hidden">
//         <button
//           type="button"
//           onClick={() => setSidebarOpen(true)}
//           className="rounded-md p-2 text-slate-300 hover:bg-slate-800"
//           aria-label="Open menu"
//         >
//           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//           </svg>
//         </button>
//         <span className="text-xs font-semibold tracking-widest text-slate-400">TELEPRESENCE</span>
//         <button
//           type="button"
//           onClick={downloadFile}
//           className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
//         >
//           Download
//         </button>
//       </div>

//       {sidebarOpen && (
//         <button
//           type="button"
//           className="fixed inset-0 z-30 bg-black/60 md:hidden"
//           aria-label="Close menu"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       <aside
//         className={`fixed inset-y-0 left-0 z-40 flex w-[min(100%,18rem)] flex-col border-r border-slate-800 bg-[#0f172a] transition-transform duration-200 ease-out md:relative md:z-0 md:translate-x-0 md:flex md:w-64 md:shrink-0 ${
//           sidebarOpen ? "translate-x-0" : "-translate-x-full"
//         }`}
//       >
//         <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
//           <TeleLogoSm />
//           <span className="text-sm font-semibold tracking-[0.15em] text-white">TELEPRESENCE</span>
//         </div>

//         <div className="px-4 pt-4">
//           <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Members</h2>
//           <ul className="mt-3 space-y-2">
//             {members.length === 0 && (
//               <li className="text-sm text-slate-500">Waiting for collaborators…</li>
//             )}
//             {members.map((m) => (
//               <li key={m.id} className="flex items-center gap-3">
//                 <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
//                   {initials(m.name)}
//                 </span>
//                 <span className="truncate text-sm text-slate-200">{m.name}</span>
//               </li>
//             ))}
//           </ul>
//         </div>

//         <div className="mt-auto flex flex-col gap-2 p-4">
//           <button
//             type="button"
//             onClick={() => {
//               copyRoomId();
//               setSidebarOpen(false);
//             }}
//             className="w-full rounded-md bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
//           >
//             Copy Room ID
//           </button>
//           <button
//             type="button"
//             onClick={() => {
//               leaveRoom();
//               setSidebarOpen(false);
//             }}
//             className="w-full rounded-md bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
//           >
//             Leave Room
//           </button>
//           <p className="text-center text-[11px] text-slate-500">
//             {status}
//             {lastSaved ? ` · Saved ${lastSaved}` : ""}
//           </p>
//         </div>
//       </aside>

//       <div className="flex min-h-0 min-w-0 flex-1 flex-col">
//         <header className="hidden items-center justify-end border-b border-slate-800 bg-[#0b1220] px-4 py-3 md:flex">
//           <button
//             type="button"
//             onClick={downloadFile}
//             className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
//           >
//             Download File
//           </button>
//         </header>

//         <div className="flex min-h-0 flex-1 overflow-hidden p-2 md:p-4">
//           <div className="flex min-h-0 w-full flex-1 flex-row overflow-hidden rounded-lg border border-slate-800 bg-[#0a0a0a]">
//             <div
//               ref={gutterRef}
//               className="hide-scrollbar w-10 shrink-0 select-none overflow-y-auto border-r border-slate-800 bg-[#0f0f0f] py-3 text-right font-mono text-xs leading-6 text-slate-500 md:w-12"
//               aria-hidden
//             >
//               {lineNumbers.map((n) => (
//                 <div key={n} className="pr-2">
//                   {n}
//                 </div>
//               ))}
//             </div>
//             <textarea
//               value={editorText}
//               onChange={handleEditorChange}
//               onScroll={handleTextScroll}
//               spellCheck={false}
//               className="hide-scrollbar min-h-[12rem] w-full flex-1 resize-none overflow-y-auto bg-transparent px-3 py-3 font-mono text-sm leading-6 text-emerald-400 caret-emerald-400 placeholder:text-slate-600 focus:outline-none md:min-h-0"
//               placeholder="// Start typing…"
//             />
//           </div>
//         </div>
//       </div>

//       <style>{`
//         .hide-scrollbar { scrollbar-width: thin; }
//         .hide-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
//         .hide-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
//       `}</style>
//     </div>
//   );
// }








import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/* Logo */
function AppLogoSm() {
  return (
    <svg
      className="h-7 w-7 text-emerald-400"
      viewBox="0 0 24 24"
      fill="none"
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
      />
    </svg>
  );
}

/* Avatar initials */
function initials(name) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2)
    return (p[0][0] + p[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export default function EditorPage() {
  const { roomId: roomParam } = useParams();
  const roomId = roomParam
    ? decodeURIComponent(roomParam)
    : "";

  const navigate = useNavigate();
  const location = useLocation();

  const usernameFromState =
    location.state?.username;

  const [username] = useState(() => {
    if (
      usernameFromState &&
      String(usernameFromState).trim()
    ) {
      return String(usernameFromState)
        .trim()
        .slice(0, 40);
    }

    return `User-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
  });

  const [editorText, setEditorText] =
    useState("");

  const [status, setStatus] =
    useState("Connecting...");

  const [lastSaved, setLastSaved] =
    useState("");

  const [members, setMembers] =
    useState([]);

  const isRemoteUpdate = useRef(false);

  const gutterRef = useRef(null);

  const socket = useMemo(
    () =>
      io(API_URL, {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
      }),
    []
  );

  /* Socket Setup */
  useEffect(() => {
    socket.connect();

    const emitJoin = () => {
      if (!roomId.trim()) return;

      socket.emit("join-document", {
        roomId: roomId.trim(),
        username,
      });
    };

    socket.on("connect", () => {
      setStatus("Connected");
      emitJoin();
    });

    socket.on("disconnect", () =>
      setStatus("Disconnected")
    );

    socket.on(
      "connect_error",
      (err) => {
        setStatus(
          `Error: ${
            err.message ||
            "Cannot reach server"
          }`
        );
      }
    );

    socket.on(
      "load-document",
      (content) => {
        setEditorText(content || "");
        setStatus("Ready");
      }
    );

    socket.on(
      "receive-changes",
      (delta) => {
        isRemoteUpdate.current = true;
        setEditorText(delta);
      }
    );

    socket.on(
      "document-saved",
      (timestamp) => {
        setLastSaved(
          new Date(
            timestamp
          ).toLocaleTimeString()
        );
      }
    );

    socket.on("room-members", (list) => {
      setMembers(
        Array.isArray(list)
          ? list
          : []
      );
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket, roomId, username]);

  /* Auto Save */
  useEffect(() => {
    if (!roomId.trim()) return;

    const interval = setInterval(() => {
      socket.emit("save-document", {
        roomId: roomId.trim(),
        content: editorText,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [editorText, roomId, socket]);

  /* Editor Change */
  const handleEditorChange = (event) => {
    const nextValue = event.target.value;

    setEditorText(nextValue);

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    socket.emit("send-changes", {
      roomId: roomId.trim(),
      content: nextValue,
    });
  };

  /* Line Numbers */
  const lineCount = Math.max(
    1,
    editorText.split("\n").length
  );

  const lineNumbers = Array.from(
    { length: lineCount },
    (_, i) => i + 1
  );

  /* Copy Room */
  const copyRoomId =
    useCallback(async () => {
      try {
        await navigator.clipboard.writeText(
          roomId
        );
      } catch {
        window.prompt(
          "Copy room ID:",
          roomId
        );
      }
    }, [roomId]);

  /* Download */
  const downloadFile =
    useCallback(() => {
      const blob = new Blob(
        [editorText],
        {
          type:
            "text/plain;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download = `codesync-${roomId.slice(
        0,
        20
      )}.txt`;

      a.click();

      URL.revokeObjectURL(url);
    }, [editorText, roomId]);

  const leaveRoom = () => {
    navigate("/");
  };

  const handleTextScroll = (e) => {
    const top = e.target.scrollTop;

    if (gutterRef.current)
      gutterRef.current.scrollTop = top;
  };

  return (
    <div className="flex h-screen bg-[#020617]">

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#020617] flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">

          <AppLogoSm />

          <span className="text-sm font-bold tracking-widest text-white">
            CODESYNC
          </span>

        </div>

        {/* Members */}
        <div className="px-4 pt-4">

          <h2 className="text-xs font-semibold uppercase text-slate-500">
            Members
          </h2>

          <ul className="mt-3 space-y-2">

            {members.length === 0 && (
              <li className="text-sm text-slate-500">
                Waiting for collaborators…
              </li>
            )}

            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3"
              >
                <span className="
                flex h-10 w-10 items-center justify-center
                rounded-full
                bg-gradient-to-br
                from-emerald-500
                to-blue-500
                text-xs font-bold text-white
                ">

                  {initials(m.name)}

                </span>

                <span className="truncate text-sm text-slate-200">
                  {m.name}
                </span>

              </li>
            ))}

          </ul>

        </div>

        {/* Bottom Buttons */}
        <div className="mt-auto p-4 space-y-2">

          <button
            onClick={copyRoomId}
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Copy Room ID
          </button>

          <button
            onClick={leaveRoom}
            className="w-full rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Leave Room
          </button>

          {/* Status */}
          <p className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mt-2">

            <span
              className={`h-2 w-2 rounded-full ${
                status === "Connected"
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />

            {status}

            {lastSaved
              ? ` · Saved ${lastSaved}`
              : ""}

          </p>

        </div>

      </aside>

      {/* Main Section */}
      <div className="flex flex-1 flex-col">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">

          <div className="flex items-center gap-3">

            <span className="text-sm text-slate-400">
              Room:
            </span>

            <span className="rounded-md bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400">

              {roomId.slice(0, 8)}

            </span>

          </div>

          <button
            onClick={downloadFile}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Download File
          </button>

        </header>

        {/* Editor */}
        <div className="flex flex-1 overflow-hidden p-4">

          <div className="flex w-full overflow-hidden rounded-lg border border-slate-800 bg-[#020617]">

            {/* Line Numbers */}
            <div
              ref={gutterRef}
              className="w-12 overflow-y-auto border-r border-slate-800 bg-[#0f172a] py-3 text-right font-mono text-xs text-slate-500"
            >

              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className="pr-2 leading-6"
                >
                  {n}
                </div>
              ))}

            </div>

            {/* Textarea */}
            <textarea
              value={editorText}
              onChange={handleEditorChange}
              onScroll={handleTextScroll}
              spellCheck={false}
              placeholder="// Start typing code..."
              className="
              w-full resize-none overflow-y-auto
              bg-transparent
              px-4 py-3
              font-mono
              text-sm
              leading-6
              text-emerald-400
              caret-emerald-400
              focus:outline-none
              "
            />

          </div>

        </div>

      </div>

    </div>
  );
}
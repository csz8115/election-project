export default function noResultsCat() {
    return (
        <div className="flex flex-col items-center text-center text-slate-400 py-16">
            <svg
                width={220}
                height={160}
                viewBox="0 0 220 160"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4"
            >
                {/* Animations */}
                <defs>
                    <style>{`
            .breath {
              transform-origin: 110px 100px;
              animation: breathe 2.4s ease-in-out infinite;
            }
            .zzz {
              animation: float 2.2s ease-in-out infinite;
              opacity: 0.8;
            }
            .zzz2 { animation-delay: .35s; opacity: 0.6; }
            .zzz3 { animation-delay: .7s; opacity: 0.45; }

            @keyframes breathe {
              0%,100% { transform: translateY(0); }
              50% { transform: translateY(1.5px); }
            }
            @keyframes float {
              0%,100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}</style>
                </defs>

                {/* Pillow */}
                <rect
                    x="28"
                    y="104"
                    width="164"
                    height="40"
                    rx="18"
                    fill="currentColor"
                    opacity="0.08"
                />

                {/* Zzz */}
                <g
                    className="zzz"
                    fill="currentColor"
                    fontFamily="ui-sans-serif, system-ui"
                    fontWeight="700"
                >
                    <text x="162" y="60" fontSize="18">Z</text>
                    <text className="zzz2" x="176" y="52" fontSize="16">z</text>
                    <text className="zzz3" x="188" y="42" fontSize="14">z</text>
                </g>

                {/* Cat */}
                <g className="breath" fill="currentColor" stroke="currentColor">
                    {/* Body */}
                    <path
                        d="
              M70 108
              C62 92, 74 78, 98 78
              C125 78, 142 92, 150 108
              C157 124, 146 136, 122 136
              C92 136, 78 128, 70 108Z
            "
                        opacity="0.85"
                    />

                    {/* Head */}
                    <path
                        d="
              M148 106
              C148 90, 158 78, 172 78
              C186 78, 196 90, 196 106
              C196 118, 188 128, 172 128
              C156 128, 148 118, 148 106Z
            "
                        opacity="0.85"
                    />

                    {/* Ears */}
                    <path d="M158 84 L164 74 L170 86" opacity="0.85" />
                    <path d="M186 84 L180 74 L174 86" opacity="0.85" />

                    {/* Eyes (sleepy) */}
                    <path
                        d="M162 104 C166 100, 170 100, 174 104"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M172 104 C176 100, 180 100, 184 104"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    {/* Nose + mouth */}
                    <path d="M172 110 L172 112" strokeWidth="2" />
                    <path
                        d="M168 114 C170 116, 174 116, 176 114"
                        fill="none"
                        strokeWidth="2"
                    />

                    {/* Tail */}
                    <path
                        d="
              M70 120
              C54 120, 46 114, 42 106
              C38 98, 42 90, 52 90
              C60 90, 66 96, 64 104
            "
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.7"
                    />
                </g>
            </svg>

            <p className="text-lg font-medium text-slate-200 mt-4">No results found</p>
            <p className="text-sm text-slate-500">Try a different search or filter.</p>
        </div>
    );
};
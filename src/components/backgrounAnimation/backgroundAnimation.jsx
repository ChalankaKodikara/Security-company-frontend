import React from "react";

const BackgroundShapes = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* container for shapes */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className={`shape-${i} absolute rounded-full opacity-[0.18]`}
                ></div>
            ))}

            <style>
                {`
          .shape-0, .shape-1, .shape-2, .shape-3, .shape-4, .shape-5,
          .shape-6, .shape-7, .shape-8, .shape-9, .shape-10, .shape-11 {
            width: 200px;
            height: 200px;
            background: radial-gradient(circle at center, #60a5fa33, transparent);
            position: absolute;
            border-radius: 50%;
            animation: float 18s ease-in-out infinite alternate;
          }

          @keyframes float {
            from { transform: translateY(0px) translateX(0px) scale(1); }
            to   { transform: translateY(-120px) translateX(80px) scale(1.2); }
          }

          /* Randomized positions */
          .shape-0 { top: 10%; left: 5%; animation-duration: 16s; }
          .shape-1 { top: 60%; left: 10%; animation-duration: 20s; }
          .shape-2 { top: 30%; left: 70%; animation-duration: 22s; }
          .shape-3 { top: 80%; left: 50%; animation-duration: 18s; }
          .shape-4 { top: 20%; left: 85%; animation-duration: 25s; }
          .shape-5 { top: 70%; left: 75%; animation-duration: 19s; }

          .shape-6 { top: 40%; left: 25%; animation-duration: 24s; }
          .shape-7 { top: 15%; left: 55%; animation-duration: 21s; }
          .shape-8 { top: 85%; left: 15%; animation-duration: 23s; }
          .shape-9 { top: 50%; left: 90%; animation-duration: 17s; }
          .shape-10 { top: 5%; left: 40%; animation-duration: 26s; }
          .shape-11 { top: 90%; left: 40%; animation-duration: 20s; }
        `}
            </style>
        </div>
    );
};

export default BackgroundShapes;

import React, { useEffect, useState } from "react";
import "./snow.css";

const Snowfall = () => {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const generateSnowflakes = () => {
      const snowflakesArray = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        startX: Math.random() * 100 + "vw", // Random horizontal start position
        animationDuration: Math.random() * 5 + 5 + "s", // Duration between 5s and 10s
        animationDelay: Math.random() * 10 + "s", // Staggered start times
        fontSize: Math.random() * 10 + 10 + "px", // Random size between 10px and 20px
      }));
      setSnowflakes(snowflakesArray);
    };

    generateSnowflakes();
  }, []);

  return (
    <>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.startX,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            fontSize: flake.fontSize,
          }}
        >
          ❄
        </div>
      ))}
    </>
  );
};

export default Snowfall;

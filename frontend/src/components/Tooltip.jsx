import React, { useState, useRef, useEffect } from "react";

export default function Tooltip({ children, text, position = "top" }) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Проверяем, не выходит ли тултип за края
      let newPosition = position;

      if (position === "top") {
        if (triggerRect.top - tooltipRect.height < 0) {
          newPosition = "bottom";
        }
      } else if (position === "bottom") {
        if (triggerRect.bottom + tooltipRect.height > viewportHeight) {
          newPosition = "top";
        }
      } else if (position === "left") {
        if (triggerRect.left - tooltipRect.width < 0) {
          newPosition = "right";
        }
      } else if (position === "right") {
        if (triggerRect.right + tooltipRect.width > viewportWidth) {
          newPosition = "left";
        }
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  if (!text) return children;

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute ${positionClasses[actualPosition]} z-[100] px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap pointer-events-none backdrop-blur-sm`}
          style={{ zIndex: 9999 }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
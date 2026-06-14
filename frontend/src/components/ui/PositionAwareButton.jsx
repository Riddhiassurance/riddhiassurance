import React, { useRef, useState } from 'react'

const variants = {
  primary: 'bg-primary text-white border-primary',
  dark: 'bg-gray-950 text-white border-gray-950',
  light: 'bg-white text-gray-900 border-gray-200'
}

const fills = {
  primary: 'rgba(15, 23, 42, 0.22)',
  dark: 'rgba(37, 99, 235, 0.38)',
  light: 'rgba(59, 130, 246, 0.18)'
}

const PositionAwareButton = ({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  variant = 'primary'
}) => {
  const buttonRef = useRef(null)
  const [hover, setHover] = useState({ active: false, x: 0, y: 0 })

  const setPointer = (event, active = true) => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({
      active,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    })
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(event) => setPointer(event, true)}
      onMouseMove={(event) => setPointer(event, true)}
      onMouseLeave={(event) => setPointer(event, false)}
      className={`relative isolate overflow-hidden rounded-full border px-6 py-3 text-sm font-semibold shadow-sm transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full transition-transform duration-[450ms] ease-out"
        style={{
          left: hover.x,
          top: hover.y,
          width: 24,
          height: 24,
          background: fills[variant],
          transform: `translate(-50%, -50%) scale(${hover.active ? 18 : 0})`,
          opacity: hover.active ? 1 : 0
        }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  )
}

export default PositionAwareButton

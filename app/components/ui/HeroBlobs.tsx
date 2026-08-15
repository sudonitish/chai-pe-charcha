export function HeroBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="blob" style={{ width: 180, height: 180, background: "var(--accent-soft)", top: -60, right: -40, animationDelay: "0s", opacity: 0.6 }} />
      <div className="blob" style={{ width: 130, height: 130, background: "var(--accent-soft)", bottom: -50, right: 60, animationDelay: "3s", opacity: 0.5 }} />
    </div>
  )
}

// Logo SETLAND: dua himpunan yang beririsan (diagram Venn)
export default function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="18" cy="24" r="14" fill="#6366f1" fillOpacity=".85" />
      <circle cx="30" cy="24" r="14" fill="#06b6d4" fillOpacity=".75" />
    </svg>
  )
}

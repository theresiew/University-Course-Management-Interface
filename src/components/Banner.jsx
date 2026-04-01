function Banner({ message, tone }) {
  const toneClasses = {
    success: 'border-success-100 bg-success-100/80 text-success-700',
    danger: 'border-danger-100 bg-danger-100/80 text-danger-700',
    info: 'border-brand-100 bg-brand-50 text-brand-700',
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${toneClasses[tone]}`}>
      {message}
    </div>
  )
}

export default Banner

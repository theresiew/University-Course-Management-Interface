function DetailItem({ label, multiLine = false, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 text-sm text-slate-700 ${
          multiLine ? 'whitespace-pre-wrap leading-6' : 'break-all'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export default DetailItem

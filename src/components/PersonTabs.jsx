export default function PersonTabs({ active, onChange, colorA = 'personA', colorB = 'personB' }) {
  return (
    <div className="flex bg-gray-100 rounded-btn p-1 w-fit">
      <button
        onClick={() => onChange('A')}
        className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
          active === 'A'
            ? 'bg-white text-personA shadow-sm'
            : 'text-text2 hover:text-text1'
        }`}
      >
        Person A
      </button>
      <button
        onClick={() => onChange('B')}
        className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
          active === 'B'
            ? 'bg-white text-personB shadow-sm'
            : 'text-text2 hover:text-text1'
        }`}
      >
        Person B
      </button>
    </div>
  )
}

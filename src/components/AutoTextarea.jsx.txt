import { useEffect, useRef } from 'react'

export default function AutoTextarea({ value, onChange, placeholder, style = {} }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      style={{
        width: '100%',
        resize: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #ddd',
        fontSize: 14,
        fontFamily: 'inherit',
        lineHeight: 1.5,
        outline: 'none',
        background: '#fafafa',
        ...style
      }}
    />
  )
}
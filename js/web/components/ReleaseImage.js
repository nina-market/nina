import { useState } from 'react'
import NextImage from 'next/image'

export default function ReleaseImage({ src, height, width, layout, priority }) {
  const [ready, setReady] = useState(false)

  const handleLoad = (event) => {
    event.persist()
    if (event.target.srcset) {
      setReady(true)
    }
  }

  return (
    <div
      style={{
        opacity: ready ? 1 : 0,
        transition: 'opacity .3s ease-in-out',
      }}
    >
      <NextImage
        src={src}
        height={height}
        width={width}
        priority={priority}
        layout={layout}
        onLoad={handleLoad}
      />
    </div>
  )
}

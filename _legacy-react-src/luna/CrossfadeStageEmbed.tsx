import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { StageEmbedFrame } from './StageEmbedFrame'

export const STAGE_STEP_CROSSFADE_MS = 320

type Slot = 0 | 1

type CrossfadeStageEmbedProps = {
  src: string
  title: string
  className?: string
}

/**
 * Keeps two iframe slots and crossfades between them so the previous step
 * stays visible while the next URL loads (avoids the black flash on src swap).
 */
export function CrossfadeStageEmbed({ src, title, className }: CrossfadeStageEmbedProps) {
  const [activeSlot, setActiveSlot] = useState<Slot>(0)
  const [urls, setUrls] = useState<[string, string]>(() => [src, src])
  const activeSlotRef = useRef<Slot>(0)
  const urlsRef = useRef<[string, string]>([src, src])
  const pendingSlotRef = useRef<Slot | null>(null)
  const targetSrcRef = useRef(src)

  useEffect(() => {
    targetSrcRef.current = src
    const active = activeSlotRef.current

    if (src === urlsRef.current[active]) return

    const nextSlot: Slot = active === 0 ? 1 : 0

    if (urlsRef.current[nextSlot] === src) {
      pendingSlotRef.current = null
      activeSlotRef.current = nextSlot
      setActiveSlot(nextSlot)
      return
    }

    pendingSlotRef.current = nextSlot
    const nextUrls: [string, string] = [...urlsRef.current]
    nextUrls[nextSlot] = src
    urlsRef.current = nextUrls
    setUrls(nextUrls)
  }, [src])

  const onSlotReady = (slot: Slot) => {
    if (urlsRef.current[slot] !== targetSrcRef.current) return
    if (pendingSlotRef.current !== slot) return
    pendingSlotRef.current = null
    activeSlotRef.current = slot
    setActiveSlot(slot)
  }

  return (
    <div
      className="stepscreen-embed-crossfade"
      style={{ '--stage-step-crossfade-ms': `${STAGE_STEP_CROSSFADE_MS}ms` } as CSSProperties}
    >
      {([0, 1] as const).map((slot) => (
        <StageEmbedFrame
          key={slot}
          className={`${className ?? ''} stepscreen-embed-layer${
            slot === activeSlot ? ' is-active' : ''
          }`}
          src={urls[slot]}
          title={title}
          active={slot === activeSlot}
          onReady={() => onSlotReady(slot)}
        />
      ))}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { postStageEmbedStep, registerStageEmbedFrame } from '../store/stageEmbedBridge'
import { useFlowStore } from '../store/flowStore'

type StageEmbedFrameProps = {
  src: string
  title: string
  className?: string
  /** When false, iframe is preloading off-screen and does not own the embed bridge. */
  active?: boolean
  onReady?: () => void
}

export function StageEmbedFrame({
  src,
  title,
  className,
  active = true,
  onReady,
}: StageEmbedFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!active) return
    registerStageEmbedFrame(iframeRef.current)
    return () => registerStageEmbedFrame(null)
  }, [active])

  useEffect(() => {
    const frame = iframeRef.current
    if (!frame) return
    try {
      const target = new URL(src, window.location.href).href
      if (frame.src !== target) {
        frame.src = src
      }
    } catch {
      frame.src = src
    }
  }, [src])

  return (
    <iframe
      ref={iframeRef}
      className={className}
      src={src}
      title={title}
      allow="fullscreen"
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={() => {
        onReady?.()
        if (!active) return
        const { stepIndex } = useFlowStore.getState()
        postStageEmbedStep(stepIndex + 1)
      }}
    />
  )
}

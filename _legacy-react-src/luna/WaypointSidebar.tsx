import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { FlowSidebarItem } from '../flowSidebarItems'
import './waypointSidebar.css'

const DEFAULT_DRAWER_BG = '/bg-img/bg-img3.jpg'

function normalizeActiveId(
  items: FlowSidebarItem[],
  preferredId?: string,
): string {
  if (!items.length) return ''
  if (preferredId != null && items.some((i) => i.id === preferredId)) {
    return preferredId
  }
  return items[0].id
}

function InfoIcon() {
  return (
    <svg
      className="wp-sidebar__info-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

type WaypointSidebarProps = {
  items: FlowSidebarItem[]
  expanded: boolean
  onExpandedChange: (next: boolean) => void
  initialActiveId?: string
  onActiveItemChange?: (id: string) => void
  railLabel?: string
  graphicSrc?: string
  infoHref?: string
  infoOpenInNewTab?: boolean
  infoTooltip?: string
  onInfo?: () => void
}

export function WaypointSidebar({
  items,
  expanded,
  onExpandedChange,
  initialActiveId,
  onActiveItemChange,
  railLabel = 'Waypoint guide',
  graphicSrc = DEFAULT_DRAWER_BG,
  infoHref,
  infoOpenInNewTab = true,
  infoTooltip = 'More Information',
  onInfo,
}: WaypointSidebarProps) {
  const [activeId, setActiveId] = useState(() =>
    normalizeActiveId(items, initialActiveId),
  )
  const previewListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveId((prev) => normalizeActiveId(items, prev))
  }, [items])

  useEffect(() => {
    if (initialActiveId === undefined) return
    setActiveId(normalizeActiveId(items, initialActiveId))
  }, [initialActiveId, items])

  const activeItem = items.find((item) => item.id === activeId) ?? items[0]
  const activeStepNumber =
    Math.max(0, items.findIndex((item) => item.id === activeId)) + 1

  const toggleExpanded = useCallback(() => {
    onExpandedChange(!expanded)
  }, [expanded, onExpandedChange])

  const selectItem = useCallback(
    (id: string) => {
      setActiveId(id)
      onActiveItemChange?.(id)
    },
    [onActiveItemChange],
  )

  if (!items.length) {
    return null
  }

  const drawerStyle: CSSProperties = {
    backgroundImage: `url(${graphicSrc})`,
    backgroundSize: 'cover',
    backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat',
  }

  const trimmedInfoHref = typeof infoHref === 'string' ? infoHref.trim() : ''
  const isInfoLink = trimmedInfoHref.length > 0

  return (
    <div className={`wp-sidebar${expanded ? ' is-expanded' : ''}`}>
      <div className="wp-sidebar__host">
        <section
          className={`wp-sidebar__drawer${expanded ? ' is-open' : ''}`}
          style={drawerStyle}
          aria-hidden={!expanded}
        >
          <div className={`wp-sidebar__panel${expanded ? ' is-open' : ''}`}>
            <div className="wp-sidebar__panel-content">
              <div className="wp-sidebar__stack">
                <div className="wp-sidebar__stack-body">
                  <div className="wp-sidebar__intro">
                    <div className="wp-sidebar__hero" aria-hidden="true">
                      <div
                        className={
                          activeItem.heroImageUrl
                            ? 'wp-sidebar__hero-plate wp-sidebar__hero-plate--image'
                            : 'wp-sidebar__hero-plate wp-sidebar__hero-plate--indexed'
                        }
                        style={{ backgroundColor: activeItem.swatch }}
                      >
                        {activeItem.heroImageUrl ? (
                          <img
                            src={activeItem.heroImageUrl}
                            alt=""
                            className="wp-sidebar__hero-image"
                            draggable={false}
                          />
                        ) : (
                          <span className="wp-sidebar__hero-index">
                            {activeStepNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="wp-sidebar__copy">
                      <h2 className="wp-sidebar__title">{activeItem.title}</h2>
                      <p className="wp-sidebar__description">
                        {activeItem.description}
                      </p>
                      {isInfoLink || onInfo ? (
                        <div className="wp-sidebar__actions">
                          {isInfoLink ? (
                            <a
                              className="wp-sidebar__info"
                              href={trimmedInfoHref}
                              target={infoOpenInNewTab ? '_blank' : undefined}
                              rel={
                                infoOpenInNewTab
                                  ? 'noopener noreferrer'
                                  : undefined
                              }
                              title={infoTooltip}
                              aria-label={
                                infoOpenInNewTab
                                  ? `${infoTooltip} (opens in new tab)`
                                  : infoTooltip
                              }
                              onClick={() => onInfo?.()}
                            >
                              <InfoIcon />
                            </a>
                          ) : onInfo ? (
                            <button
                              type="button"
                              className="wp-sidebar__info"
                              title={infoTooltip}
                              aria-label={infoTooltip}
                              onClick={() => onInfo()}
                            >
                              <InfoIcon />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="wp-sidebar__preview">
                    <div className="wp-sidebar__preview-chrome" aria-hidden="true">
                      <span className="wp-sidebar__preview-chrome-line" />
                      <span className="wp-sidebar__preview-chrome-line wp-sidebar__preview-chrome-line--right" />
                    </div>
                    <div className="wp-sidebar__preview-list" ref={previewListRef}>
                      <div className="wp-sidebar__preview-steps">
                        {items.map((card, index) => (
                          <button
                            key={card.id}
                            type="button"
                            className={`wp-sidebar__card${
                              card.id === activeId ? ' is-active' : ''
                            }`}
                            aria-label={`${card.step}: ${card.title}`}
                            aria-pressed={card.id === activeId}
                            onClick={() => selectItem(card.id)}
                          >
                            <span
                              className="wp-sidebar__card-media"
                              style={{ backgroundColor: card.swatch }}
                            >
                              {card.thumbUrl ? (
                                <span
                                  className="wp-sidebar__thumb wp-sidebar__thumb--image"
                                  aria-hidden
                                >
                                  <img
                                    src={card.thumbUrl}
                                    alt=""
                                    className="wp-sidebar__thumb-image"
                                    draggable={false}
                                  />
                                </span>
                              ) : (
                                <span className="wp-sidebar__thumb" aria-hidden>
                                  <span className="wp-sidebar__thumb-index">
                                    {index + 1}
                                  </span>
                                </span>
                              )}
                            </span>
                            <span className="wp-sidebar__card-body">
                              <span className="wp-sidebar__card-step">
                                {card.step}
                              </span>
                              <span className="wp-sidebar__card-desc">
                                {card.previewDescription ?? card.description}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="wp-sidebar__rule-gutter" aria-hidden="true">
                  <div className="wp-sidebar__rule-line" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          className="wp-sidebar__rail"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label="Toggle sidebar"
        >
          <span className="wp-sidebar__rail-dot" />
          <span className="wp-sidebar__rail-label">{railLabel}</span>
          <span className="wp-sidebar__rail-dot" />
        </button>
      </div>
    </div>
  )
}

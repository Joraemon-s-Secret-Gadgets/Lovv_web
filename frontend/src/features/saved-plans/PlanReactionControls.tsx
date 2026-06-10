import type { PlanReactionType } from '../../shared/types/app'

type PlanReactionControlsProps = {
  planId: string
  reaction: PlanReactionType
  onSelectReaction: (planId: string, reaction: Exclude<PlanReactionType, null>) => void
  pending?: boolean
  errorMessage?: string | null
  compact?: boolean
  labelledBy?: string
}

const reactionOptions: {
  type: Exclude<PlanReactionType, null>
  label: string
  activeLabel: string
}[] = [
  { type: 'like', label: '좋아요', activeLabel: '좋아요 선택됨' },
  { type: 'dislike', label: '싫어요', activeLabel: '싫어요 선택됨' },
]

export function PlanReactionControls({
  planId,
  reaction,
  onSelectReaction,
  pending = false,
  errorMessage = null,
  compact = false,
  labelledBy,
}: PlanReactionControlsProps) {
  const helperMessage = errorMessage ?? (pending ? '반응 저장 중입니다.' : null)

  return (
    <div className="min-w-0" data-testid={`plan-reaction-controls-${planId}`}>
      <div
        role="group"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : '일정 반응 선택'}
        className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 max-sm:grid-cols-1'}`}
      >
        {reactionOptions.map((option) => {
          const isActive = reaction === option.type

          return (
            <button
              key={option.type}
              type="button"
              aria-pressed={isActive}
              disabled={pending}
              onClick={() => onSelectReaction(planId, option.type)}
              className={`inline-flex min-h-11 items-center justify-center rounded-[8px] border px-4 text-sm font-black text-[#33271E] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33271E] disabled:cursor-wait disabled:opacity-65 ${
                isActive
                  ? 'border-[#A92B10] bg-[#F36B12] shadow-[0_10px_22px_-18px_rgba(51,39,30,0.48)] hover:bg-[#FF8A2A]'
                  : 'border-[#F3B489] bg-[#fffffa] hover:border-[#F36B12] hover:bg-[#FFE0CA]'
              }`}
            >
              {isActive ? option.activeLabel : option.label}
            </button>
          )
        })}
      </div>
      {helperMessage ? (
        <p
          aria-live="polite"
          className={`mt-2 break-keep text-[12px] font-bold leading-5 ${
            errorMessage ? 'text-[#A92B10]' : 'text-[#6E5A50]'
          }`}
        >
          {helperMessage}
        </p>
      ) : null}
    </div>
  )
}

import type { PlanReactionType, SavedPlan } from '../../shared/types/app'

export const savedPlansStorageKey = 'lovv.savedPlans'
export const likedPlanIdsStorageKey = 'lovv.likedPlanIds'
export const planReactionsStorageKey = 'lovv.planReactions'

export type PlanReactionMap = Record<string, Exclude<PlanReactionType, null>>

export const getNextPlanReaction = (
  currentReaction: PlanReactionType,
  clickedReaction: Exclude<PlanReactionType, null>,
): PlanReactionType => (currentReaction === clickedReaction ? null : clickedReaction)

export const readStoredSavedPlans = (): SavedPlan[] => {
  try {
    const rawPlans = localStorage.getItem(savedPlansStorageKey)

    if (!rawPlans) {
      return []
    }

    const parsedPlans = JSON.parse(rawPlans)

    if (!Array.isArray(parsedPlans)) {
      return []
    }

    return parsedPlans.filter(
      (plan): plan is SavedPlan =>
        typeof plan?.id === 'string' &&
        typeof plan?.ownerId === 'string' &&
        typeof plan?.title === 'string' &&
        typeof plan?.cityPair === 'string' &&
        typeof plan?.durationLabel === 'string' &&
        (Array.isArray(plan?.days) || Array.isArray(plan?.stops)),
    )
  } catch {
    return []
  }
}

export const readStoredLikedPlanIds = (): string[] => {
  try {
    const rawPlanIds = localStorage.getItem(likedPlanIdsStorageKey)

    if (!rawPlanIds) {
      return []
    }

    const parsedPlanIds = JSON.parse(rawPlanIds)

    return Array.isArray(parsedPlanIds)
      ? parsedPlanIds.filter((planId): planId is string => typeof planId === 'string')
      : []
  } catch {
    return []
  }
}

export const readStoredPlanReactions = (): PlanReactionMap => {
  const reactions: PlanReactionMap = {}

  try {
    const rawReactions = localStorage.getItem(planReactionsStorageKey)

    if (rawReactions) {
      const parsedReactions = JSON.parse(rawReactions)

      if (parsedReactions && typeof parsedReactions === 'object' && !Array.isArray(parsedReactions)) {
        Object.entries(parsedReactions).forEach(([planId, reaction]) => {
          if (reaction === 'like' || reaction === 'dislike') {
            reactions[planId] = reaction
          }
        })
      }
    }
  } catch {
    // Keep the mock adapter resilient to malformed local data.
  }

  readStoredLikedPlanIds().forEach((planId) => {
    reactions[planId] ??= 'like'
  })

  return reactions
}

export const writeStoredPlanReactions = (reactions: PlanReactionMap) => {
  localStorage.setItem(planReactionsStorageKey, JSON.stringify(reactions))
  localStorage.setItem(
    likedPlanIdsStorageKey,
    JSON.stringify(
      Object.entries(reactions)
        .filter(([, reaction]) => reaction === 'like')
        .map(([planId]) => planId),
    ),
  )
}

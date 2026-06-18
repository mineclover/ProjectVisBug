let muteDepth = 0

export function muteMutations() {
  muteDepth += 1
}

export function unmuteMutations() {
  if (muteDepth > 0) muteDepth -= 1
}

export function mutationsMuted() {
  return muteDepth > 0
}

/** 테스트용 */
export function resetMutationMute() {
  muteDepth = 0
}

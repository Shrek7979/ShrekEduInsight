import React from 'react'
import type { SubjectKey, Topic } from '@/lib/feed'
import BioVisual, { hasTopicVisual as hasBio } from './visuals/bio/TopicVisual'
import ChemVisual, { hasTopicVisual as hasChem } from './visuals/chem/TopicVisual'
import MathVisual, { hasTopicVisual as hasMath } from './visuals/math/TopicVisual'
import PhysVisual, { hasTopicVisual as hasPhys } from './visuals/phys/TopicVisual'

// 주제 카드 애니메이션은 과목 사이트의 것을 그대로 씀. 'math:topic-basel' → 수학의 'topic-basel'
const VISUALS: Record<SubjectKey, [(props: { topicId: string }) => JSX.Element | null, (id: string) => boolean]> = {
  math: [MathVisual, hasMath],
  phys: [PhysVisual, hasPhys],
  chem: [ChemVisual, hasChem],
  bio: [BioVisual, hasBio],
}

const baseId = (topic: Topic) => topic.id.slice(topic.id.indexOf(':') + 1)

export const hasTopicVisual = (topic: Topic) => VISUALS[topic.subject][1](baseId(topic))

export default function TopicVisual({ topic }: { topic: Topic }) {
  const [Visual] = VISUALS[topic.subject]
  return <Visual topicId={baseId(topic)} />
}

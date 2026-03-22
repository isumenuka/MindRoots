export const WEIGHT_COLORS = {
  profound: '#f87171',
  high:     '#fb923c',
  medium:   '#facc15',
  low:      '#4ade80',
}

export const getNodeDisplayInfo = (node) => {
  if (!node) return { title: 'Insight', color: '#818CF8', subtitle: '', primaryText: '' }
  
  const type = node.node_type || 'BELIEF_NODE'
  switch (type) {
    case 'BELIEF_NODE':
      return {
        icon: 'local_fire_department',
        title: 'Excavated Belief', color: '#818CF8',
        subtitle: `${node.origin_year || ''}${node.origin_year && node.origin_person ? ' • ' : ''}${node.origin_person || ''}`,
        primaryText: node.belief,
        tooltip1Title: 'THE CORE COST', tooltip1Val: node.cost_today,
        tooltip2Title: 'MODERN TRIGGER', tooltip2Val: node.trigger_event
      }
    case 'BLOCKER_NODE':
      return {
        icon: 'block',
        title: 'Goal Blocker', color: '#F87171', subtitle: 'Current Obstacle',
        primaryText: node.target_goal,
        tooltip1Title: 'PERCEIVED OBSTACLE', tooltip1Val: node.perceived_obstacle
      }
    case 'CRITIC_PERSONA_NODE':
      return {
        icon: 'record_voice_over',
        title: 'Inner Critic', color: '#FBBF24', subtitle: `"${node.persona_name || 'Critic'}"`,
        primaryText: node.common_catchphrases || 'Criticizes',
        tooltip1Title: 'PRIMARY UNDERLYING FEAR', tooltip1Val: node.primary_underlying_fear
      }
    case 'COPING_STRATEGY_NODE':
      return {
        icon: 'shield_moon',
        title: 'Coping Strategy', color: '#34D399', subtitle: `Health Rating: ${node.healthiness_rating || '?'}`,
        primaryText: node.coping_behavior,
        tooltip1Title: 'TRIGGER SITUATION', tooltip1Val: node.trigger_situation
      }
    case 'VALUE_NODE':
      return {
        icon: 'diamond',
        title: 'Core Value', color: '#60A5FA', subtitle: `Importance: ${node.importance_level || '?'}`,
        primaryText: node.value_name,
        tooltip1Title: 'CURRENT ALIGNMENT', tooltip1Val: node.current_alignment_status
      }
    case 'STRENGTH_NODE':
      return {
        icon: 'fitness_center',
        title: 'Strength Marker', color: '#A78BFA', subtitle: 'Inherent Strength',
        primaryText: node.strength_name,
        tooltip1Title: 'DEMONSTRATED SCENARIO', tooltip1Val: node.demonstrated_scenario,
        tooltip2Title: 'RELATED BELIEF OVERCOME', tooltip2Val: node.related_belief_overcome
      }
    case 'RELATIONSHIP_PATTERN_NODE':
      return {
        icon: 'hub',
        title: 'Relational Pattern', color: '#F472B6', subtitle: 'Interpersonal Dynamics',
        primaryText: node.pattern_description,
        tooltip1Title: 'TYPICAL ROLE PLAYED', tooltip1Val: node.typical_role_played
      }
    case 'FUTURE_VISION_NODE':
      return {
        icon: 'visibility',
        title: 'Future Vision', color: '#2DD4BF', subtitle: 'Ideal Self',
        primaryText: node.envisioned_scenario,
        tooltip1Title: 'CHANGED BEHAVIOR', tooltip1Val: node.changed_behavior,
        tooltip2Title: 'NEW FEELING', tooltip2Val: node.new_feeling
      }
    case 'TRIGGER_NODE':
      return {
        icon: 'bolt',
        title: 'Emotional Trigger', color: '#FB923C', subtitle: `Intensity: ${node.reaction_intensity || '?'}`,
        primaryText: node.trigger_description,
        tooltip1Title: 'PHYSICAL RESPONSE', tooltip1Val: node.physical_response
      }
    case 'ACTION_STEP_NODE':
      return {
        icon: 'directions_run',
        title: 'Action Step', color: '#A3E635', subtitle: `Deadline: ${node.target_deadline || '?'}`,
        primaryText: node.specific_action,
        tooltip1Title: 'CONFIDENCE LEVEL', tooltip1Val: `${node.user_confidence_level || '?'}/10`
      }
    case 'SESSION_METRIC_NODE':
      return {
        icon: 'analytics',
        title: 'Session Metric', color: '#9CA3AF', subtitle: `Shift: ${node.primary_emotion_shift || '?'}`,
        primaryText: `From ${node.starting_energy_level} to ${node.ending_energy_level}`,
      }
    default:
      return {
        icon: 'psychology',
        title: 'New Insight', color: '#818CF8', subtitle: '',
        primaryText: node.belief || JSON.stringify(node),
      }
  }
}

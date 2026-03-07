export const XP_REWARDS = {
    // Task events
    task_completed: 25,
    task_completed_hard: 50,       // Tasks marked as high priority
    task_failed: 0,                // No XP for failures

    // Summit events
    summit_participated: 15,       // Per agent, per summit round
    summit_resolved: 40,           // When a summit reaches consensus

    // Streak events
    streak_daily: 10,              // Bonus for maintaining streak each day
    streak_milestone_7: 75,        // 7-day milestone
    streak_milestone_14: 150,
    streak_milestone_30: 400,
    streak_milestone_100: 1500,

    // Workflow events
    workflow_run_success: 30,
    workflow_created: 20,

    // System events
    provider_connected: 15,
    all_agents_online: 10,         // Daily bonus when all agents are online

    // Daily mission completion
    mission_completed_easy: 25,
    mission_completed_medium: 50,
    mission_completed_hard: 100,
    all_missions_completed: 75,    // Bonus for clearing all daily missions
} as const;

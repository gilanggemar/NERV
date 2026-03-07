// ─── Workflow Execution Engine ───────────────────────────────────────────────

import { db } from '@/lib/db';
import type { Workflow, WorkflowRun, WorkflowStep, StepResult, RunStatus } from './types';

/**
 * Get the topological execution order for workflow steps.
 * Returns steps grouped into parallel execution tiers.
 */
export function getExecutionOrder(steps: WorkflowStep[]): WorkflowStep[][] {
    const resolved = new Set<string>();
    const result: WorkflowStep[][] = [];
    const remaining = [...steps];

    while (remaining.length > 0) {
        const tier = remaining.filter((step) =>
            step.dependsOn.every((dep) => resolved.has(dep))
        );

        if (tier.length === 0 && remaining.length > 0) {
            result.push(remaining.splice(0));
            break;
        }

        for (const step of tier) {
            resolved.add(step.id);
            remaining.splice(remaining.indexOf(step), 1);
        }

        result.push(tier);
    }

    return result;
}

/**
 * Find steps that can run next (all dependencies completed).
 */
export function getNextRunnableSteps(
    steps: WorkflowStep[],
    stepResults: StepResult[]
): WorkflowStep[] {
    const completedIds = new Set(
        stepResults.filter((r) => r.status === 'completed').map((r) => r.stepId)
    );
    const startedIds = new Set(
        stepResults.filter((r) => r.status === 'running' || r.status === 'completed').map((r) => r.stepId)
    );

    return steps.filter((step) => {
        if (startedIds.has(step.id)) return false;
        return step.dependsOn.every((dep) => completedIds.has(dep));
    });
}

/**
 * Create a new workflow run.
 */
export async function createWorkflowRun(workflowId: string, triggeredBy: 'manual' | 'schedule'): Promise<string> {
    const id = crypto.randomUUID();

    // Get workflow to populate initial step results
    const { data: wf, error } = await db.from('workflows').select('*').eq('id', workflowId).single();
    if (error || !wf) throw new Error(`Workflow ${workflowId} not found`);

    // steps is already parsed from jsonb
    const steps: WorkflowStep[] = Array.isArray(wf.steps) ? wf.steps : JSON.parse(wf.steps);
    const stepResults: StepResult[] = steps.map((s) => ({
        stepId: s.id,
        status: 'pending' as const,
    }));

    await db.from('workflow_runs').insert({
        id,
        workflow_id: workflowId,
        status: 'running',
        step_results: stepResults, // jsonb
        triggered_by: triggeredBy,
        started_at: new Date().toISOString(),
        completed_at: null,
    });

    // Update last run timestamp
    await db.from('workflows').update({
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }).eq('id', workflowId);

    return id;
}

/**
 * Update a step result within a run.
 */
export async function updateStepResult(runId: string, stepId: string, update: Partial<StepResult>): Promise<void> {
    const { data: run } = await db.from('workflow_runs').select('*').eq('id', runId).single();
    if (!run) return;

    const results: StepResult[] = Array.isArray(run.step_results) ? run.step_results : JSON.parse(run.step_results);
    const idx = results.findIndex((r) => r.stepId === stepId);
    if (idx >= 0) {
        results[idx] = { ...results[idx], ...update };
    }

    // Check if all steps are done
    const allDone = results.every((r) => r.status === 'completed' || r.status === 'failed' || r.status === 'skipped');
    const anyFailed = results.some((r) => r.status === 'failed');

    const runStatus: RunStatus = allDone ? (anyFailed ? 'failed' : 'completed') : 'running';

    await db.from('workflow_runs').update({
        step_results: results, // jsonb
        status: runStatus,
        completed_at: allDone ? new Date().toISOString() : null,
    }).eq('id', runId);
}

/**
 * Get run with parsed fields.
 */
export async function getWorkflowRun(runId: string): Promise<WorkflowRun | null> {
    const { data: row } = await db.from('workflow_runs').select('*').eq('id', runId).single();
    if (!row) return null;

    return {
        id: row.id,
        workflowId: row.workflow_id,
        status: row.status as RunStatus,
        stepResults: Array.isArray(row.step_results) ? row.step_results : JSON.parse(row.step_results),
        triggeredBy: row.triggered_by as 'manual' | 'schedule',
        startedAt: row.started_at,
        completedAt: row.completed_at ?? undefined,
    };
}

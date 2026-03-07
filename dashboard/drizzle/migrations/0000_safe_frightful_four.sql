CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`category` text NOT NULL,
	`condition` text NOT NULL,
	`xp_reward` integer NOT NULL,
	`rarity` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_provider_config` (
	`agent_id` text PRIMARY KEY NOT NULL,
	`primary_provider_id` text,
	`backup_provider_id` text,
	`model_id` text,
	`config_json` text,
	FOREIGN KEY (`primary_provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`backup_provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_xp` (
	`agent_id` text PRIMARY KEY NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`xp_to_next_level` integer DEFAULT 100 NOT NULL,
	`rank` text DEFAULT 'INITIATE' NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`avatar` text
);
--> statement-breakpoint
CREATE TABLE `alert_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`condition` text NOT NULL,
	`threshold` integer NOT NULL,
	`severity` text NOT NULL,
	`agent_id` text,
	`channels` text NOT NULL,
	`is_active` integer DEFAULT 1,
	`last_triggered_at` integer,
	`cooldown_ms` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`permissions` text NOT NULL,
	`last_used_at` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`agent_id` text NOT NULL,
	`action` text NOT NULL,
	`details` text,
	`diff_payload` text,
	`session_id` text,
	`summit_id` text
);
--> statement-breakpoint
CREATE TABLE `conversation_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`token_count` integer,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`title` text NOT NULL,
	`message_count` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_missions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`target` integer NOT NULL,
	`current` integer DEFAULT 0 NOT NULL,
	`xp_reward` integer NOT NULL,
	`difficulty` text NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `knowledge_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text,
	`content` text NOT NULL,
	`size_bytes` integer,
	`indexed` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `knowledge_fragments` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`content` text NOT NULL,
	`source` text NOT NULL,
	`tags` text,
	`importance` integer DEFAULT 5,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mcp_servers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`transport` text NOT NULL,
	`description` text,
	`api_key` text,
	`status` text NOT NULL,
	`tools` text NOT NULL,
	`assigned_agents` text NOT NULL,
	`last_connected_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`agent_id` text,
	`is_read` integer DEFAULT 0,
	`action_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operations_streak` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`streak_history` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `platform_bridges` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`api_key` text,
	`webhook_url` text,
	`settings` text NOT NULL,
	`assigned_agents` text NOT NULL,
	`last_synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prompt_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`color` text DEFAULT '#6B7280' NOT NULL,
	`category` text DEFAULT 'Uncategorized' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `provider_models` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`model_id` text NOT NULL,
	`display_name` text NOT NULL,
	`context_window` integer,
	`pricing_input` text,
	`pricing_output` text,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`encrypted_api_key` text,
	`base_url` text,
	`is_active` integer DEFAULT 1,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduled_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`cron_expression` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`last_run_at` integer,
	`next_run_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduler_events` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text,
	`agent_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`scheduled_date` text NOT NULL,
	`scheduled_time` text,
	`duration_minutes` integer DEFAULT 60,
	`recurrence_type` text DEFAULT 'none',
	`recurrence_interval` integer DEFAULT 1,
	`recurrence_end_date` text,
	`recurrence_days_of_week` text,
	`status` text DEFAULT 'scheduled',
	`last_run_at` integer,
	`next_run_at` integer,
	`run_count` integer DEFAULT 0,
	`color` text,
	`priority` text DEFAULT 'medium',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `summit_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`summit_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`content` text NOT NULL,
	`round_number` integer NOT NULL,
	`sentiment` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`summit_id`) REFERENCES `summits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `summits` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`status` text NOT NULL,
	`consensus_plan` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` text NOT NULL,
	`content` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`agent_id` text NOT NULL,
	`status` text NOT NULL,
	`priority` text DEFAULT 'MEDIUM',
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `telemetry_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`agent_id` text NOT NULL,
	`provider` text,
	`model` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`cost_usd` text,
	`latency_ms` integer,
	`status` text,
	`task_id` text,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `unlocked_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`achievement_id` text NOT NULL,
	`agent_id` text,
	`unlocked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `war_room_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`type` text NOT NULL,
	`agent_id` text,
	`content` text NOT NULL,
	`metadata` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `war_room_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `war_room_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`status` text NOT NULL,
	`decision` text,
	`action_items` text,
	`linked_tasks` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`agent_id` text NOT NULL,
	`event_filter` text DEFAULT '*',
	`secret` text,
	`is_active` integer DEFAULT 1,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflow_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`status` text NOT NULL,
	`step_results` text NOT NULL,
	`triggered_by` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`steps` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`steps` text NOT NULL,
	`schedule` text,
	`status` text NOT NULL,
	`last_run_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`source_id` text,
	`timestamp` integer NOT NULL
);

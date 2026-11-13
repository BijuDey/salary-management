CREATE TABLE `countries` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text NOT NULL,
	`usd_rate` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_code` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`job_title` text NOT NULL,
	`department` text NOT NULL,
	`country_code` text NOT NULL,
	`annual_salary` integer NOT NULL,
	`employment_type` text NOT NULL,
	`hire_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`country_code`) REFERENCES `countries`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_code_unique` ON `employees` (`employee_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `employees_country_idx` ON `employees` (`country_code`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`department`);--> statement-breakpoint
CREATE INDEX `employees_job_title_idx` ON `employees` (`job_title`);--> statement-breakpoint
CREATE INDEX `employees_name_idx` ON `employees` (`last_name`,`first_name`);--> statement-breakpoint
CREATE INDEX `employees_hire_date_idx` ON `employees` (`hire_date`);--> statement-breakpoint
CREATE TABLE `salary_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`previous_salary` integer,
	`new_salary` integer NOT NULL,
	`currency` text NOT NULL,
	`reason` text NOT NULL,
	`effective_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `salary_changes_employee_idx` ON `salary_changes` (`employee_id`,`effective_date`);
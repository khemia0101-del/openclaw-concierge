CREATE TABLE `aiInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscriptionId` int NOT NULL,
	`status` enum('provisioning','running','stopped','error','deleted') NOT NULL DEFAULT 'provisioning',
	`deploymentId` varchar(255),
	`doAppId` varchar(255),
	`telegramBotToken` text,
	`telegramBotUsername` varchar(255),
	`aiEmail` varchar(255),
	`aiRole` text,
	`config` json,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiInstances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billingRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscriptionId` int,
	`type` enum('setup_fee','monthly_subscription','usage_credit','refund') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`stripeChargeId` varchar(255),
	`stripeInvoiceId` varchar(255),
	`description` text,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billingRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('starter','pro','business') NOT NULL,
	`status` enum('active','paused','cancelled','pending') NOT NULL DEFAULT 'pending',
	`setupFeePaid` boolean NOT NULL DEFAULT false,
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`monthlyPrice` decimal(10,2),
	`startDate` timestamp,
	`renewalDate` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usageMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`tokensConsumed` int NOT NULL DEFAULT 0,
	`apiCalls` int NOT NULL DEFAULT 0,
	`costUSD` decimal(10,4) DEFAULT '0',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usageMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
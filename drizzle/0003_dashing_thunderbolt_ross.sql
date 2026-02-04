CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`selectedTier` enum('starter','pro','business'),
	`status` enum('lead','checkout_started','paid','abandoned') NOT NULL DEFAULT 'lead',
	`stripeSessionId` varchar(255),
	`userId` int,
	`source` varchar(100) NOT NULL DEFAULT 'onboarding',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_email_unique` UNIQUE(`email`)
);

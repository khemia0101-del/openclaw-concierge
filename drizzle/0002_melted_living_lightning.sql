CREATE TABLE `affiliatePayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`method` enum('paypal','bank_transfer','stripe') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(255),
	`commissionIds` json,
	`notes` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliatePayouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`affiliateCode` varchar(50) NOT NULL,
	`status` enum('active','suspended','pending') NOT NULL DEFAULT 'active',
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '30.00',
	`totalEarnings` decimal(10,2) NOT NULL DEFAULT '0',
	`pendingEarnings` decimal(10,2) NOT NULL DEFAULT '0',
	`paidEarnings` decimal(10,2) NOT NULL DEFAULT '0',
	`paypalEmail` varchar(320),
	`bankDetails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `affiliates_affiliateCode_unique` UNIQUE(`affiliateCode`)
);
--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referralId` int NOT NULL,
	`subscriptionId` int NOT NULL,
	`billingRecordId` int,
	`amount` decimal(10,2) NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL,
	`status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
	`type` enum('setup_fee','monthly_recurring') NOT NULL,
	`paidAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referredUserId` int,
	`referredEmail` varchar(320),
	`status` enum('pending','signed_up','subscribed','cancelled') NOT NULL DEFAULT 'pending',
	`subscriptionId` int,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	`signedUpAt` timestamp,
	`subscribedAt` timestamp,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
